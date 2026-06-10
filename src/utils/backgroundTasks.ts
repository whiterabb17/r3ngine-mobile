import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';

export const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    const serverIp = await SecureStore.getItemAsync('server_ip');
    const token = await SecureStore.getItemAsync('access_token');

    if (!serverIp || !token) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const url = serverIp.endsWith('/') ? `${serverIp}mapi/notifications/` : `${serverIp}/mapi/notifications/`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const data = await response.json();
    
    // Most Django REST Framework paginated responses have a 'results' array
    const notifications = data.results || data;
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const lastNotifiedStr = await SecureStore.getItemAsync('last_notified_id');
    const lastNotifiedId = lastNotifiedStr ? parseInt(lastNotifiedStr, 10) : 0;

    let newCount = 0;
    let maxId = lastNotifiedId;

    for (const notif of notifications) {
      // Assuming 'id' is a number
      if (notif.id > lastNotifiedId) {
        newCount++;
        if (notif.id > maxId) maxId = notif.id;
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notif.title || 'r3ngine Alert',
            body: notif.description || notif.message || 'You have a new notification.',
            data: { url: '/notifications/index' },
          },
          trigger: null, // trigger immediately
        });
      }
    }

    if (newCount > 0) {
      await SecureStore.setItemAsync('last_notified_id', maxId.toString());
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundTask] Error fetching notifications:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerNotificationTask(intervalMinutes: number) {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
      minimumInterval: intervalMinutes * 60, // in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log(`[BackgroundTask] Registered with interval ${intervalMinutes}m`);
  } catch (err) {
    console.error('[BackgroundTask] Task registration failed:', err);
    throw err;
  }
}

export async function unregisterNotificationTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('[BackgroundTask] Unregistered successfully');
    }
  } catch (err) {
    console.error('[BackgroundTask] Task unregistration failed:', err);
  }
}
