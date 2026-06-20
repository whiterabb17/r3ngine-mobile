import React from 'react';
import { StyleSheet, TextInput, View, Text, TouchableOpacity } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { ExposureStatus } from '../../api/exposures';

interface Value { status?: ExposureStatus; q?: string }
interface Props { value: Value; onChange: (v: Value) => void }

const CHIPS: { key: ExposureStatus | undefined; label: string }[] = [
  { key: undefined, label: 'ALL' },
  { key: 'open', label: 'OPEN' },
  { key: 'accepted', label: 'ACCEPTED' },
  { key: 'false_positive', label: 'FP' },
  { key: 'resolved', label: 'RESOLVED' },
];

export default function ExposureFilters({ value, onChange }: Props) {
  return (
    <View>
      <View style={styles.chips}>
        {CHIPS.map(c => {
          const active = value.status === c.key;
          return (
            <TouchableOpacity
              key={c.label}
              onPress={() => onChange({ ...value, status: c.key })}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput
        placeholder="Search…"
        placeholderTextColor={Theme.colors.textMuted}
        value={value.q ?? ''}
        onChangeText={(q) => onChange({ ...value, q })}
        style={styles.search}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs, marginBottom: Theme.spacing.sm },
  chip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, borderRadius: Theme.borderRadius.full, borderWidth: 1, borderColor: Theme.colors.border },
  chipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  chipTextActive: { color: Theme.colors.background },
  search: { backgroundColor: Theme.colors.surface, color: Theme.colors.text, borderRadius: Theme.borderRadius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderWidth: 1, borderColor: Theme.colors.border, marginBottom: Theme.spacing.md },
});
