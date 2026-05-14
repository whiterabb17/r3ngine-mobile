import React from 'react';
import { Stack } from 'expo-router';
import SystemLogViewer from '../../../src/components/Observability/SystemLogViewer';
import { Theme } from '../../../src/constants/Theme';

export default function SystemLogsScreen() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'SYSTEM OBSERVABILITY',
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.primary,
          headerTitleStyle: { fontFamily: 'Bangers' },
        }} 
      />
      <SystemLogViewer />
    </>
  );
}
