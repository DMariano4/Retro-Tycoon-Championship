import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { GameProvider } from '../src/context/GameContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GameProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0a1628' },
              animation: 'fade',
            }}
          />
        </GameProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
