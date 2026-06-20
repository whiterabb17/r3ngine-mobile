import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ExposureStatus } from '../../api/exposures';

const COLOR: Record<ExposureStatus, string> = {
  open: Theme.colors.danger,
  accepted: Theme.colors.info,
  false_positive: Theme.colors.textMuted,
  resolved: Theme.colors.success,
};

const LABEL: Record<ExposureStatus, string> = {
  open: 'OPEN',
  accepted: 'ACCEPTED',
  false_positive: 'FALSE POSITIVE',
  resolved: 'RESOLVED',
};

export default function ExposureStatusChip({ status }: { status: ExposureStatus }) {
  const valid = status in COLOR;
  const color = valid ? COLOR[status] : Theme.colors.textMuted;
  const label = valid ? LABEL[status] : '?';
  return (
    <View style={[styles.chip, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderWidth: 1, borderRadius: Theme.borderRadius.sm },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
