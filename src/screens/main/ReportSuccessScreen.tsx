// src/screens/main/ReportSuccessScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
// eslint-disable-next-line react-native/no-deprecated-modules
import Clipboard  from '@react-native-clipboard/clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer, Button } from '../../components/ui';
import { colors, spacing, fontSize, borderRadius } from '../../theme';
import { HomeStackParamList } from '../../navigation/types';
import { Report, Episode } from '../../types';
import { getReportById, markReportExported } from '../../db/repositories/reports';
import { getEpisodeById } from '../../db/repositories/episodes';
import { ShareSafeReport } from '../../services/reportBuilder';
import { shareReportAsFile } from '../../services/reportSharing';

type Props = NativeStackScreenProps<HomeStackParamList, 'ReportSuccess'>;

export function ReportSuccessScreen({ navigation, route }: Props) {
  const { reportId } = route.params;
  
  const [report, setReport] = useState<Report | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [shareSafe, setShareSafe] = useState<ShareSafeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJson, setShowJson] = useState(false);
  
  useEffect(() => {
    loadReport();
  }, []);
  
  const loadReport = async () => {
    try {
      const r = await getReportById(reportId);
      setReport(r);
      if (r) {
        setShareSafe(JSON.parse(r.report_json));
        const ep = await getEpisodeById(r.episode_id);
        setEpisode(ep);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleShare = async () => {
    if (!report || !episode) return;
    
    try {
      await shareReportAsFile(report, episode.title);
      await markReportExported(report.id, 'share_sheet');
    } catch (error) {
      console.error('Failed to share:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };
  
  const handleCopy = () => {
    if (!report) return;
    const prettyJson = JSON.stringify(JSON.parse(report.report_json), null, 2);
    Clipboard.setString(prettyJson);
    Alert.alert('Copied!', 'Report JSON copied to clipboard.');
  };
  
  const handleDone = () => {
    // Reset to home, which will now show no active episode
    navigation.popToTop();
  };
  
  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      </ScreenContainer>
    );
  }
  
  if (!report || !shareSafe) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Report not found</Text>
          <Button title="Go Home" onPress={handleDone} />
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Report Generated!</Text>
          <Text style={styles.successSubtitle}>
            Your episode is now closed and your report is ready
          </Text>
        </View>
        
        {/* Report Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Schema Version</Text>
              <Text style={styles.summaryValue}>{shareSafe.schema_version}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Episode Type</Text>
              <Text style={styles.summaryValue}>{shareSafe.episode.type}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{shareSafe.episode.duration_days} days</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Interventions</Text>
              <Text style={styles.summaryValue}>{shareSafe.interventions.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Check-ins Analyzed</Text>
              <Text style={styles.summaryValue}>
                {shareSafe.adherence_summary.length > 0 
                  ? shareSafe.adherence_summary[0].weeks_tracked 
                  : 0
                }
              </Text>
            </View>
          </View>
        </View>
        
        {/* Adherence Summary */}
        {shareSafe.adherence_summary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adherence Summary</Text>
            <View style={styles.adherenceCard}>
              {shareSafe.adherence_summary.map((item, index) => (
                <View key={index} style={styles.adherenceRow}>
                  <Text style={styles.adherenceCompound}>{item.compound.toUpperCase()}</Text>
                  <View style={styles.adherenceBadge}>
                    <Text style={styles.adherenceText}>
                      {formatAdherence(item.average_adherence)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Changes Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notable Changes</Text>
          <View style={styles.changesGrid}>
            {renderChangeItem('🍽️ Diet', shareSafe.changes_summary.diet_changes)}
            {renderChangeItem('🏃 Exercise', shareSafe.changes_summary.exercise_changes)}
            {renderChangeItem('😴 Sleep', shareSafe.changes_summary.sleep_changes)}
            {renderChangeItem('🤒 Illness', shareSafe.changes_summary.illness_days)}
            {renderChangeItem('✈️ Travel', shareSafe.changes_summary.travel_days)}
            {renderChangeItem('😰 Stress', shareSafe.changes_summary.stress_periods)}
          </View>
        </View>
        
        {/* JSON Preview */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.jsonToggle}
            onPress={() => setShowJson(!showJson)}
          >
            <Text style={styles.sectionTitle}>📄 View JSON</Text>
            <Text style={styles.jsonToggleIcon}>{showJson ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {showJson && (
            <View style={styles.jsonContainer}>
              <Text style={styles.jsonText}>
                {JSON.stringify(shareSafe, null, 2)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Actions */}
        <View style={styles.actions}>
          <Button title="Share Report" onPress={handleShare} />
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCopy}>
            <Text style={styles.secondaryButtonText}>Copy JSON</Text>
          </TouchableOpacity>
        </View>
        
        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            This share-safe report contains no identifying information. 
            A complete private copy is stored locally on your device.
          </Text>
        </View>
        
        {/* Done Button */}
        <View style={styles.footer}>
          <Button title="Done" onPress={handleDone} variant="secondary" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function formatAdherence(level: string): string {
  const labels: Record<string, string> = {
    'every_day': 'Every Day',
    'most_days': 'Most Days',
    'some_days': 'Some Days',
    'rarely': 'Rarely',
    'not_at_all': 'Not at All',
    'unknown': 'Unknown',
  };
  return labels[level] || level;
}

function renderChangeItem(label: string, count: number) {
  return (
    <View style={styles.changeItem} key={label}>
      <Text style={styles.changeLabel}>{label}</Text>
      <Text style={[styles.changeCount, count > 0 && styles.changeCountActive]}>
        {count}
      </Text>
    </View>
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
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
    marginBottom: spacing.lg,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  successSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
  adherenceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  adherenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  adherenceCompound: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: '600',
  },
  adherenceBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  adherenceText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  changesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  changeItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minWidth: '30%',
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  changeCount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textMuted,
  },
  changeCountActive: {
    color: colors.warning,
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
    maxHeight: 300,
  },
  jsonText: {
    fontSize: fontSize.xs,
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  actions: {
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    color: colors.accent,
    fontWeight: '500',
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  privacyIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
});
