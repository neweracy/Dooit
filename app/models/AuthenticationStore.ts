import { Instance, SnapshotOut, types, flow } from "mobx-state-tree"
import type { User } from "parse"
import { withSetPropAction } from "./helpers/withSetPropAction"
import Parse from "@/lib/Parse/parse"

// Extend the Parse.User type with our custom methods
export interface IAppUser extends Parse.User {
  getEmail(): string
  getUsername(): string
  getSessionToken(): string
}

import type { TokenResponse } from "expo-auth-session"

// Google authentication response type
export interface GoogleAuthResponse {
  type: "success" | "dismiss" | "cancel" | "opened" | "locked" | "error"
  errorCode?: string | null
  error?: any
  params?: Record<string, string>
  authentication?:
    | (TokenResponse & {
        idToken?: string
        accessToken?: string
      })
    | null
  url?: string
}

// Helper function to check if Parse server is running
const checkParseServerConnection = async (): Promise<boolean> => {
  try {
    // Try to make a simple health check query
    const TestObject = Parse.Object.extend("TestConnection")
    const query = new Parse.Query(TestObject)
    query.limit(1)

    // This will throw an error if server is not reachable
    await query.find()
    return true
  } catch (error) {
    console.error("Parse server connection check failed:", error)
    return false
  }
}

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
    authPassword: "",
    isLoading: false,
    error: "",
    currentUser: types.maybe(types.frozen<Parse.User>()),
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
        // Check if Parse server is running first
        console.log("Checking Parse server connection...")
        const isServerRunning: boolean = yield checkParseServerConnection()

        if (!isServerRunning) {
          const errorMessage = "Parse server is not running. Please check your server connection."
          console.error("Server check failed:", errorMessage)
          store.error = errorMessage
          return { success: false, error: errorMessage }
        }

        console.log("Parse server is running. Proceeding with login...")

        const user: Parse.User = yield Parse.User.logIn(store.authEmail, store.authPassword)
        store.currentUser = user
        store.authToken = user.getSessionToken()
        store.error = ""
        return { success: true }
      } catch (error: unknown) {
        let errorMessage = "Failed to log in"

        // Handle specific Parse server connection errors
        if (error instanceof Error) {
          if (
            error.message.includes("XMLHttpRequest") ||
            error.message.includes("Network Error") ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("ECONNREFUSED")
          ) {
            errorMessage = "Cannot connect to server. Please check if the Parse server is running."
          } else {
            errorMessage = error.message
          }
        }

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
        // Check if Parse server is running first
        console.log("Checking Parse server connection...")
        const isServerRunning: boolean = yield checkParseServerConnection()

        if (!isServerRunning) {
          const errorMessage = "Parse server is not running. Please check your server connection."
          console.error("Server check failed:", errorMessage)
          store.error = errorMessage
          return { success: false, error: errorMessage, throwError: true }
        }

        console.log("Parse server is running. Proceeding with signup...")

        const user = new Parse.User()
        user.set("username", username)
        user.set("email", store.authEmail)
        user.set("password", store.authPassword)

        const newUser: Parse.User = yield user.signUp()
        store.currentUser = newUser
        store.authToken = newUser.getSessionToken()
        store.error = ""
        console.log("Signup successful!")
        return { success: true }
      } catch (error: unknown) {
        let errorMessage = "Failed to sign up"

        // Handle specific Parse server connection errors
        if (error instanceof Error) {
          if (
            error.message.includes("XMLHttpRequest") ||
            error.message.includes("Network Error") ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("ECONNREFUSED")
          ) {
            errorMessage = "Cannot connect to server. Please check if the Parse server is running."
          } else {
            errorMessage = error.message
          }
        }

        console.error("Signup error:", errorMessage)
        store.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        store.isLoading = false
      }
    }),
    googleSignIn: flow(function* googleSignIn(
      response: GoogleAuthResponse,
    ): Generator<Promise<any>, { success: boolean; error?: string; user?: User }, any> {
      store.isLoading = true
      store.error = ""

      try {
        // Early return if response is not successful
        if (response?.type !== "success") {
          console.log("Google authentication was not successful")
          store.error = "Google authentication was cancelled or failed"
          return { success: false, error: "Google authentication was cancelled or failed" }
        }

        // Handle case when authentication is null or missing required tokens
        if (!response.authentication?.idToken || !response.authentication?.accessToken) {
          console.error("Missing required authentication data in response", response.authentication)
          store.error = "Incomplete authentication data received from Google"
          return {
            success: false,
            error: "Incomplete authentication data. Please try signing in again.",
          }
        }

        // Check if Parse server is running first
        console.log("Checking Parse server connection...")
        const isServerRunning: boolean = yield checkParseServerConnection()

        if (!isServerRunning) {
          const errorMessage = "Parse server is not running. Please check your server connection."
          console.error("Server check failed:", errorMessage)
          store.error = errorMessage
          return { success: false, error: errorMessage }
        }

        console.log("Parse server is running. Proceeding with Google sign-in...")

        const { idToken, accessToken } = response.authentication || {}

        if (!idToken || !accessToken) {
          throw new Error("Missing authentication tokens")
        }

        // Fetch Google user profile
        const profileResponse: Response = yield fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        )

        if (!profileResponse.ok) {
          throw new Error(`Failed to fetch user profile: ${profileResponse.status}`)
        }

        const profile = yield Promise.resolve(profileResponse.json())

        // Validate required profile data
        const { sub: googleUserId, email, name, picture } = profile

        if (!googleUserId) {
          throw new Error("Google ID (sub) not found in user profile")
        }

        if (!email || !name) {
          throw new Error("Required user information missing from Google profile")
        }

        // Prepare Parse authentication data
        const authData = {
          id: googleUserId,
          id_token: idToken,
          access_token: accessToken,
        }

        // Authenticate with Parse
        const user: Parse.User = yield Promise.resolve(Parse.User.logInWith("google", { authData }))

        // Update store with authenticated user
        store.currentUser = user
        store.authToken = user.getSessionToken()
        store.error = ""

        console.log("Google login successful:", {
          userId: googleUserId,
          email,
          username: name,
          hasPicture: Boolean(picture),
        })

        return { success: true, user }
      } catch (error: unknown) {
        let errorMessage = "Failed to sign in with Google"

        // Handle specific Parse server connection errors
        if (error instanceof Error) {
          if (
            error.message.includes("XMLHttpRequest") ||
            error.message.includes("Network Error") ||
            error.message.includes("Failed to fetch") ||
            error.message.includes("ECONNREFUSED")
          ) {
            errorMessage = "Cannot connect to server. Please check if the Parse server is running."
          } else {
            errorMessage = error.message
          }
        }

        console.error("Google sign-in error:", errorMessage)
        store.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        store.isLoading = false
      }
    }),
    logout: flow(function* logout() {
      try {
        // Clear current user and token from store first
        store.currentUser = undefined
        store.authToken = undefined
        store.resetAuthState()

        // Then attempt Parse logout (this might fail in React Native)
        try {
          yield Parse.User.logOut()
        } catch (logoutError) {
          // Log the error but don't fail the logout process
          console.warn("Parse.User.logOut() failed (this is normal in React Native):", logoutError)
        }

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
    }),
    // Optional: Add a separate method to check server status
    checkServerStatus: flow(function* checkServerStatus() {
      try {
        const isRunning: boolean = yield checkParseServerConnection()
        return { isRunning, message: isRunning ? "Server is running" : "Server is not accessible" }
      } catch (error) {
        return { isRunning: false, message: "Failed to check server status" }
      }
    }),
  }))
  .actions(withSetPropAction)

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
