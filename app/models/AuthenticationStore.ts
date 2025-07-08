import { Instance, SnapshotOut, types, flow } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"
import Parse, { User } from "parse"

// Extend the Parse.User type with our custom methods
export interface IAppUser extends Parse.User {
  getEmail(): string
  getUsername(): string
  getSessionToken(): string
}

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
    authPassword: "",
    isLoading: false,
    error: "",
    currentUser: types.maybe(types.frozen<Parse.User>())
  })
  .views((store) => ({
    get isAuthenticated() {
      return !!store.currentUser || !!store.authToken
    },
    get validationError() {
      if (store.authEmail.length === 0) return "Email can't be blank"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.authEmail)) {
        return "Must be a valid email address"
      }
      if (store.authPassword.length < 6) {
        return "Password must be at least 6 characters"
      }
      return ""
    },
  }))
  .actions((store) => ({
    setAuthEmail(value: string) {
      store.authEmail = value.replace(/\s+/g, "")
    },
    setAuthPassword(value: string) {
      store.authPassword = value
    },
    setError(value: string) {
      store.error = value
    },
    setAuthToken(value: string | undefined, authPassword: string) {
      store.authToken = value
    },
    resetAuthState() {
      store.authEmail = ""
      store.authPassword = ""
      store.error = ""
      store.isLoading = false
    },
  }))
  .actions((store) => ({
    login: flow(function* login() {
      store.isLoading = true
      store.error = ""
      try {
        const user: Parse.User = yield Parse.User.logIn(store.authEmail, store.authPassword)
        store.currentUser = user
        store.authToken = user.getSessionToken()
        store.error = ""
        return { success: true }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to log in"
        console.error("Login error:", errorMessage)
        store.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        store.isLoading = false
      }
    }),
    signUp: flow(function* signUp(username: string) {
      store.isLoading = true
      store.error = ""
      try {
        const user = new Parse.User()
        user.set("username", username)
        user.set("email", store.authEmail)
        user.set("password", store.authPassword)
        
        const newUser: Parse.User = yield user.signUp()
        store.currentUser = newUser
        store.authToken = newUser.getSessionToken()
        store.error = ""
        return { success: true }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to sign up"
        console.error("Signup error:", errorMessage)
        store.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        store.isLoading = false
      }
    }),
    logout: flow(function* logout() {
      try {
        yield Parse.User.logOut()
        store.currentUser = undefined
        store.authToken = undefined
        store.resetAuthState()
        return { success: true }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to log out"
        console.error("Logout error:", errorMessage)
        store.error = errorMessage
        return { success: false, error: errorMessage }
      }
    }),
    checkCurrentUser: flow(function* checkCurrentUser() {
      try {
        const currentUser: Parse.User | null = yield Parse.User.currentAsync()
        if (currentUser) {
          store.currentUser = currentUser
          store.authToken = currentUser.getSessionToken()
          return true
        }
        return false
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        console.error("Error checking current user:", errorMessage)
        return false
      }
    })
  }))
  .actions(withSetPropAction)

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
