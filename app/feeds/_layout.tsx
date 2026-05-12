import { Stack } from 'expo-router';
import { Theme } from '../../src/constants/Theme';

export default function FeedsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.colors.surface,
        },
        headerTintColor: Theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Bangers',
          fontSize: 16,
          color: Theme.colors.primary,
        },
      }}
    />
  );
}
