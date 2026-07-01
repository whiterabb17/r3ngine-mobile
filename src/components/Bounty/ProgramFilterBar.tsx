import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';

type SortOption = 'age' | 'name' | 'reports';

interface Props {
  active: SortOption;
  onChange: (s: SortOption) => void;
}

const OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'age', label: 'Newest' },
  { key: 'reports', label: 'Most Reports' },
  { key: 'name', label: 'A–Z' },
];

export default function ProgramFilterBar({ active, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {OPTIONS.map((o) => (
        <TouchableOpacity
          key={o.key}
          style={[styles.chip, active === o.key && styles.chipActive]}
          onPress={() => onChange(o.key)}
        >
          <Text style={[styles.label, active === o.key && styles.labelActive]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm },
  chip: { borderRadius: Theme.borderRadius.full, paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, marginRight: Theme.spacing.xs, borderWidth: 1, borderColor: Theme.colors.border, backgroundColor: Theme.colors.surface },
  chipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  label: { color: Theme.colors.textMuted, fontSize: 13 },
  labelActive: { color: '#fff', fontWeight: '600' },
});
