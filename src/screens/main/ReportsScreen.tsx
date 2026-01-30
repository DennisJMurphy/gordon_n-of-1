// src/screens/main/ReportsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize } from '../../theme';
import { MainTabScreenProps } from '../../navigation/types';

export function ReportsScreen({ navigation }: MainTabScreenProps<'Reports'>) {
  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Episode reports coming in Iteration 4</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>📊</Text>
        <Text style={styles.placeholderText}>
          Generated reports will appear here.{'\n\n'}
          Close an episode to generate a share-safe summary.
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
