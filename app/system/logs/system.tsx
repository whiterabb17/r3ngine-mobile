import React from 'react';
import { Stack } from 'expo-router';
import SystemLogViewer from '../../../src/components/Observability/SystemLogViewer';
export default function SystemLogsScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SystemLogViewer />
    </>
  );
}
