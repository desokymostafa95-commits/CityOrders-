import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Tag, ShoppingCart, ClipboardList, User } from 'lucide-react-native';
import { useTheme } from 'react-native-paper';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
      }}>
      {/* Main visible tabs */}
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="offers/index"
        options={{
          title: 'Offers',
          tabBarIcon: ({ color, size }) => <Tag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart/index"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />

      {/* Hidden nested routes - these shouldn't appear as tabs */}
      <Tabs.Screen
        name="home/brand/[brandId]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="home/category/[categoryId]"
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
