// src/screens/onboarding/ReminderSetupScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer, Button, Toggle, Select } from '../../components/ui';
import { colors, spacing, fontSize } from '../../theme';
import { OnboardingScreenProps } from '../../navigation/types';
import { useOnboarding } from '../../context/OnboardingContext';

const WEEKDAY_OPTIONS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const TIME_OPTIONS = [
  { label: '8:00 AM', value: '08:00' },
  { label: '9:00 AM', value: '09:00' },
  { label: '10:00 AM', value: '10:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '6:00 PM', value: '18:00' },
  { label: '8:00 PM', value: '20:00' },
  { label: '9:00 PM', value: '21:00' },
];

export function ReminderSetupScreen({ navigation }: OnboardingScreenProps<'ReminderSetup'>) {
  const { state, updateReminders, completeOnboarding } = useOnboarding();

  const [enabled, setEnabled] = useState(state.reminders.enabled);
  const [dayOfWeek, setDayOfWeek] = useState(state.reminders.dayOfWeek);
  const [time, setTime] = useState(state.reminders.time);
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      updateReminders({ enabled, dayOfWeek, time });
      await completeOnboarding();
      // Navigation to Main happens automatically via the root navigator
      // when onboarding is complete
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer safeBottom>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Reminders</Text>
        <Text style={styles.subtitle}>
          Gordon can remind you to do your weekly check-in.{'\n'}
          It takes less than 60 seconds.
        </Text>
      </View>

      <View style={styles.content}>
        <Toggle
          label="Enable weekly reminders"
          value={enabled}
          onChange={setEnabled}
          description="Get a gentle nudge to check in"
        />

        {enabled && (
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>When should we remind you?</Text>

            <Select
              label="Day"
              options={WEEKDAY_OPTIONS.map((d) => ({ label: d.label, value: String(d.value) }))}
              value={String(dayOfWeek)}
              onChange={(v) => setDayOfWeek(parseInt(v, 10))}
            />

            <Select
              label="Time"
              options={TIME_OPTIONS}
              value={time}
              onChange={setTime}
            />
          </View>
        )}

        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Notifications are local only.{'\n'}
            No data is sent to any server.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Launch Gordon"
          onPress={handleFinish}
          loading={isLoading}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  content: {
    flex: 1,
  },
  scheduleSection: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  privacyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
