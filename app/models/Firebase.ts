import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

/**
 * Model description here for TypeScript hints.
 */
export const FirebaseModel = types
  .model("Firebase")
  .props({})
  .actions(withSetPropAction)
  .views((self) => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions((self) => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars

export interface Firebase extends Instance<typeof FirebaseModel> {}
export interface FirebaseSnapshotOut extends SnapshotOut<typeof FirebaseModel> {}
export interface FirebaseSnapshotIn extends SnapshotIn<typeof FirebaseModel> {}
export const createFirebaseDefaultModel = () => types.optional(FirebaseModel, {})


