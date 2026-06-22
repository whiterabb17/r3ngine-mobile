import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';

export const TIER_COLORS: Record<number, string> = {
  0: Theme.colors.textMuted,
  1: Theme.colors.info,
  2: Theme.colors.accent,
  3: Theme.colors.secondary,
  4: Theme.colors.secondary,
  5: Theme.colors.warning,
  6: Theme.colors.error,
  7: Theme.colors.success,
};

interface PipelineTierBadgeProps {
  tier: number;
  active?: boolean;
  size?: 'sm' | 'md';
}

export default function PipelineTierBadge({ tier, active = true, size = 'md' }: PipelineTierBadgeProps) {
  const color = active ? (TIER_COLORS[tier] ?? Theme.colors.textMuted) : Theme.colors.border;
  const isSmall = size === 'sm';
  return (
    <View style={[
      styles.badge,
      { borderColor: color, backgroundColor: color + '18' },
      isSmall && styles.badgeSm,
    ]}>
      <Text style={[styles.label, { color }, isSmall && styles.labelSm]}>
        T{tier}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  badgeSm: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontFamily: 'Bangers',
  },
  labelSm: {
    fontSize: 8,
  },
});
