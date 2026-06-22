import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '../../constants/Theme';
import PipelineTierBadge, { TIER_COLORS } from './PipelineTierBadge';

export const TASK_TIER_MAP: Record<string, number> = {
  subdomain_discovery: 1,
  amass_intel_discovery: 1,
  firewall_vpn_scan: 1,
  osint: 1,
  spiderfoot_scan: 1,
  baddns: 1,
  http_crawl: 2,
  port_scan: 2,
  screenshot: 2,
  fetch_url: 2,
  dir_file_fuzz: 3,
  endpoint_gathering: 4,
  web_api_discovery: 5,
  waf_detection: 5,
  secret_scan: 5,
  param_discovery: 5,
  vulnerability_scan: 6,
  correlation: 7,
};

export const TIER_LABELS: Record<number, string> = {
  1: 'Discovery',
  2: 'Crawl & Ports',
  3: 'Fuzzing',
  4: 'Endpoints',
  5: 'API & Secrets',
  6: 'Vuln Scan',
  7: 'Correlation',
};

interface TierRow {
  tier: number;
  tasks: string[];
}

interface PipelineBuilderViewProps {
  tasks: string[];
}

export default function PipelineBuilderView({ tasks }: PipelineBuilderViewProps) {
  const activeSet = new Set(tasks);

  const tierRows: TierRow[] = [];
  for (let t = 1; t <= 7; t++) {
    const tierTasks = tasks.filter((task) => TASK_TIER_MAP[task] === t);
    if (tierTasks.length > 0) {
      tierRows.push({ tier: t, tasks: tierTasks });
    }
  }

  if (tierRows.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No pipeline tasks configured</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {tierRows.map((row, idx) => {
        const color = TIER_COLORS[row.tier] ?? Theme.colors.textMuted;
        const isLast = idx === tierRows.length - 1;
        return (
          <View key={row.tier} style={styles.tierRow}>
            {/* Connector line */}
            {!isLast && <View style={[styles.connector, { backgroundColor: color + '40' }]} />}

            <View style={styles.tierHeader}>
              <PipelineTierBadge tier={row.tier} active />
              <Text style={[styles.tierLabel, { color }]}>{TIER_LABELS[row.tier]}</Text>
            </View>

            <View style={styles.taskChips}>
              {row.tasks.map((task) => (
                <View key={task} style={[styles.chip, { borderColor: color + '66', backgroundColor: color + '12' }]}>
                  <Text style={[styles.chipText, { color }]}>{task.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
  },
  tierRow: {
    marginBottom: Theme.spacing.md,
    paddingLeft: Theme.spacing.sm,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 20,
    top: 28,
    bottom: -Theme.spacing.md,
    width: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  tierLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  taskChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
    paddingLeft: 40,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
