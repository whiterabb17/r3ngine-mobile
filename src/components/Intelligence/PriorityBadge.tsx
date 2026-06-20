import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { Priority } from '../../api/apme';

interface Props { priority?: Priority }

const COLOR: Record<Priority, string> = {
  P0: Theme.colors.priority.p0,
  P1: Theme.colors.priority.p1,
  P2: Theme.colors.priority.p2,
  P3: Theme.colors.priority.p3,
};

export default function PriorityBadge({ priority }: Props) {
  const valid = priority !== undefined && (priority in COLOR);
  const color = valid ? COLOR[priority as Priority] : Theme.colors.textMuted;
  const label = valid ? priority : '?';
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderWidth: 1, borderRadius: Theme.borderRadius.sm },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});
