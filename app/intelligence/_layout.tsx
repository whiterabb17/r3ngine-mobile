import { Stack } from 'expo-router';
import { Theme } from '../../src/constants/Theme';

export default function IntelligenceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.colors.surface,
        },
        headerTintColor: Theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Orbitron',
          fontSize: 16,
          color: Theme.colors.primary,
        },
      }}
    />
  );
}
