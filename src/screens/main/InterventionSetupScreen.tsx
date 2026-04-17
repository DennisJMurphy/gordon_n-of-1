// src/screens/main/InterventionSetupScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, Button, Select, TextInput } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { HomeStackScreenProps } from '../../navigation/types';
import { Compound, Route, Form, WithFood, Timing, Frequency, Intervention } from '../../types';
import { createIntervention, getInterventionsByEpisode, deleteIntervention } from '../../db/repositories/interventions';

const COMPOUND_OPTIONS: { label: string; value: Compound }[] = [
  { label: 'NMN', value: 'nmn' },
  { label: 'TMG', value: 'tmg' },
  { label: 'Omega-3', value: 'omega3' },
  { label: 'Magnesium', value: 'magnesium' },
  { label: 'Creatine', value: 'creatine' },
  { label: 'Collagen', value: 'collagen' },
  { label: 'Other', value: 'other' },
];

const ROUTE_OPTIONS: { label: string; value: Route }[] = [
  { label: 'Oral', value: 'oral' },
  { label: 'Sublingual', value: 'sublingual' },
];

const FORM_OPTIONS: { label: string; value: Form }[] = [
  { label: 'Powder', value: 'powder' },
  { label: 'Capsule', value: 'capsule' },
  { label: 'Liquid', value: 'liquid' },
  { label: 'Food', value: 'food' },
];

const TIMING_OPTIONS: { label: string; value: Timing }[] = [
  { label: 'Upon waking', value: 'upon_waking' },
  { label: 'Morning', value: 'morning' },
  { label: 'Midday', value: 'midday' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Before bed', value: 'before_bed' },
];

const FREQUENCY_OPTIONS: { label: string; value: Frequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
];

const WITH_FOOD_OPTIONS: { label: string; value: WithFood }[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Mixed', value: 'mixed' },
];

function getInterventionLabel(i: Intervention): string {
  const name = i.compound === 'other' && i.custom_name ? i.custom_name : i.compound.toUpperCase();
  const doseStr = i.dose ? ` ${i.dose}${i.unit || ''}` : '';
  return `${name}${doseStr}`;
}

type Props = HomeStackScreenProps<'InterventionSetup'>;

export function InterventionSetupScreen({ navigation, route }: Props) {
  const { episodeId } = route.params;

  const [savedInterventions, setSavedInterventions] = useState<Intervention[]>([]);
  const [compound, setCompound] = useState<Compound>('nmn');
  const [customName, setCustomName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [routeVal, setRouteVal] = useState<Route>('oral');
  const [form, setForm] = useState<Form>('powder');
  const [timing, setTiming] = useState<Timing[]>(['upon_waking']);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [withFood, setWithFood] = useState<WithFood>('no');
  const [brand, setBrand] = useState('');
  const [product, setProduct] = useState('');

  const [includeTmg, setIncludeTmg] = useState(false);
  const [tmgDose, setTmgDose] = useState('');

  const [saving, setSaving] = useState(false);

  const loadSaved = useCallback(async () => {
    try {
      const existing = await getInterventionsByEpisode(episodeId);
      setSavedInterventions(existing);
    } catch (error) {
      console.error('Failed to load interventions:', error);
    }
  }, [episodeId]);

  useFocusEffect(useCallback(() => { loadSaved(); }, [loadSaved]));

  const resetForm = () => {
    setCompound('nmn');
    setCustomName('');
    setDose('');
    setUnit('mg');
    setRouteVal('oral');
    setForm('powder');
    setTiming(['upon_waking']);
    setFrequency('daily');
    setWithFood('no');
    setBrand('');
    setProduct('');
    setIncludeTmg(false);
    setTmgDose('');
  };

  const toggleTiming = (t: Timing) => {
    setTiming((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleSave = async (addAnother: boolean) => {
    if (compound === 'other' && !customName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this intervention.');
      return;
    }

    setSaving(true);
    try {
      await createIntervention({
        episode_id: episodeId,
        compound,
        custom_name: compound === 'other' ? customName.trim() : undefined,
        dose: dose ? parseFloat(dose) : undefined,
        unit: unit || undefined,
        route: routeVal,
        form,
        timing,
        frequency,
        with_food: withFood,
        brand: brand || undefined,
        product: product || undefined,
      });

      if (includeTmg) {
        await createIntervention({
          episode_id: episodeId,
          compound: 'tmg',
          dose: tmgDose ? parseFloat(tmgDose) : undefined,
          unit: 'mg',
          route: 'oral',
          form: 'powder',
          timing,
          frequency: 'daily',
          with_food: withFood,
        });
      }

      if (addAnother) {
        resetForm();
        await loadSaved();
      } else {
        navigation.popToTop();
      }
    } catch (error) {
      console.error('Failed to save intervention:', error);
      Alert.alert('Error', 'Failed to save intervention. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Intervention', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIntervention(id);
            await loadSaved();
          } catch (error) {
            console.error('Failed to delete intervention:', error);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Define Your Intervention</Text>
        <Text style={styles.subtitle}>
          What are you trying? You can add multiple interventions.
        </Text>
      </View>

      {/* Saved interventions list */}
      {savedInterventions.length > 0 && (
        <View style={styles.savedSection}>
          <Text style={styles.savedTitle}>Saved ({savedInterventions.length})</Text>
          {savedInterventions.map((item) => (
            <View key={item.id} style={styles.savedItem}>
              <Text style={styles.savedItemText}>{getInterventionLabel(item)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.form}>
        <Select
          label="Compound"
          options={COMPOUND_OPTIONS}
          value={compound}
          onChange={setCompound}
        />

        {compound === 'other' && (
          <TextInput
            label="Name"
            value={customName}
            onChangeText={setCustomName}
            placeholder="e.g., Laser cap, Red light therapy"
          />
        )}

        <View style={styles.doseRow}>
          <View style={styles.doseField}>
            <TextInput
              label="Dose"
              value={dose}
              onChangeText={setDose}
              keyboardType="numeric"
              placeholder="500"
            />
          </View>
          <View style={styles.unitField}>
            <TextInput
              label="Unit"
              value={unit}
              onChangeText={setUnit}
              placeholder="mg"
            />
          </View>
        </View>

        <Select
          label="Route"
          options={ROUTE_OPTIONS}
          value={routeVal}
          onChange={setRouteVal}
        />

        <Select
          label="Form"
          options={FORM_OPTIONS}
          value={form}
          onChange={setForm}
        />

        <View style={styles.timingSection}>
          <Text style={styles.label}>Timing (select all that apply)</Text>
          <View style={styles.timingOptions}>
            {TIMING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.timingChip,
                  timing.includes(opt.value) && styles.timingChipSelected,
                ]}
                onPress={() => toggleTiming(opt.value)}
              >
                <Text
                  style={[
                    styles.timingChipText,
                    timing.includes(opt.value) && styles.timingChipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Select
          label="Frequency"
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={setFrequency}
        />

        <Select
          label="With food?"
          options={WITH_FOOD_OPTIONS}
          value={withFood}
          onChange={setWithFood}
        />

        <TextInput
          label="Brand (optional)"
          value={brand}
          onChangeText={setBrand}
          placeholder="e.g., ProHealth"
        />

        <TextInput
          label="Product (optional)"
          value={product}
          onChangeText={setProduct}
          placeholder="e.g., Uthever NMN"
        />

        {/* TMG co-intervention — only shown when primary is NMN */}
        {compound === 'nmn' && (
          <View style={styles.coInterventionSection}>
            <TouchableOpacity
              style={styles.coInterventionToggle}
              onPress={() => setIncludeTmg(!includeTmg)}
            >
              <View style={[styles.checkbox, includeTmg && styles.checkboxChecked]}>
                {includeTmg && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.coInterventionLabel}>
                Also taking TMG (common with NMN)
              </Text>
            </TouchableOpacity>

            {includeTmg && (
              <View style={styles.tmgDoseRow}>
                <TextInput
                  label="TMG dose (mg)"
                  value={tmgDose}
                  onChangeText={setTmgDose}
                  keyboardType="numeric"
                  placeholder="500"
                />
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Saving...' : 'Save Intervention'}
          onPress={() => handleSave(false)}
          disabled={saving}
        />
        <Button
          title="Save & Add Another"
          variant="secondary"
          onPress={() => handleSave(true)}
          disabled={saving}
        />
        {savedInterventions.length > 0 && (
          <Button
            title="Done"
            variant="ghost"
            onPress={() => navigation.popToTop()}
          />
        )}
        {savedInterventions.length === 0 && (
          <Button
            title="Skip for now"
            variant="ghost"
            onPress={() => navigation.popToTop()}
          />
        )}
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
  savedSection: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  savedTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  savedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  savedItemText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  deleteText: {
    fontSize: fontSize.md,
    color: colors.error,
    paddingHorizontal: spacing.sm,
  },
  form: {
    flex: 1,
  },
  doseRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  doseField: {
    flex: 2,
  },
  unitField: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  timingSection: {
    marginBottom: spacing.md,
  },
  timingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timingChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timingChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timingChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  timingChipTextSelected: {
    color: colors.background,
    fontWeight: '600',
  },
  coInterventionSection: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  coInterventionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.background,
    fontWeight: '700',
  },
  coInterventionLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  tmgDoseRow: {
    marginTop: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
});
