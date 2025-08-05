import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import React from 'react';
// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowList: false,
  }),
});

export interface NotificationPermissionError extends Error {
  code: 'PERMISSION_DENIED' | 'NO_DEVICE' | 'NO_PROJECT_ID' | 'TOKEN_ERROR';
}

function createNotificationError(message: string, code: NotificationPermissionError['code']): NotificationPermissionError {
  const error = new Error(message) as NotificationPermissionError;
  error.code = code;
  return error;
}

export async function registerForPushNotificationsAsync(
  themeColor?: string
): Promise<string | undefined> {
  // Set up Android notification channel with optional theme color
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: themeColor || '#FF231F7C',
    });
  }

  // Check if running on physical device
  if (!Device.isDevice) {
    throw createNotificationError(
      'Push notifications only work on physical devices',
      'NO_DEVICE'
    );
  }

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    throw createNotificationError(
      'Permission not granted for push notifications',
      'PERMISSION_DENIED'
    );
  }

  // Get project ID with fallbacks
  const projectId = 
    Constants?.expoConfig?.extra?.eas?.projectId ?? 
    Constants?.easConfig?.projectId;
    
  if (!projectId) {
    throw createNotificationError(
      'Project ID not found in app configuration',
      'NO_PROJECT_ID'
    );
  }

  try {
    const pushTokenString = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;
    
    console.log('Push token generated:', pushTokenString);
    return pushTokenString;
  } catch (error) {
    throw createNotificationError(
      `Failed to get push token: ${error}`,
      'TOKEN_ERROR'
    );
  }
}

// Utility function to send push notification
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Push notification failed:', result);
      return false;
    }
    
    console.log('Push notification sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Set up notification response listener
export function setupNotificationListeners() {
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response received:', response);
    // Handle notification tap here
    // You can navigate to specific screens based on response.notification.request.content.data
  });

  const receivedListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received while app is in foreground:', notification);
    // Handle foreground notification here
  });

  // Return cleanup function
  return () => {
    responseListener.remove();
    receivedListener.remove();
  };
}

// Hook for use in React components
export function useNotificationSetup(themeColor?: string) {
  const [expoPushToken, setExpoPushToken] = React.useState<string>('');
  const [error, setError] = React.useState<NotificationPermissionError | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    registerForPushNotificationsAsync(themeColor)
      .then(token => {
        setExpoPushToken(token || '');
        setError(null);
      })
      .catch((err: NotificationPermissionError) => {
        setError(err);
        console.error('Push notification setup failed:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Set up listeners
    const cleanup = setupNotificationListeners();
    
    return cleanup;
  }, [themeColor]);

  return { expoPushToken, error, isLoading };
}