import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import AssetGraph from '../../../src/components/Observability/AssetGraph';
import { Theme } from '../../../src/constants/Theme';

export default function TargetGraphScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen 
        options={{
          headerTitle: 'TARGET TOPOLOGY',
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.primary,
          headerTitleStyle: { fontFamily: 'Bangers' },
        }} 
      />
      <AssetGraph targetId={parseInt(id)} />
    </>
  );
}
