import { FC, useCallback, useMemo, useState, useEffect } from "react";
import * as Application from "expo-application";
import {
  LayoutAnimation,
  Linking,
  Platform,
  TextStyle,
  useColorScheme,
  View,
  ViewStyle,
  Alert,
} from "react-native";
import { Button, ListItem, Screen, Text } from "../components";
import { DemoTabScreenProps } from "../navigators/DemoNavigator";
import type { ThemedStyle } from "@/theme";
import { $styles } from "../theme";
import { isRTL } from "@/i18n";
import { useStores } from "../models";
import { useAppTheme } from "@/utils/useAppTheme";
import { 
  registerForPushNotificationsAsync, 
  sendPushNotification,
  setupNotificationListeners,
  NotificationPermissionError 
} from "../services/notifications/notification"; // Adjust path as needed

/**
 * @param {string} url - The URL to open in the browser.
 * @returns {void} - No return value.
 */
function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}

const usingHermes =
  typeof HermesInternal === "object" && HermesInternal !== null;

export const DemoDebugScreen: FC<DemoTabScreenProps<
  "DemoDebug"
>> = function DemoDebugScreen(_props) {
  const { setThemeContextOverride, themeContext, themed, theme } = useAppTheme();
  const {
    authenticationStore: { logout },
  } = useStores();

  // Push notification state
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notificationError, setNotificationError] = useState<NotificationPermissionError | null>(null);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);

  // @ts-expect-error
  const usingFabric = global.nativeFabricUIManager != null;

  // Setup push notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      setIsNotificationLoading(true);
      try {
        const token = await registerForPushNotificationsAsync(
          theme.colors.palette.primary500
        );
        setExpoPushToken(token || '');
        setNotificationError(null);
      } catch (error) {
        setNotificationError(error as NotificationPermissionError);
        console.error('Push notification setup failed:', error);
      } finally {
        setIsNotificationLoading(false);
      }
    };

    initializeNotifications();

    // Set up notification listeners
    const cleanup = setupNotificationListeners();
    
    return cleanup;
  }, [theme.colors.palette.primary500]);

  const demoReactotron = useMemo(
    () => async () => {
      if (__DEV__) {
        console.tron.display({
          name: "DISPLAY",
          value: {
            appId: Application.applicationId,
            appName: Application.applicationName,
            appVersion: Application.nativeApplicationVersion,
            appBuildVersion: Application.nativeBuildVersion,
            hermesEnabled: usingHermes,
            pushToken: expoPushToken,
          },
          important: true,
        });
      }
    },
    [expoPushToken]
  );

  const toggleTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Animate the transition
    setThemeContextOverride(themeContext === "dark" ? "light" : "dark");
  }, [themeContext, setThemeContextOverride]);

  // Resets the theme to the system theme
  const colorScheme = useColorScheme();
  const resetTheme = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setThemeContextOverride(undefined);
  }, [setThemeContextOverride]);

  // Test push notification
  const testPushNotification = useCallback(async () => {
    if (!expoPushToken) {
      Alert.alert('Error', 'No push token available. Make sure notifications are enabled.');
      return;
    }

    try {
      const success = await sendPushNotification(
        expoPushToken,
        'Test Notification 🚀',
        'This is a test notification from the debug screen!',
        { 
          screen: 'debug',
          timestamp: new Date().toISOString(),
          testData: 'Hello from Dooit!'
        }
      );

      if (success) {
        Alert.alert('Success', 'Test notification sent! Check your notification tray.');
      } else {
        Alert.alert('Error', 'Failed to send test notification. Check console for details.');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${error}`);
    }
  }, [expoPushToken]);

  const getNotificationStatus = () => {
    if (isNotificationLoading) return 'Setting up...';
    if (notificationError) {
      switch (notificationError.code) {
        case 'PERMISSION_DENIED':
          return 'Permission denied';
        case 'NO_DEVICE':
          return 'Simulator (not supported)';
        case 'NO_PROJECT_ID':
          return 'Config error';
        case 'TOKEN_ERROR':
          return 'Token error';
        default:
          return 'Setup failed';
      }
    }
    if (expoPushToken) return 'Ready';
    return 'Not available';
  };

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top"]}
      contentContainerStyle={[$styles.container, themed($container)]}
    >
      <Text
        style={themed($reportBugsLink)}
        tx="demoDebugScreen:reportBugs"
        onPress={() =>
          openLinkInBrowser("https://github.com/neweracy/Dooit/issues")
        }
      />

      <Text
        style={themed($title)}
        preset="heading"
        text="Account"
      />
      <Text preset="bold">Current system theme: {colorScheme}</Text>
      <Text preset="bold">Current app theme: {themeContext}</Text>
      <Button onPress={resetTheme} text={`Reset`} />

      <View style={themed($itemsContainer)}>
        <Button onPress={toggleTheme} text={`Toggle Theme: ${themeContext}`} />
      </View>

      {/* Push Notifications Section */}
      <Text
        style={themed($title)}
        preset="heading"
        text="Push Notifications"
      />
      <View style={themed($itemsContainer)}>
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">Notification Status</Text>
              <Text style={notificationError ? themed($errorText) : undefined}>
                {getNotificationStatus()}
              </Text>
            </View>
          }
        />
        {expoPushToken && (
          <ListItem
            LeftComponent={
              <View style={themed($item)}>
                <Text preset="bold">Push Token</Text>
                <Text style={themed($tokenText)} numberOfLines={2}>
                  {expoPushToken}
                </Text>
              </View>
            }
          />
        )}
        {notificationError && (
          <ListItem
            LeftComponent={
              <View style={themed($item)}>
                <Text preset="bold" style={themed($errorText)}>Error Details</Text>
                <Text style={themed($errorText)}>
                  {notificationError.message}
                </Text>
              </View>
            }
          />
        )}
      </View>
      <View style={themed($buttonContainer)}>
        <Button
          style={themed($button)}
          text="Send Test Notification"
          onPress={testPushNotification}
          disabled={!expoPushToken || isNotificationLoading}
        />
      </View>

      {/* App Info Section */}
      <Text
        style={themed($title)}
        preset="heading"
        text="App Information"
      />
      <View style={themed($itemsContainer)}>
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">App Id</Text>
              <Text>{Application.applicationId}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">App Name</Text>
              <Text>{Application.applicationName}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">App Version</Text>
              <Text>{Application.nativeApplicationVersion}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">App Build Version</Text>
              <Text>{Application.nativeBuildVersion}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">Hermes Enabled</Text>
              <Text>{String(usingHermes)}</Text>
            </View>
          }
        />
        <ListItem
          LeftComponent={
            <View style={themed($item)}>
              <Text preset="bold">Fabric Enabled</Text>
              <Text>{String(usingFabric)}</Text>
            </View>
          }
        />
      </View>
      <View style={themed($buttonContainer)}>
        <Button
          style={themed($button)}
          tx="demoDebugScreen:reactotron"
          onPress={demoReactotron}
        />
        <Text
          style={themed($hint)}
          tx={`demoDebugScreen:${Platform.OS}ReactotronHint` as const}
        />
      </View>
      <View style={themed($buttonContainer)}>
        <Button style={themed($button)} tx="common:logOut" onPress={logout} />
      </View>
    </Screen>
  );
};

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
});

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xxl,
});

const $reportBugsLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.lg,
  alignSelf: isRTL ? "flex-start" : "flex-end",
});

const $item: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
});

const $itemsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xl,
});

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
});

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
});

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.neutral600,
  fontSize: 12,
  lineHeight: 15,
  paddingBottom: spacing.lg,
});

const $errorText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
});

const $tokenText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 10,
  color: colors.textDim,
  marginTop: spacing.xs,
});