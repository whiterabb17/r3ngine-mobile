import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import AttackPathNarrative from '../../src/components/Intelligence/AttackPathNarrative';

export default function AttackPathDetail() {
  const { pathId, pathData } = useLocalSearchParams<{ pathId: string, pathData: string }>();
  
  const data = React.useMemo(() => {
    if (pathData) {
      try {
        return JSON.parse(pathData);
      } catch (e) {
        console.error('Failed to parse pathData', e);
        return null;
      }
    }
    return null;
  }, [pathData]);

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Tactical data not found for {pathId}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Path: ${pathId}` }} />
      <AttackPathNarrative 
        steps={data.steps} 
        score={data.score} 
        risk={data.risk} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Theme.colors.danger,
    fontFamily: 'Orbitron',
    fontSize: 12,
  }
});
