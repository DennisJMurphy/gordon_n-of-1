// src/screens/onboarding/IntroScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ScreenContainer, Button } from '../../components/ui';
import { colors, spacing, fontSize } from '../../theme';
import { OnboardingScreenProps } from '../../navigation/types';

export function IntroScreen({ navigation }: OnboardingScreenProps<'Intro'>) {
  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../../assets/splash-icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Gordon</Text>
          <Text style={styles.subtitle}>an n-of-1 report tool</Text>
        </View>

        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>
            Anonymous episode reports for science.
          </Text>
          <Text style={styles.description}>
            Turn personal self-experiments into structured, privacy-aware summaries 
            — without tracking your whole life.
          </Text>
        </View>

        <View style={styles.principles}>
          <Text style={styles.principleItem}>📊 Episodes over diaries</Text>
          <Text style={styles.principleItem}>🔒 Nothing leaves without consent</Text>
          <Text style={styles.principleItem}>⏱️ ~60 seconds per week</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('BaselineContext')}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  tagline: {
    fontSize: fontSize.lg,
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  principles: {
    gap: spacing.sm,
  },
  principleItem: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: spacing.lg,
  },
});
