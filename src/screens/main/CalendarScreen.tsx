// src/screens/main/CalendarScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize } from '../../theme';
import { MainTabScreenProps } from '../../navigation/types';

export function CalendarScreen({ navigation }: MainTabScreenProps<'Calendar'>) {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Day notes coming in Iteration 3</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>📅</Text>
        <Text style={styles.placeholderText}>
          Calendar view will show your episode timeline with day-by-day notes.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  placeholderText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
