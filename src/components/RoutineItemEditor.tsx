// src/components/RoutineItemEditor.tsx
// Inline editor for adding/viewing baseline routine items (standard interventions)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Button, Select, TextInput } from './ui';
import { colors, spacing, fontSize, borderRadius } from '../theme';
import {
  RoutineItem,
  Compound,
  Route,
  Form,
  WithFood,
  Timing,
  Frequency,
} from '../types';

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

function getRoutineLabel(item: RoutineItem): string {
  const name = item.compound === 'other' && item.custom_name
    ? item.custom_name
    : item.compound.toUpperCase();
  const doseStr = item.dose ? ` ${item.dose}${item.unit || ''}` : '';
  const sinceStr = item.start_date ? ` since ${item.start_date}` : '';
  const consistencyStr = item.consistency_pct != null ? ` (~${item.consistency_pct}%)` : '';
  return `${name}${doseStr}${sinceStr}${consistencyStr}`;
}

interface RoutineItemEditorProps {
  items: RoutineItem[];
  onChange: (items: RoutineItem[]) => void;
}

export function RoutineItemEditor({ items, onChange }: RoutineItemEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [compound, setCompound] = useState<Compound>('nmn');
  const [customName, setCustomName] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [route, setRoute] = useState<Route>('oral');
  const [form, setForm] = useState<Form>('powder');
  const [timing, setTiming] = useState<Timing[]>([]);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [withFood, setWithFood] = useState<WithFood>('no');
  const [brand, setBrand] = useState('');
  const [product, setProduct] = useState('');
  const [startDate, setStartDate] = useState('');
  const [consistencyPct, setConsistencyPct] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCompound('nmn');
    setCustomName('');
    setDose('');
    setUnit('mg');
    setRoute('oral');
    setForm('powder');
    setTiming([]);
    setFrequency('daily');
    setWithFood('no');
    setBrand('');
    setProduct('');
    setStartDate('');
    setConsistencyPct('');
    setNotes('');
  };

  const toggleTiming = (t: Timing) => {
    setTiming((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleAdd = () => {
    if (compound === 'other' && !customName.trim()) {
      Alert.alert('Name required', 'Please enter a name for this intervention.');
      return;
    }

    const item: RoutineItem = {
      compound,
      custom_name: compound === 'other' ? customName.trim() : undefined,
      dose: dose ? parseFloat(dose) : undefined,
      unit: unit || undefined,
      route,
      form,
      timing,
      frequency,
      with_food: withFood,
      brand: brand || undefined,
      product: product || undefined,
      start_date: startDate || undefined,
      consistency_pct: consistencyPct ? parseInt(consistencyPct, 10) : undefined,
      notes: notes || undefined,
    };

    onChange([...items, item]);
    resetForm();
    setShowForm(false);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Standard Interventions / Habits</Text>
      <Text style={styles.sectionHint}>
        Supplements or habits you use regularly, independent of any episode.
      </Text>

      {items.length > 0 && (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listItemText}>{getRoutineLabel(item)}</Text>
              <TouchableOpacity onPress={() => handleRemove(index)}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {showForm ? (
        <View style={styles.formContainer}>
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

          <Select label="Route" options={ROUTE_OPTIONS} value={route} onChange={setRoute} />
          <Select label="Form" options={FORM_OPTIONS} value={form} onChange={setForm} />

          <View style={styles.timingSection}>
            <Text style={styles.label}>Timing</Text>
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

          <Select label="Frequency" options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} />
          <Select label="With food?" options={WITH_FOOD_OPTIONS} value={withFood} onChange={setWithFood} />

          <TextInput
            label="Since (optional)"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="e.g., 2024-01 or 2024-06-15"
          />

          <TextInput
            label="Consistency % (optional)"
            value={consistencyPct}
            onChangeText={setConsistencyPct}
            keyboardType="numeric"
            placeholder="e.g., 95"
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

          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional context"
            multiline
          />

          <View style={styles.formActions}>
            <Button title="Add" onPress={handleAdd} />
            <Button title="Cancel" variant="ghost" onPress={() => { resetForm(); setShowForm(false); }} />
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Add Standard Intervention</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listItemText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  deleteText: {
    fontSize: fontSize.md,
    color: colors.error,
    paddingHorizontal: spacing.sm,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    backgroundColor: colors.background,
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
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  addButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: '600',
  },
});
