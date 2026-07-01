import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ChainGraphNode, ChainGraphEdge } from '../../api/graphIntel';

interface Props {
  nodes: ChainGraphNode[];
  edges: ChainGraphEdge[];
}

export default function ChainGraphStats({ nodes, edges }: Props) {
  const edgeTypes = new Set(edges.map(e => e.type)).size;
  const nodeTypes = new Set(nodes.map(n => n.type)).size;

  const stats = [
    { label: 'TOTAL NODES', value: nodes.length, color: Theme.colors.primary },
    { label: 'EDGE TYPES', value: edgeTypes, color: Theme.colors.info },
    { label: 'NODE TYPES', value: nodeTypes, color: Theme.colors.success },
  ];

  return (
    <View style={styles.row}>
      {stats.map(s => (
        <View key={s.label} style={styles.cell}>
          <Text style={[styles.value, { color: s.color }]}>{s.value}</Text>
          <Text style={styles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  cell: { flex: 1, alignItems: 'center', paddingVertical: Theme.spacing.md },
  value: { fontSize: 20, fontWeight: '900', fontFamily: 'Bangers' },
  label: {
    color: Theme.colors.textMuted,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: 2,
  },
});
