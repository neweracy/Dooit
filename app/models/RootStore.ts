import { Instance, SnapshotOut, types, flow } from "mobx-state-tree"
import { AuthenticationStoreModel } from "./AuthenticationStore"
import { EpisodeStoreModel } from "./EpisodeStore"
import { TaskStoreModel } from "./TaskStore"
import Parse from "@/lib/Parse/parse"

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  episodeStore: types.optional(EpisodeStoreModel, {}),
  taskStore: types.optional(TaskStoreModel, {}),
  isInitialized: false,
  isInitializing: false,
  initializationError: "",
})
.actions((store) => ({
  initialize: flow(function* initialize() {
    if (store.isInitialized || store.isInitializing) return
    
    store.isInitializing = true
    store.initializationError = ""
    
    try {
      // Initialize Parse if not already initialized
      if (!Parse.applicationId) {
        Parse.initialize(
          process.env.EXPO_PUBLIC_SERVER_URL || "",
          process.env.EXPO_PUBLIC_APP_ID || "",
          process.env.EXPO_PUBLIC_JAVASCRIPT_KEY || ""
        )
      }
      
      // Check for existing session
      const isAuthenticated = yield store.authenticationStore.checkCurrentUser()
      
      // If authenticated, load user data
      if (isAuthenticated) {
        yield store.taskStore.fetchTasks()
      }
      
      store.isInitialized = true
      return true
    } catch (error: any) {
      console.error("Error initializing app:", error)
      store.initializationError = error.message || "Failed to initialize app"
      return false
    } finally {
      store.isInitializing = false
    }
  }),
  
  reset() {
    store.authenticationStore.logout()
    store.taskStore.tasks.clear()
    store.isInitialized = false
  },
}))

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}

/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
