// src/components/ui/ScreenContainer.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  /** Include bottom safe area inset. Use for screens without a tab bar (e.g. onboarding). */
  safeBottom?: boolean;
}

export function ScreenContainer({
  children,
  scrollable = false,
  padded = true,
  safeBottom = false,
}: ScreenContainerProps) {
  const edges: Edge[] = safeBottom
    ? ['top', 'left', 'right', 'bottom']
    : ['top', 'left', 'right'];

  const content = (
    <View style={[styles.inner, padded && styles.padded]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scrollable ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
