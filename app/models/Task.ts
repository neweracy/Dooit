import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"
import Parse from "@/lib/Parse/parse"

export const TaskModel = types
  .model("Task")
  .props({
    id: types.identifier,
    title: "",
    description: "",
    isCompleted: false,
    dueDate: types.maybe(types.string),
    createdAt: types.maybe(types.string),
    updatedAt: types.maybe(types.string),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    toggleComplete() {
      store.isCompleted = !store.isCompleted
    },
    update(updates: Partial<typeof store>) {
      Object.assign(store, updates)
    },
  }))

export interface Task extends Instance<typeof TaskModel> {}
export interface TaskSnapshot extends SnapshotOut<typeof TaskModel> {}
