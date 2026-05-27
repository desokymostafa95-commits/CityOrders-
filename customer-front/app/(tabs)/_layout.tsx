import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Tag, ShoppingCart, ClipboardList, User } from 'lucide-react-native';
import { useTheme } from 'react-native-paper';
import { t } from '../../src/i18n';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        headerShown: true,
        headerTitleStyle: {
          fontWeight: '900',
          color: theme.colors.onSurface,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontWeight: '800',
          fontSize: 11,
          lineHeight: 13,
          marginTop: 2,
        },
        tabBarItemStyle: {
          minHeight: 52,
        },
      }}>
      <Tabs.Screen
        name="home/index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="offers/index"
        options={{
          title: t('tabs.offers'),
          tabBarIcon: ({ color, size }) => <Tag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart/index"
        options={{
          title: t('tabs.cart'),
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="home/brand/[brandId]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="home/category/[slug]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="home/sector/[slug]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="cart/checkout/[brandId]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="orders/[orderId]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile/addresses/index"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile/addresses/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile/addresses/new"
        options={{ href: null }}
      />
    </Tabs>
  );
}
