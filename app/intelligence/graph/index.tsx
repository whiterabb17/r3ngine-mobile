// app/intelligence/graph/index.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Network } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import {
  getFullChainGraph,
  GRAPH_KEYS,
  type ChainGraphNode,
} from '../../../src/api/graphIntel';
import ChainGraphStats from '../../../src/components/Graph/ChainGraphStats';
import NodeTypeLegend from '../../../src/components/Graph/NodeTypeLegend';
import NodeCard from '../../../src/components/Graph/NodeCard';

interface Props {
  scanId?: number;
}

export default function ChainGraphScreen({ scanId: scanIdProp }: Props = {}) {
  const params = useLocalSearchParams<{ scanId?: string }>();
  const scanId = scanIdProp ?? Number(params.scanId ?? '0');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const graphQ = useQuery({
    queryKey: GRAPH_KEYS.chain(scanId),
    queryFn: () => getFullChainGraph(scanId),
    staleTime: 30_000,
    enabled: scanId > 0,
  });

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of graphQ.data?.nodes ?? []) {
      counts[n.type] = (counts[n.type] || 0) + 1;
    }
    return counts;
  }, [graphQ.data?.nodes]);

  const displayNodes: ChainGraphNode[] = useMemo(() => {
    const all = graphQ.data?.nodes ?? [];
    return selectedType ? all.filter(n => n.type === selectedType) : all;
  }, [graphQ.data?.nodes, selectedType]);

  const renderItem = ({ item }: { item: ChainGraphNode }) => (
    <NodeCard node={item} />
  );

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Attack Chain Graph' }} />
      {scanId === 0 ? (
        <View style={styles.center}>
          <Network size={48} color={Theme.colors.surface} />
          <Text style={styles.emptyText}>No Scan Selected</Text>
          <Text style={styles.emptySubtext}>
            Open a scan from Scan History, then navigate to the Chain tab to explore the expanded attack chain graph.
          </Text>
        </View>
      ) : graphQ.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Mapping Attack Chains...</Text>
        </View>
      ) : graphQ.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load graph data</Text>
          <Text
            style={styles.retryText}
            onPress={() => graphQ.refetch()}
          >
            Retry
          </Text>
        </View>
      ) : (graphQ.data?.nodes.length ?? 0) === 0 ? (
        <View style={styles.center}>
          <Network size={48} color={Theme.colors.surface} />
          <Text style={styles.emptyText}>No Chain Graph Data</Text>
          <Text style={styles.emptySubtext}>
            Run a scan with APME enabled to generate the attack chain graph.
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayNodes}
          keyExtractor={n => n.id}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={styles.header}>
              <ChainGraphStats
                nodes={graphQ.data!.nodes}
                edges={graphQ.data!.edges}
              />
              <NodeTypeLegend
                typeCounts={typeCounts}
                selected={selectedType}
                onSelect={setSelectedType}
              />
              {selectedType && (
                <Text style={styles.filterNote}>
                  {typeCounts[selectedType] ?? 0} {selectedType} nodes — tap chip again to clear
                </Text>
              )}
            </View>
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={graphQ.isRefetching}
              onRefresh={() => graphQ.refetch()}
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
  header: { marginBottom: Theme.spacing.md },
  filterNote: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginBottom: Theme.spacing.sm,
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
