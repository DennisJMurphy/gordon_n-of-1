// src/screens/onboarding/BaselineContextScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer, Button, Select, TextInput, Toggle } from '../../components/ui';
import { colors, spacing, fontSize } from '../../theme';
import { OnboardingScreenProps } from '../../navigation/types';
import { Sex, RelationshipStatus, ShareDefaults } from '../../types';

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

// Use context to pass data between onboarding screens
import { useOnboarding } from '../../context/OnboardingContext';

export function BaselineContextScreen({ navigation }: OnboardingScreenProps<'BaselineContext'>) {
  const { state, updateBaseline } = useOnboarding();
  
  const [sex, setSex] = useState<Sex | undefined>(state.baseline.sex);
  const [ageBracket, setAgeBracket] = useState(state.baseline.age_bracket ?? '');
  const [heightBracket, setHeightBracket] = useState(state.baseline.height_bracket_cm ?? '');
  const [weightBracket, setWeightBracket] = useState(state.baseline.weight_bracket_kg ?? '');
  const [relationship, setRelationship] = useState<RelationshipStatus | undefined>(
    state.baseline.relationship_status
  );
  const [cardioMinutes, setCardioMinutes] = useState(
    state.baseline.typical_cardio_min_per_week?.toString() ?? ''
  );
  const [healthNotes, setHealthNotes] = useState(state.baseline.health_notes ?? '');

  // Share toggles
  const [shareDefaults, setShareDefaults] = useState<ShareDefaults>(
    state.baseline.share_defaults ?? {}
  );

  const handleNext = () => {
    updateBaseline({
      sex,
      age_bracket: ageBracket || undefined,
      height_bracket_cm: heightBracket || undefined,
      weight_bracket_kg: weightBracket || undefined,
      relationship_status: relationship,
      typical_cardio_min_per_week: cardioMinutes ? parseInt(cardioMinutes, 10) : undefined,
      health_notes: healthNotes || undefined,
      share_defaults: shareDefaults,
    });
    navigation.navigate('EpisodeSetup');
  };

  const toggleShare = (field: keyof ShareDefaults) => {
    setShareDefaults((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Your Baseline Context</Text>
        <Text style={styles.subtitle}>
          This bracketed info helps interpret your reports.{'\n'}
          All fields are optional. Toggle what to share by default.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Select
              label="Sex"
              options={SEX_OPTIONS}
              value={sex}
              onChange={setSex}
            />
          </View>
          <Toggle
            label="Share"
            value={shareDefaults.sex ?? false}
            onChange={() => toggleShare('sex')}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Select
              label="Age bracket"
              options={AGE_BRACKETS.map((b) => ({ label: b, value: b }))}
              value={ageBracket}
              onChange={setAgeBracket}
            />
          </View>
          <Toggle
            label="Share"
            value={shareDefaults.age_bracket ?? false}
            onChange={() => toggleShare('age_bracket')}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Select
              label="Height (cm)"
              options={HEIGHT_BRACKETS.map((b) => ({ label: b, value: b }))}
              value={heightBracket}
              onChange={setHeightBracket}
            />
          </View>
          <Toggle
            label="Share"
            value={shareDefaults.height_bracket_cm ?? false}
            onChange={() => toggleShare('height_bracket_cm')}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Select
              label="Weight (kg)"
              options={WEIGHT_BRACKETS.map((b) => ({ label: b, value: b }))}
              value={weightBracket}
              onChange={setWeightBracket}
            />
          </View>
          <Toggle
            label="Share"
            value={shareDefaults.weight_bracket_kg ?? false}
            onChange={() => toggleShare('weight_bracket_kg')}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Select
              label="Relationship"
              options={RELATIONSHIP_OPTIONS}
              value={relationship}
              onChange={setRelationship}
            />
          </View>
          <Toggle
            label="Share"
            value={shareDefaults.relationship_status ?? false}
            onChange={() => toggleShare('relationship_status')}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <TextInput
              label="Typical cardio (min/week)"
              value={cardioMinutes}
              onChangeText={setCardioMinutes}
              keyboardType="numeric"
              placeholder="e.g., 150"
            />
          </View>
          <Toggle
            label="Share"
            value={shareDefaults.typical_cardio_min_per_week ?? false}
            onChange={() => toggleShare('typical_cardio_min_per_week')}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <TextInput
              label="Health notes (brief)"
              value={healthNotes}
              onChangeText={setHealthNotes}
              placeholder="e.g., rosacea (well controlled)"
              multiline
            />
          </View>
          <Toggle
            label="Share"
            value={shareDefaults.health_notes ?? false}
            onChange={() => toggleShare('health_notes')}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Continue" onPress={handleNext} />
        <Button
          title="Skip for now"
          variant="ghost"
          onPress={() => navigation.navigate('EpisodeSetup')}
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
  section: {
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  field: {
    flex: 1,
  },
  footer: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
});
