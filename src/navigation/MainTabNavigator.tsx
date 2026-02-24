// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeStackNavigator } from './HomeStackNavigator';
import {
  CalendarScreen,
  ReportsScreen,
  SettingsScreen,
} from '../screens/main';
import { colors, fontSize } from '../theme';
import { Text, StyleSheet } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple emoji icons for now
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Calendar: '📅',
    Reports: '📊',
    Settings: '⚙️',
  };

  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {icons[name]}
    </Text>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          marginTop: 4,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 20,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
});
