// src/screens/main/EditBaselineScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, Button, TextInput } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { HomeStackScreenProps } from '../../navigation/types';
import { Sex, RelationshipStatus, ShareDefaults } from '../../types';
import { getBaselineContext, saveBaselineContext } from '../../db/repositories/baselineContext';

const SEX_OPTIONS: { label: string; value: Sex }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Intersex', value: 'intersex' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const AGE_BRACKETS = [
  '18-24', '25-29', '30-34', '35-39', '40-44', '45-49',
  '50-54', '55-59', '60-64', '65-69', '70+',
];

const HEIGHT_BRACKETS = [
  '<155', '155-159', '160-164', '165-169', '170-174',
  '175-179', '180-184', '185-189', '190+',
];

const WEIGHT_BRACKETS = [
  '<50', '50-54', '55-59', '60-64', '65-69', '70-74',
  '75-79', '80-84', '85-89', '90-94', '95-99', '100+',
];

const RELATIONSHIP_OPTIONS: { label: string; value: RelationshipStatus }[] = [
  { label: 'Single', value: 'single' },
  { label: 'Long-term', value: 'long_term' },
  { label: 'Married', value: 'married' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

interface FieldWithShareProps {
  label: string;
  shareValue: boolean;
  onShareChange: () => void;
  children: React.ReactNode;
}

function FieldWithShare({ label, shareValue, onShareChange, children }: FieldWithShareProps) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.shareToggle}>
          <Text style={styles.shareLabel}>Share</Text>
          <Switch
            value={shareValue}
            onValueChange={onShareChange}
            trackColor={{ false: colors.border, true: colors.accentMuted }}
            thumbColor={shareValue ? colors.accent : colors.textMuted}
          />
        </View>
      </View>
      {children}
    </View>
  );
}

interface ChipSelectProps<T extends string> {
  options: { label: string; value: T }[];
  value: T | undefined;
  onChange: (value: T) => void;
}

function ChipSelect<T extends string>({ options, value, onChange }: ChipSelectProps<T>) {
  return (
    <View style={styles.chipContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.chip,
            value === option.value && styles.chipSelected,
          ]}
          onPress={() => onChange(option.value)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              value === option.value && styles.chipTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function EditBaselineScreen({ navigation }: HomeStackScreenProps<'EditBaseline'>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sex, setSex] = useState<Sex | undefined>();
  const [ageBracket, setAgeBracket] = useState('');
  const [heightBracket, setHeightBracket] = useState('');
  const [weightBracket, setWeightBracket] = useState('');
  const [relationship, setRelationship] = useState<RelationshipStatus | undefined>();
  const [cardioMinutes, setCardioMinutes] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [shareDefaults, setShareDefaults] = useState<ShareDefaults>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const baseline = await getBaselineContext();
          if (baseline) {
            setSex(baseline.sex);
            setAgeBracket(baseline.age_bracket ?? '');
            setHeightBracket(baseline.height_bracket_cm ?? '');
            setWeightBracket(baseline.weight_bracket_kg ?? '');
            setRelationship(baseline.relationship_status);
            setCardioMinutes(baseline.typical_cardio_min_per_week?.toString() ?? '');
            setHealthNotes(baseline.health_notes ?? '');
            setShareDefaults(baseline.share_defaults ?? {});
          }
        } catch (error) {
          console.error('Failed to load baseline context:', error);
          Alert.alert('Error', 'Failed to load baseline data.');
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBaselineContext({
        sex,
        age_bracket: ageBracket || undefined,
        height_bracket_cm: heightBracket || undefined,
        weight_bracket_kg: weightBracket || undefined,
        relationship_status: relationship,
        typical_cardio_min_per_week: cardioMinutes ? parseInt(cardioMinutes, 10) : undefined,
        health_notes: healthNotes || undefined,
        share_defaults: shareDefaults,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save baseline context:', error);
      Alert.alert('Error', 'Failed to save baseline data.');
    } finally {
      setSaving(false);
    }
  };

  const toggleShare = (field: keyof ShareDefaults) => {
    setShareDefaults((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) return null;

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          Update your bracketed baseline info and sharing defaults.{'\n'}
          All fields are optional.
        </Text>
      </View>

      <View style={styles.section}>
        <FieldWithShare
          label="Sex"
          shareValue={shareDefaults.sex ?? false}
          onShareChange={() => toggleShare('sex')}
        >
          <ChipSelect options={SEX_OPTIONS} value={sex} onChange={setSex} />
        </FieldWithShare>

        <FieldWithShare
          label="Age bracket"
          shareValue={shareDefaults.age_bracket ?? false}
          onShareChange={() => toggleShare('age_bracket')}
        >
          <ChipSelect
            options={AGE_BRACKETS.map((b) => ({ label: b, value: b }))}
            value={ageBracket}
            onChange={setAgeBracket}
          />
        </FieldWithShare>

        <FieldWithShare
          label="Height (cm)"
          shareValue={shareDefaults.height_bracket_cm ?? false}
          onShareChange={() => toggleShare('height_bracket_cm')}
        >
          <ChipSelect
            options={HEIGHT_BRACKETS.map((b) => ({ label: b, value: b }))}
            value={heightBracket}
            onChange={setHeightBracket}
          />
        </FieldWithShare>

        <FieldWithShare
          label="Weight (kg)"
          shareValue={shareDefaults.weight_bracket_kg ?? false}
          onShareChange={() => toggleShare('weight_bracket_kg')}
        >
          <ChipSelect
            options={WEIGHT_BRACKETS.map((b) => ({ label: b, value: b }))}
            value={weightBracket}
            onChange={setWeightBracket}
          />
        </FieldWithShare>

        <FieldWithShare
          label="Relationship"
          shareValue={shareDefaults.relationship_status ?? false}
          onShareChange={() => toggleShare('relationship_status')}
        >
          <ChipSelect
            options={RELATIONSHIP_OPTIONS}
            value={relationship}
            onChange={setRelationship}
          />
        </FieldWithShare>

        <FieldWithShare
          label="Typical cardio (min/week)"
          shareValue={shareDefaults.typical_cardio_min_per_week ?? false}
          onShareChange={() => toggleShare('typical_cardio_min_per_week')}
        >
          <TextInput
            value={cardioMinutes}
            onChangeText={setCardioMinutes}
            keyboardType="numeric"
            placeholder="e.g., 150"
          />
        </FieldWithShare>

        <FieldWithShare
          label="Health notes (brief)"
          shareValue={shareDefaults.health_notes ?? false}
          onShareChange={() => toggleShare('health_notes')}
        >
          <TextInput
            value={healthNotes}
            onChangeText={setHealthNotes}
            placeholder="e.g., rosacea (well controlled)"
            multiline
          />
        </FieldWithShare>
      </View>

      <View style={styles.footer}>
        <Button title={saving ? 'Saving...' : 'Save'} onPress={handleSave} disabled={saving} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shareToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shareLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
});
