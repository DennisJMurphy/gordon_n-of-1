// src/screens/main/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { MainTabScreenProps } from '../../navigation/types';

export function SettingsScreen({ navigation }: MainTabScreenProps<'Settings'>) {
  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Weekly check-in reminder</Text>
          <Text style={styles.rowValue}>Sunday, 9:00 AM</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Default sharing preferences</Text>
          <Text style={styles.rowValue}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Export all data</Text>
          <Text style={styles.rowValue}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, styles.dangerRow]}>
          <Text style={styles.dangerLabel}>Wipe all local data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App version</Text>
          <Text style={styles.rowValue}>0.1.0</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Schema version</Text>
          <Text style={styles.rowValue}>1</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Image 
          source={require('../../../assets/icon.png')} 
          style={styles.footerIcon}
        />
        <Text style={styles.footerText}>
          Gordon — an n-of-1 report tool
        </Text>
        <Text style={styles.footerSubtext}>
          Privacy-first. Nothing leaves without consent.
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  rowLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  dangerRow: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  dangerLabel: {
    fontSize: fontSize.md,
    color: colors.error,
  },
  footer: {
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  footerIcon: {
    width: 40,
    height: 40,
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  footerSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
