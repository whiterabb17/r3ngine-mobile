import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';

interface Props {
  history: string[];
  onSelect: (query: string) => void;
}

export default function SearchHistoryChips({ history, onSelect }: Props) {
  if (history.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
      {history.map((q) => (
        <TouchableOpacity key={q} style={styles.chip} onPress={() => onSelect(q)}>
          <Text style={styles.chipText}>{q}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  chip: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    marginRight: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  chipText: { color: Theme.colors.textMuted, fontSize: 12 },
});
