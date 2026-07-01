import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../api/client';

/**
 * Configure how push notifications are presented when the app is in the foreground.
 * Uses the expo-notifications v54 API: shouldShowBanner replaces deprecated shouldShowAlert.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestLocalNotificationPermissionsAsync(): Promise<boolean> {
  // Create the Android notification channel (required for Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'r3ngine',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7c3aed',
    });
  }

  // Check existing permission
  const existingPermission = await Notifications.getPermissionsAsync() as any;
  let isGranted: boolean = existingPermission.granted ?? false;

  // Request permission if not already granted
  if (!isGranted) {
    const newPermission = await Notifications.requestPermissionsAsync() as any;
    isGranted = newPermission.granted ?? false;
  }

  return isGranted;
}

/**
 * Minimal router interface — accepts the return value of expo-router's useRouter()
 * without importing the strict Router type, which is parameterised over route names.
 */
type MinimalRouter = { push: (...args: any[]) => void };

/**
 * setupNotificationHandlers
 *
 * Registers a listener for notification response events (when the user taps
 * a push notification). Navigates to the Notification Center screen.
 *
 * @param router - Expo Router instance used for navigation.
 * @returns A subscription object that must be cleaned up with .remove() on unmount.
 */
export function setupNotificationHandlers(router: MinimalRouter): Notifications.Subscription {
  const subscription = Notifications.addNotificationResponseReceivedListener(() => {
    // Route to the Notification Center whenever the user taps a push notification
    router.push('/notifications/index');
  });
  return subscription;
}

/**
 * Fetches the Expo push token and registers it with the Django backend.
 */
export async function registerPushNotificationToken(): Promise<boolean> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[PushNotification] No EAS projectId found in Constants');
      return false;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Get device info to send a label
    const deviceLabel = Device.modelName || `${Device.brand} ${Device.designName}` || Platform.OS;

    // Register with backend API
    await apiClient.post('/mapi/push-token/register/', {
      token,
      device_label: deviceLabel,
    });
    console.log('[PushNotification] Registered token with backend:', token);
    return true;
  } catch (error) {
    console.error('[PushNotification] Error registering push token with backend:', error);
    return false;
  }
}
