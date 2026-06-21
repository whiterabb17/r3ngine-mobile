import React, { useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Crosshair, FileCheck, KeyRound, Network, Code } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { KpiCard } from '../../src/components/KpiCard';
import { getExposureStats, listExposures, EXPOSURES_KEYS } from '../../src/api/exposures';
import { listCertificates, CERTS_KEYS } from '../../src/api/certificates';
import { listIdentityInfra, IDENTITY_KEYS } from '../../src/api/identity';
import { listAPIIntelProfiles, API_INTEL_KEYS } from '../../src/api/apiIntel';

export default function IntelHub() {
  const router = useRouter();

  const statsQ = useQuery({ queryKey: EXPOSURES_KEYS.stats(), queryFn: () => getExposureStats(), staleTime: 30_000 });
  const exposuresQ = useQuery({ queryKey: EXPOSURES_KEYS.list(), queryFn: () => listExposures(), staleTime: 30_000 });
  const certsQ = useQuery({ queryKey: CERTS_KEYS.list(), queryFn: () => listCertificates(), staleTime: 30_000 });
  const identQ = useQuery({ queryKey: IDENTITY_KEYS.list(), queryFn: () => listIdentityInfra(), staleTime: 30_000 });
  const apiIntelQ = useQuery({ queryKey: API_INTEL_KEYS.list(), queryFn: () => listAPIIntelProfiles(), staleTime: 30_000 });

  const recent = useMemo(() => {
    const items: { kind: string; title: string; created_at: string; id: number }[] = [];
    (exposuresQ.data ?? []).slice(0, 5).forEach(e => items.push({ kind: 'EXPOSURE', title: e.title, created_at: e.created_at, id: e.id }));
    (certsQ.data ?? []).slice(0, 5).forEach(c => items.push({ kind: 'CERT', title: c.subject_cn, created_at: c.not_before, id: c.id }));
    (identQ.data ?? []).slice(0, 5).forEach(i => items.push({ kind: 'IDENTITY', title: i.provider.toUpperCase().replace('_', ' '), created_at: i.first_seen, id: i.id }));
    return items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 10);
  }, [exposuresQ.data, certsQ.data, identQ.data]);

  const isRefreshing = statsQ.isRefetching || exposuresQ.isRefetching || certsQ.isRefetching || identQ.isRefetching || apiIntelQ.isRefetching;
  const onRefresh = () => {
    void statsQ.refetch();
    void exposuresQ.refetch();
    void certsQ.refetch();
    void identQ.refetch();
    void apiIntelQ.refetch();
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Intelligence Hub' }} />
      <ScrollView
        contentContainerStyle={{ padding: Theme.spacing.md }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
      >
        <View style={styles.grid}>
          <View style={styles.cell}>
            <KpiCard
              icon={ShieldAlert}
              color={Theme.colors.danger}
              title="Open Exposures"
              value={statsQ.data?.open ?? '—'}
              onPress={() => router.push('/intelligence/exposures' as never)}
            />
          </View>
          <View style={styles.cell}>
            <KpiCard
              icon={Crosshair}
              color={Theme.colors.warning}
              title="Attack Paths"
              value={exposuresQ.data?.length ?? '—'}
              onPress={() => router.push('/intelligence/attack-paths' as never)}
            />
          </View>
          <View style={styles.cell}>
            <KpiCard
              icon={FileCheck}
              color={Theme.colors.info}
              title="Certificates"
              value={certsQ.data?.length ?? '—'}
              onPress={() => router.push('/intelligence/certificates' as never)}
            />
          </View>
          <View style={styles.cell}>
            <KpiCard
              icon={KeyRound}
              color={Theme.colors.accent}
              title="Identity"
              value={identQ.data?.length ?? '—'}
              onPress={() => router.push('/intelligence/identity' as never)}
            />
          </View>
          <View style={styles.cell}>
            <KpiCard
              icon={Network}
              color={Theme.colors.success}
              title="Chain Graph"
              value="—" // scan-scoped; no global graph count available without a scan_id
              onPress={() => router.push('/intelligence/graph' as never)}
            />
          </View>
          <View style={styles.cell}>
            <KpiCard
              icon={Code}
              color={Theme.colors.secondary}
              title="API Intel"
              value={apiIntelQ.data?.length ?? '—'}
              onPress={() => router.push('/intelligence/api-intel' as never)}
            />
          </View>
        </View>

        <Text style={styles.section}>RECENT ACTIVITY</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>No recent intelligence.</Text>
        ) : recent.map((it, i) => (
          <TouchableOpacity key={`${it.kind}-${it.id}-${i}`} style={styles.activityRow}>
            <Text style={styles.activityKind}>{it.kind}</Text>
            <Text style={styles.activityTitle} numberOfLines={1}>{it.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexBasis: '50%', paddingHorizontal: Theme.spacing.xs },
  section: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700', marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.sm },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, paddingVertical: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  activityKind: { color: Theme.colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1, width: 70 },
  activityTitle: { color: Theme.colors.text, flex: 1 },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.lg },
});
