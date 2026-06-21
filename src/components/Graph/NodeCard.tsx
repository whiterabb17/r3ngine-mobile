import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ChainGraphNode } from '../../api/graphIntel';

interface Props {
  node: ChainGraphNode;
}

const NAME_KEYS = ['name', 'host', 'subdomain_name', 'base_url'] as const;

function resolveDisplayName(node: ChainGraphNode): string {
  for (const key of NAME_KEYS) {
    const val = node.properties[key];
    if (typeof val === 'string' && val) return val;
  }
  return node.id;
}

export default function NodeCard({ node }: Props) {
  const palette = Theme.colors.nodeType as Record<string, string>;
  const typeColor = palette[node.type] ?? Theme.colors.textMuted;
  const name = resolveDisplayName(node);

  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: typeColor }]} />
      <View style={styles.content}>
        <Text style={[styles.typeLabel, { color: typeColor }]}>
          {node.type.toUpperCase()}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
    gap: Theme.spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  content: { flex: 1 },
  typeLabel: { fontSize: 9, letterSpacing: 1.5, fontWeight: '700' },
  name: { color: Theme.colors.text, fontSize: 13, fontFamily: 'SpaceMono' },
});
