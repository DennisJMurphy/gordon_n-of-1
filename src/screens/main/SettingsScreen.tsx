// src/screens/main/SettingsScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { MainTabScreenProps } from '../../navigation/types';
import {
  getReminderSettings,
  saveReminderSettings,
  requestNotificationPermissions,
  ReminderSettings,
  getDayName,
  formatTime,
} from '../../services/notifications';
import {
  shareExportedData,
  wipeAllData,
  getDataStats,
} from '../../services/dataManagement';
import { getBaselineContext, saveBaselineContext } from '../../db/repositories/baselineContext';
import { BaselineContext } from '../../types';

const DAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  label: formatTime(i, 0),
  value: i,
}));

export function SettingsScreen({ navigation }: MainTabScreenProps<'Settings'>) {
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    dayOfWeek: 0,
    hour: 9,
    minute: 0,
  });
  const [baseline, setBaseline] = useState<BaselineContext | null>(null);
  const [dataStats, setDataStats] = useState({ episodes: 0, checkins: 0, dayNotes: 0, reports: 0 });
  const [loading, setLoading] = useState(true);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPrivacyEditor, setShowPrivacyEditor] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [reminder, baselineData, stats] = await Promise.all([
        getReminderSettings(),
        getBaselineContext(),
        getDataStats(),
      ]);
      setReminderSettings(reminder);
      setBaseline(baselineData);
      setDataStats(stats);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to use reminders.'
        );
        return;
      }
    }

    const newSettings = { ...reminderSettings, enabled };
    setReminderSettings(newSettings);
    await saveReminderSettings(newSettings);
  };

  const handleSelectDay = async (day: number) => {
    const newSettings = { ...reminderSettings, dayOfWeek: day };
    setReminderSettings(newSettings);
    setShowDayPicker(false);
    if (newSettings.enabled) {
      await saveReminderSettings(newSettings);
    }
  };

  const handleSelectTime = async (hour: number) => {
    const newSettings = { ...reminderSettings, hour, minute: 0 };
    setReminderSettings(newSettings);
    setShowTimePicker(false);
    if (newSettings.enabled) {
      await saveReminderSettings(newSettings);
    }
  };

  const handleExportData = async () => {
    try {
      const success = await shareExportedData();
      if (success) {
        Alert.alert('Export Complete', 'Your data has been exported successfully.');
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    }
  };

  const handleWipeData = () => {
    Alert.alert(
      '⚠️ Wipe All Data',
      `This will permanently delete:\n\n` +
        `• ${dataStats.episodes} episode(s)\n` +
        `• ${dataStats.checkins} check-in(s)\n` +
        `• ${dataStats.dayNotes} day note(s)\n` +
        `• ${dataStats.reports} report(s)\n\n` +
        `This action CANNOT be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export First',
          onPress: async () => {
            await handleExportData();
          },
        },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type "DELETE" in your mind and tap confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await wipeAllData();
                      await loadSettings();
                      Alert.alert('Data Wiped', 'All local data has been deleted.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to wipe data.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleToggleShareDefault = async (field: string, value: boolean) => {
    if (!baseline) return;
    
    const currentDefaults = baseline.share_defaults || {};
    const newDefaults = { ...currentDefaults, [field]: value };
    
    await saveBaselineContext({ share_defaults: newDefaults });
    setBaseline({ ...baseline, share_defaults: newDefaults as Record<string, boolean> });
  };

  const shareDefaults: Record<string, boolean> = (baseline?.share_defaults || {}) as Record<string, boolean>;

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Reminders Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Weekly check-in reminder</Text>
          <Switch
            value={reminderSettings.enabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </View>
        
        {reminderSettings.enabled && (
          <>
            <TouchableOpacity 
              style={styles.row}
              onPress={() => setShowDayPicker(true)}
            >
              <Text style={styles.rowLabel}>Day</Text>
              <Text style={styles.rowValue}>{getDayName(reminderSettings.dayOfWeek)} →</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.row}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.rowLabel}>Time</Text>
              <Text style={styles.rowValue}>
                {formatTime(reminderSettings.hour, reminderSettings.minute)} →
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Privacy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Defaults</Text>
        <TouchableOpacity 
          style={styles.row}
          onPress={() => setShowPrivacyEditor(true)}
        >
          <Text style={styles.rowLabel}>Default sharing preferences</Text>
          <Text style={styles.rowValue}>Edit →</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Choose which baseline fields to include by default when generating reports.
        </Text>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dataStats.episodes}</Text>
            <Text style={styles.statLabel}>episodes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dataStats.checkins}</Text>
            <Text style={styles.statLabel}>check-ins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dataStats.dayNotes}</Text>
            <Text style={styles.statLabel}>notes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{dataStats.reports}</Text>
            <Text style={styles.statLabel}>reports</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.row} onPress={handleExportData}>
          <Text style={styles.rowLabel}>Export all data</Text>
          <Text style={styles.rowValue}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.row, styles.dangerRow]} 
          onPress={handleWipeData}
        >
          <Text style={styles.dangerLabel}>Wipe all local data</Text>
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App version</Text>
          <Text style={styles.rowValue}>0.1.0</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Schema version</Text>
          <Text style={styles.rowValue}>0.1.0</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.footerIcon}
        />
        <Text style={styles.footerText}>Gordon — an n-of-1 report tool</Text>
        <Text style={styles.footerSubtext}>
          Privacy-first. Nothing leaves without consent.
        </Text>
      </View>

      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Day</Text>
            <ScrollView style={styles.optionList}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.optionItem,
                    reminderSettings.dayOfWeek === day.value && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelectDay(day.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      reminderSettings.dayOfWeek === day.value && styles.optionTextSelected,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowDayPicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <ScrollView style={styles.optionList}>
              {HOURS.map((hour) => (
                <TouchableOpacity
                  key={hour.value}
                  style={[
                    styles.optionItem,
                    reminderSettings.hour === hour.value && styles.optionItemSelected,
                  ]}
                  onPress={() => handleSelectTime(hour.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      reminderSettings.hour === hour.value && styles.optionTextSelected,
                    ]}
                  >
                    {hour.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Editor Modal */}
      <Modal
        visible={showPrivacyEditor}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrivacyEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Default Sharing</Text>
            <Text style={styles.modalSubtitle}>
              Choose which fields to include by default in share-safe reports.
            </Text>
            <ScrollView style={styles.optionList}>
              {[
                { key: 'sex', label: 'Sex' },
                { key: 'age_bracket', label: 'Age bracket' },
                { key: 'height_bracket_cm', label: 'Height bracket' },
                { key: 'weight_bracket_kg', label: 'Weight bracket' },
                { key: 'relationship_status', label: 'Relationship status' },
                { key: 'typical_cardio_min_per_week', label: 'Exercise level' },
                { key: 'routine_summary', label: 'Routine summary' },
              ].map((field) => (
                <View key={field.key} style={styles.privacyRow}>
                  <Text style={styles.privacyLabel}>{field.label}</Text>
                  <Switch
                    value={shareDefaults[field.key] !== false}
                    onValueChange={(value) => handleToggleShareDefault(field.key, value)}
                    trackColor={{ false: colors.border, true: colors.accent }}
                    thumbColor={colors.textPrimary}
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowPrivacyEditor(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  hint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  optionList: {
    maxHeight: 300,
  },
  optionItem: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  optionItemSelected: {
    backgroundColor: colors.accent,
  },
  optionText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  modalClose: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalCloseText: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: '500',
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  privacyLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
});
