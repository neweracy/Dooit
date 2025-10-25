/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer, NavigatorScreenParams } from "@react-navigation/native"
import React from "react"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"
import { observer } from "mobx-react-lite"
import * as Screens from "@/screens"
import Config from "../config"
import { useStores } from "../models"
import { DemoNavigator, DemoTabParamList } from "./DemoNavigator"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import { useAppTheme, useThemeProvider } from "@/utils/useAppTheme"
import { ComponentProps, useEffect } from "react"
import { Alert } from "react-native"
import { AlertTongle, showQueuedAlert } from "@/components"

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`. Generally speaking, we
 * recommend using your MobX-State-Tree store(s) to keep application state
 * rather than passing state through navigation params.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type AppStackParamList = {
  Welcome: undefined
  Login: undefined
  Demo: NavigatorScreenParams<DemoTabParamList>
  // 🔥 Your screens go here
  ChooseAuth: undefined
	SignUp: undefined
	// IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = observer(function AppStack() {
  const {
    authenticationStore: { isAuthenticated,checkServerStatus },
  } = useStores()

  const {
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkServerStatus();
      if (!status.isRunning) {
        showQueuedAlert({
          title: "No connection",
          message: status.message,
       
        })
      }
    };
    
    // Initial check
    checkStatus();
    
    // Set up interval for periodic checks (every 30 seconds)
    const intervalId = setInterval(checkStatus, 30000);
    
    // Clean up the interval when the component unmounts or when checkServerStatus changes
    return () => clearInterval(intervalId);
  }, [checkServerStatus])

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={isAuthenticated ? "Demo" : "Welcome"}
    >
      {isAuthenticated ? (
        <>

          <Stack.Screen name="Demo" component={DemoNavigator} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={Screens.WelcomeScreen} />
          <Stack.Screen name="Login" component={Screens.LoginScreen} />
          <Stack.Screen name="ChooseAuth" component={Screens.ChooseAuthScreen} />
          <Stack.Screen name="SignUp" component={Screens.SignUpScreen} />
        </>
      )}

      {/** 🔥 Your screens go here */}
			{/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
})

export interface NavigationProps
  extends Partial<ComponentProps<typeof NavigationContainer<AppStackParamList>>> {}

export const AppNavigator = observer(function AppNavigator(props: NavigationProps) {
  const { themeScheme, navigationTheme, ThemeProvider, setThemeContextOverride } =
    useThemeProvider()
  // useEffect(() => {
  //   // setThemeContextOverride("light")
  // }, [setThemeContextOverride])

     const exitRoutes = ["welcome","Demo"] // Add any other routes that should exit the app here
  // This hook will handle the back button on Android and exit the app if the user is on an exit route
  // You can customize the exit routes by modifying the `exitRoutes` array
  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
      <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
        <Screens.ErrorBoundary catchErrors={Config.catchErrors}>
          <AppStack />
        </Screens.ErrorBoundary>
      </NavigationContainer>
    </ThemeProvider>
  )
})
