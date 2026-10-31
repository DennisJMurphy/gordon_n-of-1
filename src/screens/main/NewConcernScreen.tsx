import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ScreenContainer, TextInput } from '../../components/ui';
import { HomeStackParamList } from '../../navigation/types';
import { createConcern } from '../../db/repositories/concerns';
import { isValidApproximateDate } from '../../utils/dates';
import { colors, fontSize, spacing } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'NewConcern'>;

export function NewConcernScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [onsetDate, setOnsetDate] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Name required', 'Add a short name for this concern.');
      return;
    }
    const date = onsetDate.trim();
    if (date && !isValidApproximateDate(date)) {
      Alert.alert('Check the date', 'Use YYYY, YYYY-MM or YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    try {
      const concern = await createConcern({
        title,
        onset_date: date || undefined,
        initial_note: initialNote || undefined,
      });
      navigation.replace('ConcernDetail', { concernId: concern.id });
    } catch (error) {
      console.error('Failed to create concern:', error);
      Alert.alert('Error', 'Could not save this concern. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer scrollable safeBottom>
      <View style={styles.header}>
        <Text style={styles.title}>New concern</Text>
        <Text style={styles.subtitle}>Start a timeline. You can add or revise information later.</Text>
      </View>

      <TextInput
        label="Concern"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Scratchy throat"
        maxLength={100}
        returnKeyType="next"
      />
      <TextInput
        label="Onset date (optional)"
        value={onsetDate}
        onChangeText={setOnsetDate}
        placeholder="YYYY, YYYY-MM or YYYY-MM-DD"
        autoCapitalize="none"
        maxLength={10}
      />
      <Text style={styles.hint}>Leave blank if unknown. Use the precision you know; do not guess.</Text>
      <TextInput
        label="Initial observation (optional)"
        value={initialNote}
        onChangeText={setInitialNote}
        placeholder="What did you first notice?"
        multiline
        textAlignVertical="top"
        style={styles.noteInput}
        maxLength={500}
      />

      <View style={styles.footer}>
        <Button title="Create concern" onPress={handleCreate} loading={saving} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  noteInput: {
    minHeight: 112,
    paddingTop: spacing.md,
  },
  footer: {
    marginTop: spacing.lg,
  },
});