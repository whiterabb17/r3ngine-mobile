import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import AssetGraph from '../../../src/components/Observability/AssetGraph';
import { Theme } from '../../../src/constants/Theme';

export default function ScanGraphScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'SCAN TOPOLOGY',
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.primary,
          headerTitleStyle: { fontFamily: 'Bangers' },
        }} 
      />
      <AssetGraph scanId={parseInt(id)} />
    </>
  );
}
