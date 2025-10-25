import { Instance, SnapshotOut, types, flow, getRoot } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { RootStore } from "./RootStore"
import Parse from "@/lib/Parse/parse"
import { Alert } from "react-native"
import { AlertTongle, showQueuedAlert } from "@/components"

export const TaskModel = types.model("Task", {
  id: types.string,
  title: types.string,
  description: types.string,
  isCompleted: types.boolean,
  startDate: types.maybe(types.string),
  dueDate: types.maybe(types.string),
  createdAt: types.maybe(types.string),
  updatedAt: types.maybe(types.string),
  taskTime: types.maybe(types.string), // Using maybe string to handle both empty strings and null/undefined
  priority: types.maybe(types.enumeration(["high", "medium", "low"])),
  reminderEnabled: types.maybe(types.boolean),
})
  .actions(withSetPropAction)

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
    get tasksByPriority() {
      return {
        high: store.tasks.filter((task) => task.priority === "high"),
        medium: store.tasks.filter((task) => task.priority === "medium"),
        low: store.tasks.filter((task) => task.priority === "low"),
      }
    },
    get tasksWithReminders() {
      return store.tasks.filter((task) => task.reminderEnabled)
    },
    // NEW: Get tasks for a specific date
    getTasksForDate(date: string | Date) {
      const targetDate = typeof date === "string" ? new Date(date) : date
      const targetDateString = targetDate.toDateString()

      return store.tasks.filter((task) => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        return taskDate.toDateString() === targetDateString
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
        const currentUser = yield Parse.User.currentAsync()
        if (!currentUser) throw new Error("No current user found")
        query.equalTo("user", currentUser)
        query.ascending("dueDate")

        const results = yield query.find()

        const tasks = results.map((task: any) => {
          const taskTimeValue = task.get("taskTime")
          let processedTaskTime: string | undefined = undefined
          
          if (taskTimeValue) {
            // Handle different possible types for taskTime
            if (typeof taskTimeValue === 'string') {
              processedTaskTime = taskTimeValue
            } else if (taskTimeValue instanceof Date) {
              processedTaskTime = taskTimeValue.toISOString()
            } else {
              // Convert to string if it's some other type
              processedTaskTime = String(taskTimeValue)
            }
          }

          return {
            id: task.id,
            title: task.get("title") || "",
            description: task.get("description") || "",
            isCompleted: task.get("isCompleted") || false,
            startDate: task.get("startDate")?.toISOString(),
            dueDate: task.get("dueDate")?.toISOString(),
            taskTime: processedTaskTime,
            priority: task.get("priority") || "medium",
            reminderEnabled: task.get("reminderEnabled") || false,
            createdAt: task.get("createdAt")?.toISOString(),
            updatedAt: task.get("updatedAt")?.toISOString(),
          }
        })

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
      startDate?: string
      taskTime?: Date
      priority?: "high" | "medium" | "low"
      reminderEnabled?: boolean
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
        const currentUser = yield Parse.User.currentAsync()
        if (!currentUser) throw new Error("No current user found")
        task.set("user", currentUser)
        task.set("priority", taskData.priority || "medium")
        task.set("reminderEnabled", taskData.reminderEnabled || false)

        if (taskData.dueDate) {
          task.set("dueDate", new Date(taskData.dueDate))
        }

        if (taskData.startDate) {
          task.set("startDate", new Date(taskData.startDate))
        }

        // Store taskTime as a string in ISO format
        if (taskData.taskTime) {
          task.set("taskTime", taskData.taskTime) // taskData.taskTime is already in ISO string format
        }

        const result = yield task.save()

        const taskTimeValue = result.get("taskTime")
        let processedTaskTime: string | undefined = undefined
        
        if (taskTimeValue) {
          // Handle different possible types for taskTime
          if (typeof taskTimeValue === 'string') {
            processedTaskTime = taskTimeValue
          } else if (taskTimeValue instanceof Date) {
            processedTaskTime = taskTimeValue.toISOString()
          } else {
            // Convert to string if it's some other type
            processedTaskTime = String(taskTimeValue)
          }
        }

        const newTask = {
          id: result.id,
          title: result.get("title"),
          description: result.get("description"),
          isCompleted: result.get("isCompleted"),
          dueDate: result.get("dueDate")?.toISOString(),
          startDate: result.get("startDate")?.toISOString(),
          taskTime: processedTaskTime,
          priority: result.get("priority"),
          reminderEnabled: result.get("reminderEnabled"),
          createdAt: result.get("createdAt")?.toISOString(),
          updatedAt: result.get("updatedAt")?.toISOString(),
        }

        store.tasks.push(newTask)
        return newTask
      } catch (error: any) {
        console.error("Error creating task:", error)

        // showQueuedAlert({
        //   title: "Error creating task:",
        //   message: error.message
        // })

        store.setError(error.message || "Failed to create task")
        return null
      } finally {
        store.isLoading = false
      }
    }),

    // NEW: Add alias method for backward compatibility
    addTask: flow(function* addTask(
      this: any,
      taskData: {
        title: string
        description?: string
        dueDate?: Date
        priority?: "high" | "medium" | "low"
        reminder?: boolean
        [key: string]: any
      },
    ) {
      // Convert the task data to match createTask format
      const convertedData = {
        title: taskData.title,
        description: taskData.description || "",
        dueDate: taskData.dueDate?.toISOString(),
        priority: taskData.priority || "medium",
        reminderEnabled: taskData.reminder || false,
      }

      return yield this.createTask(convertedData)
    }),

    updateTask: flow(function* updateTask(
      taskId: string,
      updates: Partial<{
        title: string
        description: string
        isCompleted: boolean
        startDate: string
        dueDate: string
        taskTime: string
        priority: "high" | "medium" | "low"
        reminderEnabled: boolean
      }>,
    ) {
      store.isLoading = true
      store.error = ""

      try {
        const Task = Parse.Object.extend("Task")
        const query = new Parse.Query(Task)
        const currentUser = yield Parse.User.currentAsync()
        if (!currentUser) throw new Error("No current user found")
        query.equalTo("user", currentUser)

        const task = yield query.get(taskId)

        if (!task) {
          throw new Error("Task not found")
        }

        if (updates.title !== undefined) task.set("title", updates.title)
        if (updates.description !== undefined) task.set("description", updates.description)
        if (updates.isCompleted !== undefined) task.set("isCompleted", updates.isCompleted) // ← FIXED: was "ispleted"
        if (updates.dueDate !== undefined) task.set("dueDate", new Date(updates.dueDate))
        if (updates.startDate !== undefined) task.set("startDate", new Date(updates.startDate))
        if (updates.taskTime !== undefined) task.set("taskTime", updates.taskTime) // taskTime is already in ISO string format
        if (updates.priority !== undefined) task.set("priority", updates.priority)
        if (updates.reminderEnabled !== undefined) task.set("reminderEnabled", updates.reminderEnabled)

        const result = yield task.save()

        // Update local state using MST actions
        const taskIndex = store.tasks.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          const task = store.tasks[taskIndex]
          // Direct property assignment works better than setProp for this case
          if (updates.title !== undefined) task.title = updates.title
          if (updates.description !== undefined) task.description = updates.description
          if (updates.isCompleted !== undefined) task.isCompleted = updates.isCompleted
          if (updates.dueDate !== undefined) task.dueDate = updates.dueDate
          if (updates.startDate !== undefined) task.startDate = updates.startDate
          if (updates.taskTime !== undefined) task.taskTime = updates.taskTime
          if (updates.priority !== undefined) task.priority = updates.priority
          if (updates.reminderEnabled !== undefined) task.reminderEnabled = updates.reminderEnabled
          task.updatedAt = result.get("updatedAt")?.toISOString()
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
        const currentUser = yield Parse.User.currentAsync()
        if (!currentUser) throw new Error("No current user found")
        query.equalTo("user", currentUser)

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
        Alert.alert("Success", "Task deleted successfully!")

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

    toggleTaskReminder: flow(function* toggleTaskReminder(this: any, taskId: string) {
      const task = store.tasks.find((t) => t.id === taskId)
      if (!task) return false

      try {
        yield this.updateTask(taskId, { reminderEnabled: !task.reminderEnabled })
        return true
      } catch (error) {
        return false
      }
    }),

    updateTaskPriority: flow(function* updateTaskPriority(
      this: any,
      taskId: string,
      priority: "high" | "medium" | "low",
    ) {
      try {
        yield this.updateTask(taskId, { priority })
        return true
      } catch (error) {
        return false
      }
    }),

    getTasksForDateAndPriority(date: string, priority: "high" | "medium" | "low") {
      return store.tasks.filter((task) => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate).toDateString()
        const filterDate = new Date(date).toDateString()
        return taskDate === filterDate && task.priority === priority
      })
    },

    getUpcomingReminders(hours: number = 24) {
      const now = new Date()
      const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000)

      return store.tasks.filter((task) => {
        if (!task.dueDate || !task.reminderEnabled || task.isCompleted) return false
        const taskDate = new Date(task.dueDate)
        return taskDate > now && taskDate <= futureTime
      })
    },
  }))

export interface TaskStore extends Instance<typeof TaskStoreModel> {}
export interface TaskStoreSnapshot extends SnapshotOut<typeof TaskStoreModel> {}