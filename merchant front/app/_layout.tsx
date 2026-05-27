import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { PaperProvider, IconButton } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/src/api/queryClient';
import { AuthProvider, useAuth } from '@/src/auth/context';
import { History } from 'lucide-react-native';

import { ThemeProvider as CustomThemeProvider, useTheme } from '@/src/theme/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme';
import { t, initI18n } from '@/src/i18n';
import { useMyBrand } from '@/src/hooks/useMerchantData';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    initI18n();
  }, []);

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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomThemeProvider>
          <RootLayoutWithTheme />
        </CustomThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootLayoutWithTheme() {
  const { isDark } = useTheme();
  return (
    <PaperProvider theme={isDark ? darkTheme : lightTheme}>
      <RootLayoutNav />
    </PaperProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useTheme();
  const { token, roles, isLoading: authLoading, signOut } = useAuth();

  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const firstSegment = segments?.[0] as string | undefined;
  const inApplyGroup = firstSegment === 'apply';

  const isMerchant = roles.includes('Merchant');

  // Only call brand check if we have a token, user has Merchant role, AND we are NOT already on the apply page
  const { data: brand, isLoading: brandLoading, error: brandError } = useMyBrand({
    enabled: !!token && isMerchant && !inApplyGroup
  });

  const isNavReady = !!navigationState?.key;

  // If we have a token and Merchant role, we must wait for brand check to finish (unless we're already applying)
  const isCheckingBrand = !!token && isMerchant && !inApplyGroup && brandLoading && !brandError;
  const isLoading = authLoading || isCheckingBrand;

  useEffect(() => {
    if (isLoading || !isNavReady) return;

    // Use a blank string for root, otherwise the first component of the path
    const inAuthGroup = firstSegment === 'login' || firstSegment === 'register';

    if (!token) {
      if (!inAuthGroup && firstSegment !== 'index' && firstSegment !== undefined) {
        router.replace('/login');
      }
    } else {
      // If brand fetch returns 403, it means the token doesn't have Merchant role
      const is403 = brandError && (brandError as any).response?.status === 403;
      if (is403 && isMerchant) {
        console.warn('403 on brand fetch with Merchant role - forcing re-login');
        signOut();
        return;
      }

      // If brand fetch returns 404, brand doesn't exist
      const is404 = brandError && (brandError as any).response?.status === 404;
      const hasBrand = !!brand && !is404;

      if (isMerchant) {
        if (!hasBrand && !brandLoading && !brandError) {
          // User is merchant but has no brand
          if (!inApplyGroup) {
            router.replace('/apply');
          }
        } else if (hasBrand) {
          // User is merchant and has a brand
          if (inAuthGroup || inApplyGroup || firstSegment === 'index' || firstSegment === undefined) {
            router.replace('/(tabs)');
          }
        }
      } else {
        // Not a merchant role yet, go to apply
        if (!inApplyGroup) {
          router.replace('/apply');
        }
      }
    }
  }, [token, roles, isLoading, isNavReady, segments, brand, brandLoading, brandError, signOut, isMerchant, firstSegment, inApplyGroup]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerStyle: { backgroundColor: isDark ? darkTheme.colors.surface : lightTheme.colors.surface },
        headerTintColor: isDark ? darkTheme.colors.primary : lightTheme.colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: t('auth.create_account') || 'Create Account' }} />
        <Stack.Screen name="apply" options={{ title: t('auth.apply_merchant') || 'Apply as Merchant' }} />
        <Stack.Screen
          name="subscription/index"
          options={{
            title: t('dashboard.manage_subscription'),
            headerRight: () => (
              <IconButton
                icon={() => <History size={24} color={isDark ? darkTheme.colors.primary : "#6200ee"} />}
                onPress={() => router.push('/subscription/history')}
              />
            )
          }}
        />
        <Stack.Screen name="subscription/history" options={{ title: t('dashboard.payment_history') || 'Payment History' }} />
        <Stack.Screen name="products/new" options={{ title: t('common.add_product') || 'New Product' }} />
        <Stack.Screen name="products/[id]" options={{ title: t('common.edit_product') || 'Edit Product' }} />
        <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
