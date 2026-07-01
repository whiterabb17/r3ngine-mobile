import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ExposureStats } from '../../api/exposures';

export default function ExposureStatsBar({ stats }: { stats: ExposureStats }) {
  const cells = useMemo(() => [
    { label: 'TOTAL', value: stats.total, color: Theme.colors.text },
    { label: 'OPEN', value: stats.open, color: Theme.colors.danger },
    { label: 'ACCEPTED', value: stats.accepted, color: Theme.colors.info },
    { label: 'FP', value: stats.false_positive, color: Theme.colors.textMuted },
    { label: 'RESOLVED', value: stats.resolved, color: Theme.colors.success },
  ], [stats]);
  return (
    <View style={styles.row}>
      {cells.map(c => (
        <View key={c.label} style={styles.cell}>
          <Text style={[styles.value, { color: c.color }]}>{c.value}</Text>
          <Text style={styles.label}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  cell: { flex: 1, alignItems: 'center' },
  value: { fontSize: 16, fontWeight: '800' },
  label: { color: Theme.colors.textMuted, fontSize: 9, letterSpacing: 1 },
});
