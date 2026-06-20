import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import PriorityBadge from './PriorityBadge';
import type { RiskSummary } from '../../api/apme';

interface Props { summary: RiskSummary }

export default function RiskSummaryBar({ summary }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.score}>{summary.score}</Text>
        <PriorityBadge priority={summary.priority} />
      </View>
      <View style={styles.row}>
        <Stat label="Paths" value={summary.path_count} />
        <Stat label="Speculative" value={summary.speculative_count} />
      </View>
      {summary.top_risk_factors.length > 0 && (
        <Text style={styles.factors} numberOfLines={2}>
          {summary.top_risk_factors.join(' · ')}
        </Text>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  score: { color: Theme.colors.primary, fontSize: 32, fontWeight: '800', letterSpacing: 1 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: Theme.colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1 },
  factors: { color: Theme.colors.textMuted, fontSize: 12, marginTop: Theme.spacing.xs },
});
