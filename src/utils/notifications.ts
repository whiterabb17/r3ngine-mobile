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

/**
 * registerForPushNotificationsAsync
 *
 * Requests OS notification permission and retrieves the Expo push token for this device.
 * Push notifications only work on physical devices; emulators return null.
 * Returns null if permission is denied or token fetch fails.
 *
 * @returns {Promise<string | null>} Expo push token or null on failure/denial.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Push only works on real physical devices
  if (!Device.isDevice) {
    console.warn('[PushNotifications] Push notifications require a physical device.');
    return null;
  }

  // Create the Android notification channel (required for Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'r3ngine',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7c3aed',
    });
  }

  // Check existing permission — cast to any because NotificationPermissionsStatus extends
  // PermissionResponse (which has `granted`) but the type stubs may not expose it directly
  const existingPermission = await Notifications.getPermissionsAsync() as any;

  let isGranted: boolean = existingPermission.granted ?? false;

  // Request permission if not already granted
  if (!isGranted) {
    const newPermission = await Notifications.requestPermissionsAsync() as any;
    isGranted = newPermission.granted ?? false;
  }

  if (!isGranted) {
    console.warn('[PushNotifications] Permission denied for push notifications.');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) {
    console.error('[PushNotifications] No EAS projectId found in app config — cannot fetch push token.');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[PushNotifications] Expo push token acquired:', tokenData.data);
    return tokenData.data;
  } catch (err) {
    console.error('[PushNotifications] Failed to retrieve Expo push token:', err);
    return null;
  }
}

/**
 * sendTokenToServer
 *
 * POSTs the Expo push token to the r3ngine backend so the server can
 * dispatch push notifications to this device when scan events occur.
 *
 * @param token - Expo push token string from registerForPushNotificationsAsync.
 */
export async function sendTokenToServer(token: string): Promise<void> {
  try {
    await apiClient.post('/mapi/push-token/register/', {
      token,
      device_label: `${Device.deviceName ?? 'Mobile'} (${Platform.OS})`,
    });
    console.log('[PushNotifications] Token registered with backend successfully.');
  } catch (err) {
    // Log but do not throw — token registration failure must not disrupt the app
    console.error('[PushNotifications] Failed to register token with backend:', err);
  }
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
