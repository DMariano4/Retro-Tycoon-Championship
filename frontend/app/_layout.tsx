import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { GameProvider } from '../src/context/GameContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <GameProvider>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0a1628' },
              animation: 'fade',
            }}
          />
        </SafeAreaProvider>
      </GameProvider>
    </AuthProvider>
  );
}
