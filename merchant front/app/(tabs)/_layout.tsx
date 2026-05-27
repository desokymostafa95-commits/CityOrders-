import React from 'react';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Package, ShoppingBag, Store, Tag, FileText, Settings, BadgePercent } from 'lucide-react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { lightTheme, darkTheme } from '@/src/theme';
import { t } from '@/src/i18n';
import { router } from 'expo-router';
import { IconButton } from 'react-native-paper';

export default function TabLayout() {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.dashboard'),
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
          headerRight: () => (
            <IconButton
              icon={() => <Settings size={22} color={theme.colors.primary} />}
              onPress={() => router.push('/settings')}
            />
          )
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: t('common.products'),
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t('common.categories'),
          tabBarIcon: ({ color }) => <Tag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: t('common.offers'),
          tabBarIcon: ({ color }) => <BadgePercent size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="promos"
        options={{
          title: t('common.promos'),
          tabBarIcon: ({ color }) => <Tag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('common.orders'),
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: t('common.invoices'),
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="brand"
        options={{
          title: t('common.brand'),
          tabBarIcon: ({ color }) => <Store size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
