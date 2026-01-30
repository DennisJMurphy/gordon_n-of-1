// src/theme/index.ts
// Gordon design tokens — dark, calm visual language

export const colors = {
  // Backgrounds
  background: '#0f1729',      // Dark blue (not black)
  surface: '#1a2540',         // Slightly lighter for cards
  surfaceElevated: '#243155', // For modals, sheets

  // Text
  textPrimary: '#f5f5f0',     // Ivory/white
  textSecondary: '#8ba4c7',   // Light blue/soft
  textMuted: '#5a7399',       // Even softer

  // Accents
  accent: '#4a9eff',          // Light blue accent
  accentMuted: '#3a7ecc',     // Muted accent
  
  // Semantic
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',

  // Borders
  border: '#2a3a5a',
  borderLight: '#3a4a6a',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
