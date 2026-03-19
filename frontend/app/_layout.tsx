import { Slot, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { GameProvider } from '../src/context/GameContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a1628' },
          animation: 'fade',
        }}
      >
        <Stack.Screen 
          name="index"
          options={{ headerShown: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

// Wrap the entire app with providers
export function unstable_settings() {
  return {
    initialRouteName: 'index',
  };
}
