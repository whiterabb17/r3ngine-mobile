import React, { useState, type ReactNode } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import type { AttackPathExtended } from '../../api/apme';

interface Props {
  paths: AttackPathExtended[];
  renderPath: (path: AttackPathExtended) => ReactNode;
}

export default function SpeculativePathsSection({ paths, renderPath }: Props) {
  const [open, setOpen] = useState(false);
  if (paths.length === 0) return null;
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setOpen(v => !v)}>
        {open ? <ChevronDown size={16} color={Theme.colors.textMuted} /> : <ChevronRight size={16} color={Theme.colors.textMuted} />}
        <Text style={styles.headerText}>SPECULATIVE PATHS · {paths.length}</Text>
      </TouchableOpacity>
      {open && <View style={styles.body}>{paths.map(renderPath)}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Theme.spacing.lg, borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: Theme.spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  headerText: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  body: { marginTop: Theme.spacing.md },
});
