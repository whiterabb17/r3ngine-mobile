import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';

interface Props {
  ids: number[];
  onPressVuln: (id: number) => void;
}

export default function ExposureLinkedVulns({ ids, onPressVuln }: Props) {
  if (ids.length === 0) return null;
  return (
    <View>
      <Text style={styles.label}>LINKED VULNERABILITIES</Text>
      <View style={styles.pillRow}>
        {ids.map(id => (
          <TouchableOpacity key={id} style={styles.pill} onPress={() => onPressVuln(id)}>
            <Text style={styles.pillText}>#{id}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700', marginBottom: Theme.spacing.sm },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs },
  pill: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, borderRadius: Theme.borderRadius.full, borderWidth: 1, borderColor: Theme.colors.primary },
  pillText: { color: Theme.colors.primary, fontWeight: '700' },
});
