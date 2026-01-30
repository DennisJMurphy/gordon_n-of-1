// src/navigation/OnboardingNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import {
  IntroScreen,
  BaselineContextScreen,
  EpisodeSetupScreen,
  InterventionSetupScreen,
  ReminderSetupScreen,
} from '../screens/onboarding';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="BaselineContext" component={BaselineContextScreen} />
      <Stack.Screen name="EpisodeSetup" component={EpisodeSetupScreen} />
      <Stack.Screen name="InterventionSetup" component={InterventionSetupScreen} />
      <Stack.Screen name="ReminderSetup" component={ReminderSetupScreen} />
    </Stack.Navigator>
  );
}
