import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../../components/ui';
import { colors, fontSize, spacing } from '../../theme';

export function ReportsScreen() {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Reports unavailable</Text>
        <Text style={styles.message}>
          Reports are being redesigned for continuous history and are not available in this version.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  title: { color: colors.textPrimary, fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.textSecondary, fontSize: fontSize.md, lineHeight: 22, textAlign: 'center', marginTop: spacing.md },
});