// src/navigation/HomeStackNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from './types';
import { HomeScreen } from '../screens/main/HomeScreen';
import { WeeklyCheckinScreen } from '../screens/main/WeeklyCheckinScreen';
import { CheckinHistoryScreen } from '../screens/main/CheckinHistoryScreen';
import { PrivacyPreviewScreen } from '../screens/main/PrivacyPreviewScreen';
import { ReportSuccessScreen } from '../screens/main/ReportSuccessScreen';
import { NewEpisodeScreen } from '../screens/main/NewEpisodeScreen';
import { InterventionSetupScreen } from '../screens/main/InterventionSetupScreen';
import { EditBaselineScreen } from '../screens/main/EditBaselineScreen';
import { colors, fontSize } from '../theme';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: fontSize.lg,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NewEpisode"
        component={NewEpisodeScreen}
        options={{ title: 'New Episode' }}
      />
      <Stack.Screen
        name="InterventionSetup"
        component={InterventionSetupScreen}
        options={{ title: 'Intervention Setup' }}
      />
      <Stack.Screen
        name="WeeklyCheckin"
        component={WeeklyCheckinScreen}
        options={{ title: 'Weekly Check-in' }}
      />
      <Stack.Screen
        name="CheckinHistory"
        component={CheckinHistoryScreen}
        options={{ title: 'Check-in History' }}
      />
      <Stack.Screen
        name="PrivacyPreview"
        component={PrivacyPreviewScreen}
        options={{ title: 'Privacy Preview' }}
      />
      <Stack.Screen
        name="ReportSuccess"
        component={ReportSuccessScreen}
        options={{ 
          title: 'Report Generated',
          headerBackVisible: false, // Can't go back after generating
        }}
      />
      <Stack.Screen
        name="EditBaseline"
        component={EditBaselineScreen}
        options={{ title: 'Edit Baseline Data' }}
      />
    </Stack.Navigator>
  );
}
