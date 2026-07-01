import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { APIType } from '../../api/apiIntel';

const API_TYPE_COLORS: Record<APIType, string> = {
  rest: Theme.colors.info,
  graphql: Theme.colors.accent,
  soap: Theme.colors.warning,
  generic: Theme.colors.textMuted,
};

const API_TYPE_LABELS: Record<APIType, string> = {
  rest: 'REST',
  graphql: 'GraphQL',
  soap: 'SOAP',
  generic: 'Generic',
};

interface Props {
  type: APIType | string;
  isSelected?: boolean;
  onPress?: () => void;
}

export default function APITypeChip({ type, isSelected = false, onPress }: Props) {
  const safeType: APIType = type in API_TYPE_COLORS ? (type as APIType) : 'generic';
  const color = API_TYPE_COLORS[safeType];
  const label = API_TYPE_LABELS[safeType];

  const chip = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? `${color}30` : `${color}20`,
          borderColor: isSelected ? color : `${color}80`,
        },
      ]}
    >
      <Text style={[styles.label, { color, fontWeight: isSelected ? '700' : '400' }]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress}>{chip}</TouchableOpacity>;
  }
  return chip;
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 10, letterSpacing: 0.5 },
});
