import { Instance, SnapshotOut, types, flow, getRoot } from "mobx-state-tree"
import { Task, TaskModel } from "./Task"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { RootStore } from "./RootStore"
import Parse from "@/lib/Parse/parse"

export const TaskStoreModel = types
  .model("TaskStore")
  .props({
    tasks: types.array(TaskModel),
    isLoading: false,
    error: "",
  })
  .views((store) => ({
    get completedTasks() {
      return store.tasks.filter((task) => task.isCompleted)
    },
    get pendingTasks() {
      return store.tasks.filter((task) => !task.isCompleted)
    },
    get tasksByDueDate() {
      return [...store.tasks].sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    setError(error: string) {
      store.error = error
    },
  }))
  .actions((store) => ({
    fetchTasks: flow(function* fetchTasks() {
      const rootStore = getRoot<RootStore>(store)

      if (!rootStore.authenticationStore.isAuthenticated) {
        store.setError("User not authenticated")
        return []
      }

      store.isLoading = true
      store.error = ""

      try {
        const Task = Parse.Object.extend("Task")
        const query = new Parse.Query(Task)
        query.equalTo("user", Parse.User.current())
        query.ascending("dueDate")

        const results = yield query.find()

        const tasks = results.map((task: any) => ({
          id: task.id,
          title: task.get("title") || "",
          description: task.get("description") || "",
          isCompleted: task.get("isCompleted") || false,
          dueDate: task.get("dueDate")?.toISOString(),
          createdAt: task.get("createdAt")?.toISOString(),
          updatedAt: task.get("updatedAt")?.toISOString(),
        }))

        store.tasks = tasks
        return tasks
      } catch (error: any) {
        console.error("Error fetching tasks:", error)
        store.setError(error.message || "Failed to fetch tasks")
        return []
      } finally {
        store.isLoading = false
      }
    }),

    createTask: flow(function* createTask(taskData: {
      title: string
      description?: string
      dueDate?: string
    }) {
      const rootStore = getRoot<RootStore>(store)

      if (!rootStore.authenticationStore.isAuthenticated) {
        store.setError("User not authenticated")
        return null
      }

      store.isLoading = true
      store.error = ""

      try {
        const Task = Parse.Object.extend("Task")
        const task = new Task()

        task.set("title", taskData.title)
        task.set("description", taskData.description || "")
        task.set("isCompleted", false)
        task.set("user", Parse.User.current())

        if (taskData.dueDate) {
          task.set("dueDate", new Date(taskData.dueDate))
        }

        const result = yield task.save()

        const newTask = {
          id: result.id,
          title: result.get("title"),
          description: result.get("description"),
          isCompleted: result.get("isCompleted"),
          dueDate: result.get("dueDate")?.toISOString(),
          createdAt: result.get("createdAt")?.toISOString(),
          updatedAt: result.get("updatedAt")?.toISOString(),
        }

        store.tasks.push(newTask)
        return newTask
      } catch (error: any) {
        console.error("Error creating task:", error)
        store.setError(error.message || "Failed to create task")
        return null
      } finally {
        store.isLoading = false
      }
    }),

    updateTask: flow(function* updateTask(
      taskId: string,
      updates: Partial<{
        title: string
        description: string
        isCompleted: boolean
        dueDate: string
      }>,
    ) {
      store.isLoading = true
      store.error = ""

      try {
        const Task = Parse.Object.extend("Task")
        const query = new Parse.Query(Task)
        query.equalTo("user", Parse.User.current())

        const task = yield query.get(taskId)

        if (!task) {
          throw new Error("Task not found")
        }

        if (updates.title !== undefined) task.set("title", updates.title)
        if (updates.description !== undefined) task.set("description", updates.description)
        if (updates.isCompleted !== undefined) task.set("isCompleted", updates.isCompleted)
        if (updates.dueDate !== undefined) task.set("dueDate", new Date(updates.dueDate))

        const result = yield task.save()

        // Update local state
        const taskIndex = store.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          const updatedTask = {
            ...store.tasks[taskIndex],
            ...updates,
            updatedAt: result.get("updatedAt")?.toISOString(),
          }
          store.tasks[taskIndex] = updatedTask
        }

        return result
      } catch (error: any) {
        console.error("Error updating task:", error)
        store.setError(error.message || "Failed to update task")
        throw error
      } finally {
        store.isLoading = false
      }
    }),

    deleteTask: flow(function* deleteTask(taskId: string) {
      store.isLoading = true
      store.error = ""

      try {
        const Task = Parse.Object.extend("Task")
        const query = new Parse.Query(Task)
        query.equalTo("user", Parse.User.current())

        const task = yield query.get(taskId)

        if (!task) {
          throw new Error("Task not found")
        }

        yield task.destroy()

        // Update local state
        const taskIndex = store.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          store.tasks.splice(taskIndex, 1)
        }

        return true
      } catch (error: any) {
        console.error("Error deleting task:", error)
        store.setError(error.message || "Failed to delete task")
        return false
      } finally {
        store.isLoading = false
      }
    }),

    toggleTaskCompletion: flow(function* toggleTaskCompletion(this: any, taskId: string) {
      const task = store.tasks.find((t) => t.id === taskId)
      if (!task) return false

      try {
        yield this.updateTask(taskId, { isCompleted: !task.isCompleted })
        return true
      } catch (error) {
        return false
      }
    }),
  }))

export interface TaskStore extends Instance<typeof TaskStoreModel> {}
export interface TaskStoreSnapshot extends SnapshotOut<typeof TaskStoreModel> {}
