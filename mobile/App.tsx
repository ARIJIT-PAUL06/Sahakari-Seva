// ==============================================================================
// SAHAKARI SEVA MOBILE APPLICATION — EXPO ROOT APP
// Cooperative Gig Services with Real Geolocation, AI Forecasting & Localization
// English + 13 Major Indian Languages (हिन्दी, বাংলা, தமிழ், తెలుగు, मराठी, ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, ଓଡ଼ିଆ, অসমীয়া, اردو, भोजपुरी)
// Light & Dark Themes with animated glitch-free switching
// ==============================================================================

import React from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme as NavDarkTheme,
} from '@react-navigation/native';
import './src/i18n';
import { RootNavigator, rootNavigationRef } from './src/navigation/RootNavigator';
import { LanguageSwitchProvider } from './src/animations';
import { ThemeProvider, useTheme } from './src/theme';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { DatabaseService } from './src/services/databaseService';

// Ignore normal offline mock database fallback warnings in Expo Go
LogBox.ignoreLogs([
  '[ApiClient]',
  '[LocationService]',
  'fetch failed',
  'Fetch request has been canceled',
  'Network request failed',
  'Location request timed out',
]);

// Reads the active theme to style the status bar and navigation chrome
const ThemedApp: React.FC = () => {
  const { colors, isDark } = useTheme();

  React.useEffect(() => {
    DatabaseService.initialize().catch((err) => {
      console.warn('Database initialization notice:', err);
    });
  }, []);

  const navTheme = {
    ...(isDark ? NavDarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? NavDarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <NavigationContainer ref={rootNavigationRef} theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageSwitchProvider>
          <ErrorBoundary fallbackTitle="Sahakari Seva">
            <ThemedApp />
          </ErrorBoundary>
        </LanguageSwitchProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}