import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';

export default function SanList({ sans }: { sans: string[] }) {
  const [open, setOpen] = useState(false);
  if (sans.length === 0) return null;
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.head} onPress={() => setOpen(v => !v)}>
        {open ? <ChevronDown size={14} color={Theme.colors.textMuted} /> : <ChevronRight size={14} color={Theme.colors.textMuted} />}
        <Text style={styles.label}>SUBJECT ALTERNATIVE NAMES · {sans.length}</Text>
      </TouchableOpacity>
      {open && sans.map((san, i) => (
        <Text key={`${san}-${i}`} style={styles.san} selectable>{san}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  label: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  san: { color: Theme.colors.text, fontFamily: 'SpaceMono', paddingVertical: 2, paddingLeft: Theme.spacing.lg },
});
