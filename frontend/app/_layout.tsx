import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SaveSlotsProvider } from '../src/context/SaveSlotsContext';
import { GameProvider } from '../src/context/GameContext';

export default function RootLayout() {
  return (
    <SaveSlotsProvider>
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
    </SaveSlotsProvider>
  );
}
