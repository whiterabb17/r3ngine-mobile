import React, { useMemo, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import ExposureCard from '../../../src/components/Exposures/ExposureCard';
import ExposureStatsBar from '../../../src/components/Exposures/ExposureStatsBar';
import ExposureFilters from '../../../src/components/Exposures/ExposureFilters';
import {
  listExposures,
  getExposureStats,
  bulkUpdateExposureStatus,
  EXPOSURES_KEYS,
  type Exposure,
  type ExposureStatus,
} from '../../../src/api/exposures';

export default function ExposuresScreen({ scanId }: { scanId?: number } = {}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<{ status?: ExposureStatus; q?: string }>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const listQ = useQuery({
    queryKey: EXPOSURES_KEYS.list(scanId, filter.status),
    queryFn: () => listExposures(scanId, filter.status),
    staleTime: 30_000,
  });
  const statsQ = useQuery({
    queryKey: EXPOSURES_KEYS.stats(scanId),
    queryFn: () => getExposureStats(scanId),
    staleTime: 30_000,
  });

  const filtered = useMemo(
    () => (listQ.data ?? []).filter(e => !filter.q || e.title.toLowerCase().includes(filter.q.toLowerCase())),
    [listQ.data, filter.q],
  );

  const bulkM = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: ExposureStatus }) =>
      bulkUpdateExposureStatus(ids, status),
    onMutate: async ({ ids, status }) => {
      await qc.cancelQueries({ queryKey: EXPOSURES_KEYS.list(scanId, filter.status) });
      const prev = qc.getQueryData<Exposure[]>(EXPOSURES_KEYS.list(scanId, filter.status));
      qc.setQueryData<Exposure[]>(
        EXPOSURES_KEYS.list(scanId, filter.status),
        (old?: Exposure[]) => (old ?? []).map(e => ids.includes(e.id) ? { ...e, status } : e),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(EXPOSURES_KEYS.list(scanId, filter.status), ctx.prev);
    },
    onSettled: (res) => {
      if (res?.rejected?.length) {
        qc.setQueryData<Exposure[]>(
          EXPOSURES_KEYS.list(scanId, filter.status),
          (old?: Exposure[]) => (old ?? []).map(e => res.rejected.includes(e.id) ? { ...e, status: 'open' } : e),
        );
      }
      void qc.invalidateQueries({ queryKey: EXPOSURES_KEYS.stats(scanId) });
      setSelected(new Set());
    },
  });

  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const bulkAction = (status: ExposureStatus) =>
    bulkM.mutate({ ids: Array.from(selected), status });

  if (listQ.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={filtered}
        keyExtractor={(e) => String(e.id)}
        ListHeaderComponent={
          <View>
            {statsQ.data && <ExposureStatsBar stats={statsQ.data} />}
            <ExposureFilters value={filter} onChange={setFilter} />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No exposures correlated yet.</Text>}
        contentContainerStyle={{ padding: Theme.spacing.md }}
        renderItem={({ item }) => (
          <ExposureCard
            exposure={item}
            selected={selected.has(item.id)}
            onPress={() =>
              selected.size > 0
                ? toggle(item.id)
                : router.push(`/intelligence/exposures/${item.id}` as never)
            }
            onLongPress={() => toggle(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={listQ.isRefetching}
            onRefresh={() => { void listQ.refetch(); void statsQ.refetch(); }}
            tintColor={Theme.colors.primary}
          />
        }
      />
      {selected.size > 0 && (
        <View style={styles.bar}>
          <Text style={styles.barCount}>{selected.size} selected</Text>
          <TouchableOpacity onPress={() => bulkAction('accepted')}>
            <Text style={styles.action}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => bulkAction('false_positive')}>
            <Text style={styles.action}>Mark FP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => bulkAction('resolved')}>
            <Text style={styles.action}>Mark Resolved</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected(new Set())}>
            <Text style={[styles.action, { color: Theme.colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, padding: Theme.spacing.md, borderTopWidth: 1, borderTopColor: Theme.colors.border, gap: Theme.spacing.md },
  barCount: { color: Theme.colors.textMuted, flex: 1 },
  action: { color: Theme.colors.primary, fontWeight: '700' },
});
