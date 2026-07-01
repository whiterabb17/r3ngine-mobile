import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Code } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import {
  listAPIIntelProfiles,
  API_INTEL_KEYS,
  type APIIntelProfile,
  type APIType,
} from '../../../src/api/apiIntel';
import APIProfileCard from '../../../src/components/APIIntel/APIProfileCard';
import APITypeChip from '../../../src/components/APIIntel/APITypeChip';

const ALL_TYPES: APIType[] = ['rest', 'graphql', 'soap', 'generic'];

interface Props {
  scanId?: number;
}

export default function APIIntelListScreen({ scanId: scanIdProp }: Props = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ scanId?: string }>();
  const scanId = scanIdProp ?? (params.scanId ? Number(params.scanId) : undefined);
  const [selectedType, setSelectedType] = useState<APIType | null>(null);

  const profilesQ = useQuery({
    queryKey: API_INTEL_KEYS.list(scanId),
    queryFn: () => listAPIIntelProfiles(scanId),
    staleTime: 30_000,
  });

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<APIType, number>> = {};
    for (const p of profilesQ.data ?? []) {
      const t = p.api_type as APIType;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }, [profilesQ.data]);

  const displayProfiles: APIIntelProfile[] = useMemo(() => {
    const all = profilesQ.data ?? [];
    return selectedType ? all.filter(p => p.api_type === selectedType) : all;
  }, [profilesQ.data, selectedType]);

  const renderItem = useCallback(({ item }: { item: APIIntelProfile }) => (
    <APIProfileCard
      profile={item}
      onPress={() => router.push(`/intelligence/api-intel/${item.id}` as never)}
    />
  ), [router]);

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'API Intelligence' }} />
      {profilesQ.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Mapping API Surface...</Text>
        </View>
      ) : profilesQ.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load API profiles</Text>
          <Text style={styles.retryText} onPress={() => profilesQ.refetch()}>
            Retry
          </Text>
        </View>
      ) : (profilesQ.data?.length ?? 0) === 0 ? (
        <View style={styles.center}>
          <Code size={48} color={Theme.colors.textMuted} />
          <Text style={styles.emptyText}>No API Profiles Found</Text>
          <Text style={styles.emptySubtext}>
            Run a scan with API Intelligence collection enabled to discover API clusters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayProfiles}
          keyExtractor={p => String(p.id)}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={styles.filterRow}>
              {ALL_TYPES.filter(t => (typeCounts[t] ?? 0) > 0).map(t => (
                <APITypeChip
                  key={t}
                  type={t}
                  isSelected={selectedType === t}
                  onPress={() => setSelectedType(selectedType === t ? null : t)}
                />
              ))}
            </View>
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={profilesQ.isRefetching}
              onRefresh={() => profilesQ.refetch()}
              tintColor={Theme.colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  list: { padding: Theme.spacing.md },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  loadingText: {
    marginTop: Theme.spacing.sm,
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Bangers',
  },
  errorText: { color: Theme.colors.error, fontSize: 14 },
  retryText: {
    color: Theme.colors.primary,
    fontSize: 13,
    marginTop: Theme.spacing.sm,
  },
  emptyText: {
    marginTop: Theme.spacing.md,
    color: Theme.colors.text,
    fontSize: 16,
    fontFamily: 'Bangers',
    textAlign: 'center',
  },
  emptySubtext: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
    lineHeight: 18,
  },
});
