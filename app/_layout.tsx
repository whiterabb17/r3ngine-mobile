import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '../src/store/useAuthStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  Bangers_400Regular
} from '@expo-google-fonts/bangers';

import {
  registerForPushNotificationsAsync,
  sendTokenToServer,
  setupNotificationHandlers,
} from '../src/utils/notifications';

const queryClient = new QueryClient();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Bangers: Bangers_400Regular,
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, loadAuth } = useAuthStore();
  const { serverIp, loadSettings } = useSettingsStore();
  const segments = useSegments();
  const router = useRouter();

  /**
   * Ref to hold the notification tap subscription so it can be cleaned up
   * when the component unmounts, preventing memory leaks.
   */
  const notificationSubscriptionRef = useRef<Notifications.Subscription | null>(null);

  /**
   * Track whether we have already registered the push token for this session.
   * Prevents re-registering on every re-render triggered by auth state changes.
   */
  const hasRegisteredPushToken = useRef(false);

  useEffect(() => {
    loadAuth();
    loadSettings();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!serverIp || !isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, serverIp, segments]);

  /**
   * Register push notifications once the user is authenticated.
   * Steps:
   *   1. Request OS permission and get the Expo push token.
   *   2. Send the token to the r3ngine backend for storage.
   *   3. Set up a listener for notification taps that routes to Notification Center.
   *
   * The subscription is cleaned up on unmount to prevent memory leaks.
   */
  useEffect(() => {
    if (!isAuthenticated || hasRegisteredPushToken.current) return;

    const initPushNotifications = async () => {
      // Request permission + fetch Expo push token
      const token = await registerForPushNotificationsAsync();

      if (token) {
        // Store the token in the backend against this user
        await sendTokenToServer(token);
      }

      // Set up the notification tap handler regardless of token success
      // (the user may still receive in-app notification centre navigation)
      notificationSubscriptionRef.current = setupNotificationHandlers(router);
      hasRegisteredPushToken.current = true;
    };

    initPushNotifications();

    // Cleanup: remove the notification tap listener when the root unmounts
    return () => {
      if (notificationSubscriptionRef.current) {
        notificationSubscriptionRef.current.remove();
        notificationSubscriptionRef.current = null;
      }
    };
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="feeds" options={{ headerShown: false }} />
          <Stack.Screen name="intelligence" options={{ headerShown: false }} />
          <Stack.Screen name="diagnostics" options={{ presentation: 'modal' }} />
          <Stack.Screen name="notifications/index" options={{ presentation: 'modal', title: 'Notifications' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
