import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';

interface Props {
  type: string;
}

export default function EdgeTypeBadge({ type }: Props) {
  const palette = Theme.colors.edgeType as Record<string, string>;
  const color = palette[type] ?? Theme.colors.textMuted;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color + '20', borderColor: color },
      ]}
    >
      <Text style={[styles.label, { color }]}>{type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
