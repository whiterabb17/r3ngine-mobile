import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import ExposureStatusChip from './ExposureStatusChip';
import type { Exposure } from '../../api/exposures';

interface Props {
  exposure: Exposure;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function assetLabel(a: Exposure['asset_summary']): string {
  if (a.hostname && a.port) return `${a.hostname}:${a.port}`;
  if (a.hostname) return a.hostname;
  if (a.ip && a.port) return `${a.ip}:${a.port}`;
  if (a.ip) return a.ip;
  return a.service ?? 'unknown asset';
}

const SEV_COLOR: Record<Exposure['severity'], string> = {
  critical: Theme.colors.vulnerabilities.critical,
  high: Theme.colors.vulnerabilities.high,
  medium: Theme.colors.vulnerabilities.medium,
  low: Theme.colors.vulnerabilities.low,
  info: Theme.colors.vulnerabilities.info,
};

export default function ExposureCard({ exposure, selected, onPress, onLongPress }: Props) {
  const sev = SEV_COLOR[exposure.severity] ?? Theme.colors.textMuted;
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={[styles.card, selected && styles.selected]}>
      <View style={styles.header}>
        <View style={[styles.sevDot, { backgroundColor: sev }]} />
        <Text style={styles.title} numberOfLines={1}>{exposure.title}</Text>
        <ExposureStatusChip status={exposure.status} />
      </View>
      <Text style={styles.asset}>{assetLabel(exposure.asset_summary)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border },
  selected: { borderColor: Theme.colors.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  title: { color: Theme.colors.text, flex: 1, fontWeight: '700' },
  asset: { color: Theme.colors.textMuted, fontFamily: 'SpaceMono', marginTop: Theme.spacing.xs },
});
