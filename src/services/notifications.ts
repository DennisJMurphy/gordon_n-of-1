// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const REMINDER_ENABLED_KEY = 'gordon_reminder_enabled';
const REMINDER_DAY_KEY = 'gordon_reminder_day';
const REMINDER_HOUR_KEY = 'gordon_reminder_hour';
const REMINDER_MINUTE_KEY = 'gordon_reminder_minute';

// Default values
const DEFAULT_DAY = 0; // Sunday
const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

export interface ReminderSettings {
  enabled: boolean;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  hour: number;
  minute: number;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }
  
  // On Android, we need a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Check-in Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }
  
  return true;
}

/**
 * Get current reminder settings
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const [enabledStr, dayStr, hourStr, minuteStr] = await Promise.all([
      AsyncStorage.getItem(REMINDER_ENABLED_KEY),
      AsyncStorage.getItem(REMINDER_DAY_KEY),
      AsyncStorage.getItem(REMINDER_HOUR_KEY),
      AsyncStorage.getItem(REMINDER_MINUTE_KEY),
    ]);
    
    return {
      enabled: enabledStr === 'true',
      dayOfWeek: dayStr ? parseInt(dayStr, 10) : DEFAULT_DAY,
      hour: hourStr ? parseInt(hourStr, 10) : DEFAULT_HOUR,
      minute: minuteStr ? parseInt(minuteStr, 10) : DEFAULT_MINUTE,
    };
  } catch (error) {
    console.error('Failed to get reminder settings:', error);
    return {
      enabled: false,
      dayOfWeek: DEFAULT_DAY,
      hour: DEFAULT_HOUR,
      minute: DEFAULT_MINUTE,
    };
  }
}

/**
 * Save reminder settings and schedule/cancel notification
 */
export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(REMINDER_ENABLED_KEY, String(settings.enabled)),
      AsyncStorage.setItem(REMINDER_DAY_KEY, String(settings.dayOfWeek)),
      AsyncStorage.setItem(REMINDER_HOUR_KEY, String(settings.hour)),
      AsyncStorage.setItem(REMINDER_MINUTE_KEY, String(settings.minute)),
    ]);
    
    if (settings.enabled) {
      await scheduleWeeklyReminder(settings);
    } else {
      await cancelAllReminders();
    }
  } catch (error) {
    console.error('Failed to save reminder settings:', error);
    throw error;
  }
}

/**
 * Schedule the weekly check-in reminder
 */
async function scheduleWeeklyReminder(settings: ReminderSettings): Promise<void> {
  // Cancel existing reminders first
  await cancelAllReminders();
  
  // Schedule new weekly reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly Check-in',
      body: 'Take 60 seconds to log your week in Gordon.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: settings.dayOfWeek + 1, // Notifications uses 1-7, we use 0-6
      hour: settings.hour,
      minute: settings.minute,
    },
  });
}

/**
 * Cancel all scheduled reminders
 */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get day name from day number
 */
export function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Sunday';
}

/**
 * Format time for display
 */
export function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}
