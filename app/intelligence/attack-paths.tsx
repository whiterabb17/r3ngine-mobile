import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MoreVertical, Zap } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import RiskSummaryBar from '../../src/components/Intelligence/RiskSummaryBar';
import SpeculativePathsSection from '../../src/components/Intelligence/SpeculativePathsSection';
import ScoreTooltip from '../../src/components/Intelligence/ScoreTooltip';
import PriorityBadge from '../../src/components/Intelligence/PriorityBadge';
import AttackPathCard from '../../src/components/Intelligence/AttackPathCard';
import {
  getRiskSummary,
  getAttackTree,
  regenerateImpactAssessment,
  markPathDismissed,
  APME_KEYS,
  type AttackPathExtended,
} from '../../src/api/apme';

interface Props {
  scanId?: number;
  targetId?: string;
}

export default function AttackPathsScreen({ scanId: scanIdProp, targetId: targetIdProp }: Props = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ scanId?: string; targetId?: string }>();
  const scanId = scanIdProp ?? Number(params.scanId ?? '0');
  const targetId = targetIdProp ?? (params.targetId ?? '0');

  const qc = useQueryClient();
  const [tooltipFor, setTooltipFor] = useState<AttackPathExtended | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const summaryQ = useQuery({
    queryKey: APME_KEYS.riskSummary(scanId),
    queryFn: () => getRiskSummary(scanId),
    staleTime: 30_000,
    enabled: scanId > 0,
  });

  const treeQ = useQuery({
    queryKey: APME_KEYS.tree(String(targetId)),
    queryFn: () => getAttackTree(String(targetId)),
    staleTime: 30_000,
    enabled: targetId !== '0',
  });

  const dismissM = useMutation({
    mutationFn: (id: string) => markPathDismissed(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: APME_KEYS.tree(String(targetId)) });
      const prev = qc.getQueryData<{ paths: AttackPathExtended[] }>(APME_KEYS.tree(String(targetId)));
      qc.setQueryData(APME_KEYS.tree(String(targetId)), (old: any) => ({
        paths: (old?.paths ?? []).filter((p: AttackPathExtended) => p.path_id !== id),
      }));
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(APME_KEYS.tree(String(targetId)), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: APME_KEYS.tree(String(targetId)) }),
  });

  const regenM = useMutation({
    mutationFn: (id: string) => regenerateImpactAssessment(id),
    onSuccess: () => Alert.alert('Queued', 'Impact regeneration started — refresh in ~30s'),
  });

  const paths = treeQ.data?.paths ?? [];
  const primary = paths.filter(p => !p.is_speculative);
  const speculative = paths.filter(p => p.is_speculative);

  const renderCard = (p: AttackPathExtended) => (
    <View key={p.path_id} style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.id}>{p.path_id}</Text>
        <PriorityBadge priority={p.priority} />
        <TouchableOpacity
          accessibilityLabel={`overflow-${p.path_id}`}
          onPress={() => setMenuFor(menuFor === p.path_id ? null : p.path_id)}
        >
          <MoreVertical size={16} color={Theme.colors.textMuted} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onLongPress={() => setTooltipFor(p)}>
        <Text style={styles.score}>{p.score}</Text>
      </TouchableOpacity>
      <Text style={styles.impact} numberOfLines={2}>{p.potential_impact}</Text>
      {menuFor === p.path_id && (
        <View style={styles.menu}>
          <TouchableOpacity
            accessibilityLabel={`regen-${p.path_id}`}
            onPress={() => { setMenuFor(null); regenM.mutate(p.path_id); }}
          >
            <Text style={styles.menuItem}>Regenerate Impact</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel={`dismiss-${p.path_id}`}
            onPress={() => { setMenuFor(null); dismissM.mutate(p.path_id); }}
          >
            <Text style={[styles.menuItem, { color: Theme.colors.danger }]}>Dismiss Path</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const isLoading = treeQ.isLoading || summaryQ.isLoading;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Attack Path Explorer' }} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Simulating Exploit Chains...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: Theme.spacing.md }}
          refreshControl={
            <RefreshControl
              refreshing={treeQ.isRefetching || summaryQ.isRefetching}
              onRefresh={() => { treeQ.refetch(); summaryQ.refetch(); }}
              tintColor={Theme.colors.primary}
            />
          }
        >
          {summaryQ.data && <RiskSummaryBar summary={summaryQ.data} />}
          {paths.length === 0 ? (
            <View style={styles.emptyState}>
              <Zap size={48} color={Theme.colors.surface} />
              <Text style={styles.emptyText}>No Attack Paths Modeled</Text>
              <Text style={styles.emptySubtext}>
                Run an AI Attack Path Modeling task from a scan detail page to generate tactical exploit chains.
              </Text>
            </View>
          ) : (
            <>
              {primary.map(renderCard)}
              <SpeculativePathsSection paths={speculative} renderPath={renderCard} />
            </>
          )}
        </ScrollView>
      )}
      <ScoreTooltip
        visible={!!tooltipFor}
        breakdown={tooltipFor?.score_breakdown}
        onDismiss={() => setTooltipFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Theme.spacing.sm, color: Theme.colors.textMuted, fontSize: 12, fontFamily: 'Bangers' },
  card: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  id: { color: Theme.colors.textMuted, flex: 1, fontFamily: 'SpaceMono' },
  score: { color: Theme.colors.primary, fontSize: 24, fontWeight: '800', marginTop: Theme.spacing.xs },
  impact: { color: Theme.colors.text, marginTop: Theme.spacing.xs },
  menu: { marginTop: Theme.spacing.sm, borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: Theme.spacing.sm, gap: Theme.spacing.sm },
  menuItem: { color: Theme.colors.text, paddingVertical: Theme.spacing.xs },
  emptyState: { alignItems: 'center', paddingVertical: 100, paddingHorizontal: 40 },
  emptyText: { marginTop: Theme.spacing.md, fontSize: 16, fontWeight: 'bold', color: Theme.colors.text, fontFamily: 'Bangers', textAlign: 'center' },
  emptySubtext: { marginTop: Theme.spacing.sm, fontSize: 12, color: Theme.colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
