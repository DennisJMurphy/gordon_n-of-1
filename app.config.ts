import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'Gordon',
  slug: 'gordon_n-of-1',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0f1729', // matches theme background
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.gordon.nof1',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0f1729',
    },
    edgeToEdgeEnabled: true,
    package: 'com.gordon.nof1',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-sqlite'],
  extra: {
    eas: {
      projectId: '12e540e3-c20f-40fb-9a16-3efe865eb8c7',
    },
  },
});
