// src/screens/main/PrivacyPreviewScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Button } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { ShareDefaults, BaselineContext } from '../../types';
import { getReportPreview, generateAndSaveReports, ShareSafeReport, ReportOptions } from '../../services/reportBuilder';
import { closeEpisode } from '../../db/repositories/episodes';

type Props = NativeStackScreenProps<HomeStackParamList, 'PrivacyPreview'>;

interface FieldToggle {
  key: keyof ShareDefaults;
  label: string;
  value: string | number | undefined;
  enabled: boolean;
}

export function PrivacyPreviewScreen({ navigation, route }: Props) {
  const { episodeId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [baseline, setBaseline] = useState<BaselineContext | null>(null);
  const [checkinCount, setCheckinCount] = useState(0);
  const [dayNoteCount, setDayNoteCount] = useState(0);
  const [preview, setPreview] = useState<ShareSafeReport | null>(null);
  const [showJson, setShowJson] = useState(false);
  
  // Share toggles
  const [includeBaseline, setIncludeBaseline] = useState(true);
  const [includeDayNotes, setIncludeDayNotes] = useState(false);
  const [shareOverrides, setShareOverrides] = useState<Partial<ShareDefaults>>({});
  
  useEffect(() => {
    loadPreview();
  }, []);
  
  useEffect(() => {
    // Reload preview when options change
    if (baseline !== null || !loading) {
      loadPreview();
    }
  }, [includeBaseline, includeDayNotes, shareOverrides]);
  
  const loadPreview = async () => {
    try {
      const options: ReportOptions = {
        includeBaseline,
        includeDayNotes,
        shareOverrides,
      };
      
      const data = await getReportPreview(episodeId, options);
      setBaseline(data.baseline);
      setCheckinCount(data.checkinCount);
      setDayNoteCount(data.dayNoteCount);
      setPreview(data.shareSafe);
      
      // Initialize share overrides from baseline defaults
      if (data.baseline && Object.keys(shareOverrides).length === 0) {
        setShareOverrides(data.baseline.share_defaults);
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
      Alert.alert('Error', 'Failed to load report preview');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleField = (key: keyof ShareDefaults) => {
    setShareOverrides(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  const handleGenerate = async () => {
    Alert.alert(
      'Close Episode & Generate Report',
      'This will close your episode and generate the final report. You can still view the data but cannot add new check-ins.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGenerating(true);
            try {
              const options: ReportOptions = {
                includeBaseline,
                includeDayNotes,
                shareOverrides,
              };
              
              // Close episode first
              await closeEpisode(episodeId);
              
              // Generate and save report
              const reportId = await generateAndSaveReports(episodeId, options);
              
              // Navigate to success screen
              navigation.replace('ReportSuccess', { reportId });
            } catch (error) {
              console.error('Failed to generate report:', error);
              Alert.alert('Error', 'Failed to generate report. Please try again.');
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };
  
  const getFieldToggles = (): FieldToggle[] => {
    if (!baseline) return [];
    
    const fields: FieldToggle[] = [
      { key: 'sex' as const, label: 'Sex', value: baseline.sex, enabled: shareOverrides.sex ?? false },
      { key: 'age_bracket' as const, label: 'Age Bracket', value: baseline.age_bracket, enabled: shareOverrides.age_bracket ?? false },
      { key: 'height_bracket_cm' as const, label: 'Height Bracket', value: baseline.height_bracket_cm, enabled: shareOverrides.height_bracket_cm ?? false },
      { key: 'weight_bracket_kg' as const, label: 'Weight Bracket', value: baseline.weight_bracket_kg, enabled: shareOverrides.weight_bracket_kg ?? false },
      { key: 'relationship_status' as const, label: 'Relationship Status', value: baseline.relationship_status, enabled: shareOverrides.relationship_status ?? false },
      { key: 'typical_cardio_min_per_week' as const, label: 'Cardio (min/week)', value: baseline.typical_cardio_min_per_week, enabled: shareOverrides.typical_cardio_min_per_week ?? false },
      { key: 'routine' as const, label: 'Routine Summary', value: baseline.routine.length > 0 ? `${baseline.routine.length} items` : undefined, enabled: shareOverrides.routine ?? false },
    ];
    return fields.filter(f => f.value !== undefined);
  };
  
  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Preview</Text>
          <Text style={styles.subtitle}>
            Review what will be included in your share-safe report
          </Text>
        </View>
        
        {/* Privacy Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Privacy Guarantees</Text>
          <View style={styles.checklistCard}>
            <View style={styles.checkItem}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.checkText}>No exact dates (relative day numbers only)</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.checkText}>No brand names in share-safe version</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.checkText}>Only bracketed demographic values</Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.checkText}>Free-text notes excluded</Text>
            </View>
          </View>
        </View>
        
        {/* Data Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Data Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Weekly Check-ins</Text>
              <Text style={styles.summaryValue}>{checkinCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Day Notes</Text>
              <Text style={styles.summaryValue}>{dayNoteCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Interventions</Text>
              <Text style={styles.summaryValue}>{preview?.interventions.length ?? 0}</Text>
            </View>
          </View>
        </View>
        
        {/* Include Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Include in Report</Text>
          
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIncludeBaseline(!includeBaseline)}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Baseline Context</Text>
              <Text style={styles.toggleHint}>Demographic info (per field toggles below)</Text>
            </View>
            <View style={[styles.toggle, includeBaseline && styles.toggleActive]}>
              <Text style={styles.toggleText}>{includeBaseline ? 'Yes' : 'No'}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIncludeDayNotes(!includeDayNotes)}
          >
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Day Notes Count</Text>
              <Text style={styles.toggleHint}>Only the count, not content</Text>
            </View>
            <View style={[styles.toggle, includeDayNotes && styles.toggleActive]}>
              <Text style={styles.toggleText}>{includeDayNotes ? 'Yes' : 'No'}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Baseline Field Toggles */}
        {includeBaseline && baseline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Baseline Fields</Text>
            <Text style={styles.sectionHint}>Toggle which demographic fields to include</Text>
            
            {getFieldToggles().map((field) => (
              <TouchableOpacity
                key={field.key}
                style={styles.fieldRow}
                onPress={() => handleToggleField(field.key)}
              >
                <View style={styles.fieldInfo}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={styles.fieldValue}>{String(field.value)}</Text>
                </View>
                <View style={[styles.toggle, field.enabled && styles.toggleActive]}>
                  <Text style={styles.toggleText}>{field.enabled ? '✓' : '✕'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Preview JSON */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.jsonToggle}
            onPress={() => setShowJson(!showJson)}
          >
            <Text style={styles.sectionTitle}>📄 Preview JSON</Text>
            <Text style={styles.jsonToggleIcon}>{showJson ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {showJson && preview && (
            <View style={styles.jsonContainer}>
              <Text style={styles.jsonText}>
                {JSON.stringify(preview, null, 2)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Generate Button */}
        <View style={styles.footer}>
          <Button
            title={generating ? 'Generating...' : 'Close Episode & Generate Report'}
            onPress={handleGenerate}
            loading={generating}
          />
          <Text style={styles.footerNote}>
            A private copy with all details is also saved locally
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  checklistCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  checkIcon: {
    fontSize: fontSize.md,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: '700',
  },
  checkText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  toggleHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.border,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  fieldValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  jsonToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jsonToggleIcon: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  jsonContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  jsonText: {
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  footer: {
    paddingVertical: spacing.xl,
  },
  footerNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
