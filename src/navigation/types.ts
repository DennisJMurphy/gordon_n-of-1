// src/navigation/types.ts
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Onboarding stack
export type OnboardingStackParamList = {
  Intro: undefined;
  BaselineContext: undefined;
  EpisodeSetup: undefined;
  InterventionSetup: undefined;
  ReminderSetup: undefined;
};

// Home stack (nested in Home tab)
export type HomeStackParamList = {
  HomeMain: undefined;
  NewEpisode: undefined;
  InterventionSetup: {
    episodeId: string;
  };
  WeeklyCheckin: {
    episodeId: string;
    checkinId?: string; // If provided, we're editing
  };
  CheckinHistory: {
    episodeId: string;
  };
  PrivacyPreview: {
    episodeId: string;
  };
  ReportSuccess: {
    reportId: string;
  };
  EditBaseline: undefined;
};

// Main tab navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Calendar: undefined;
  Reports: undefined;
  Settings: undefined;
};

// Root stack (contains onboarding and main app)
export type RootStackParamList = {
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props helpers
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = 
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = 
  NativeStackScreenProps<HomeStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = 
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;
