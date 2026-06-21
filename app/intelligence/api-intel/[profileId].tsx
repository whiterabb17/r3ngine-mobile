import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import { getAPIIntelProfile, API_INTEL_KEYS } from '../../../src/api/apiIntel';
import APIProfileDetail from '../../../src/components/APIIntel/APIProfileDetail';

export default function APIIntelDetailScreen() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const id = Number(profileId);

  const profileQ = useQuery({
    queryKey: API_INTEL_KEYS.detail(id),
    queryFn: () => getAPIIntelProfile(id),
    staleTime: 30_000,
    enabled: id > 0,
  });

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'API Profile' }} />
      {profileQ.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
        </View>
      ) : profileQ.isError ? (
        <View style={styles.center}>
          <Text style={styles.error}>Failed to load profile</Text>
          <Text style={styles.retry} onPress={() => profileQ.refetch()}>
            Retry
          </Text>
        </View>
      ) : profileQ.data ? (
        <APIProfileDetail profile={profileQ.data} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: Theme.colors.error, fontSize: 14 },
  retry: { color: Theme.colors.primary, fontSize: 13, marginTop: Theme.spacing.sm },
});
