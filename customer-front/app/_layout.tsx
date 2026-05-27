import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';


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

import { initI18n } from '../src/i18n';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const [i18nInitialized, setI18nInitialized] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    initI18n().then(() => setI18nInitialized(true));
  }, []);

  useEffect(() => {
    if (loaded && i18nInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, i18nInitialized]);

  if (!loaded || !i18nInitialized) {
    return null;
  }

  return <RootLayoutNav />;
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, Snackbar } from 'react-native-paper';
import { useNotifications } from '../src/hooks/notifications';
import { useCustomerOrderChatThread } from '../src/hooks/chat';

const queryClient = new QueryClient();

function NotificationWatcher() {
  const { data: notifications } = useNotifications({ unreadOnly: true });
  const orderChat = useCustomerOrderChatThread();
  const [visible, setVisible] = useState(false);
  const [activeNotification, setActiveNotification] = useState<any>(null);
  const lastSeenIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!notifications || !notifications.items || notifications.items.length === 0) return;

    const latest = notifications.items[0];
    if (lastSeenIdRef.current === null) {
      lastSeenIdRef.current = latest.id;
      return;
    }

    if (latest.id > lastSeenIdRef.current) {
      lastSeenIdRef.current = latest.id;
      if (latest.type === 'ChatMessage') {
        setActiveNotification(latest);
        setVisible(true);
      }
    }
  }, [notifications]);

  const handleAction = () => {
    setVisible(false);
    if (activeNotification?.relatedOrderId) {
      orderChat.mutate(activeNotification.relatedOrderId, {
        onSuccess: (thread) => {
          router.push({
            pathname: '/chat/[threadId]',
            params: { threadId: String(thread.id) },
          });
        },
      });
    }
  };

  return (
    <Snackbar
      visible={visible}
      onDismiss={() => setVisible(false)}
      action={{
        label: 'عرض',
        onPress: handleAction,
      }}
      duration={5000}
      style={{ bottom: 20 }}
    >
      {activeNotification ? `${activeNotification.title}: ${activeNotification.message}` : ''}
    </Snackbar>
  );
}

import { theme } from '../src/theme';
function RootLayoutNav() {
  const navigationTheme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <ThemeProvider value={navigationTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          <NotificationWatcher />
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
