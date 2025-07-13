import { initializeParse } from "@parse/react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Parse from "parse"

// Parse server details
const PARSE_SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL
const PARSE_APP_ID = process.env.EXPO_PUBLIC_APP_ID
const PARSE_JS_KEY = process.env.EXPO_PUBLIC_JAVASCRIPT_KEY

if (!PARSE_SERVER_URL || !PARSE_APP_ID) {
  throw new Error("Missing required Parse server configuration. Please check your environment variables.")
}

// Initialize Parse with AsyncStorage for React Native
initializeParse(
  PARSE_SERVER_URL,
  PARSE_APP_ID,
  PARSE_JS_KEY
)

Parse.enableLocalDatastore()


Parse.setAsyncStorage(AsyncStorage)

// Configure Parse
if (!Parse.applicationId) {
  // @ts-ignore - serverURL is writeable at runtime
  Parse.serverURL = PARSE_SERVER_URL
  Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY)
  Parse.enableLocalDatastore()
  Parse.setAsyncStorage(AsyncStorage)
}

// Type-safe wrapper functions
export const getCurrentUser = async (): Promise<Parse.User | null> => {
  try {
    return await Parse.User.currentAsync()
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// export const checkUserExists = async (username: string): Promise<boolean> => {
//   try {
//     const query = new Parse.Query('_User')
//     query.equalTo("username", username)
//     const count = await query.count()
//     return count > 0
//   } catch (error) {
//     console.error("Error checking if user exists:", error)
//     return false
//   }
// }

export const fetchAllUsers = async (): Promise<Parse.User[]> => {
  try {
    const query = new Parse.Query('_User')
    const results = await query.find()
    return results as unknown as Parse.User[]
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export default Parse
