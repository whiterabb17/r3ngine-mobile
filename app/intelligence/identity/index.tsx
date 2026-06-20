import React, { useMemo } from 'react';
import { SectionList, View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import IdentityInfraCard from '../../../src/components/Identity/IdentityInfraCard';
import { listIdentityInfra, IDENTITY_KEYS, type IdentityInfraDiscovery, type IdentityProvider } from '../../../src/api/identity';

export default function IdentityScreen({ scanId }: { scanId?: number } = {}) {
  const router = useRouter();
  const q = useQuery({
    queryKey: IDENTITY_KEYS.list(scanId),
    queryFn: () => listIdentityInfra(scanId),
    staleTime: 30_000,
  });

  const sections = useMemo(() => {
    const groups = new Map<IdentityProvider, IdentityInfraDiscovery[]>();
    (q.data ?? []).forEach(d => {
      const arr = groups.get(d.provider) ?? [];
      arr.push(d);
      groups.set(d.provider, arr);
    });
    return Array.from(groups.entries()).map(([provider, data]) => ({ title: provider, data }));
  }, [q.data]);

  if (q.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  }

  return (
    <SectionList
      style={styles.root}
      contentContainerStyle={{ padding: Theme.spacing.md }}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      renderSectionHeader={({ section }) => (
        <Text style={styles.section}>{section.title.toUpperCase().replace('_', ' ')}</Text>
      )}
      renderItem={({ item }) => (
        <IdentityInfraCard
          item={item}
          onPress={() => router.push(`/intelligence/identity/${item.id}` as never)}
        />
      )}
      ListEmptyComponent={<Text style={styles.empty}>No identity infrastructure detected.</Text>}
      refreshControl={
        <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={Theme.colors.primary} />
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginTop: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
});
