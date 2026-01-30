import React, { useEffect, useState } from "react";
import { Text, View, StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initDb } from "./src/db";
import { RootNavigator } from "./src/navigation";
import { OnboardingProvider, useOnboarding } from "./src/context/OnboardingContext";
import { getBaselineContext } from "./src/db/repositories/baselineContext";
import { colors } from "./src/theme";

function AppContent() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setIsComplete } = useOnboarding();

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        
        // Check if user has already completed onboarding
        const baseline = await getBaselineContext();
        if (baseline) {
          setIsComplete(true);
        }
        
        setReady(true);
      } catch (e: any) {
        setError(e?.message ?? "DB init failed");
      }
    })();
  }, [setIsComplete]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.error }}>DB Error: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.textPrimary }}>Initializing…</Text>
      </View>
    );
  }

  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <OnboardingProvider>
          <AppContent />
        </OnboardingProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
