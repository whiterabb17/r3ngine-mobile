import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { Theme } from '../../constants/Theme';

export const NODE_TYPE_ORDER = [
  'Organization',
  'Subdomain',
  'Application',
  'APIEndpoint',
  'IdentityInfra',
  'Certificate',
  'Technology',
  'Vulnerability',
  'IPAddress',
  'APMENode',
  'CVE',
] as const;

interface Props {
  typeCounts: Record<string, number>;
  selected: string | null;
  onSelect: (type: string | null) => void;
}

export default function NodeTypeLegend({ typeCounts, selected, onSelect }: Props) {
  const palette = Theme.colors.nodeType as Record<string, string>;
  const visible = NODE_TYPE_ORDER.filter(t => (typeCounts[t] ?? 0) > 0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {visible.map(nodeType => {
        const color = palette[nodeType] ?? Theme.colors.textMuted;
        const isSelected = selected === nodeType;
        return (
          <TouchableOpacity
            key={nodeType}
            onPress={() => onSelect(isSelected ? null : nodeType)}
            style={[
              styles.chip,
              {
                borderColor: color,
                backgroundColor: isSelected ? color + '30' : color + '12',
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text
              style={[
                styles.label,
                { color, fontWeight: isSelected ? '700' : '400' },
              ]}
            >
              {nodeType}: {typeCounts[nodeType]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Theme.spacing.xs, paddingBottom: Theme.spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10 },
});
