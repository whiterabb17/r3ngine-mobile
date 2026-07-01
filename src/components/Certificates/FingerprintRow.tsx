import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Theme } from '../../constants/Theme';
import { Copy } from 'lucide-react-native';

export default function FingerprintRow({ label, value }: { label: string; value: string }) {
  const onCopy = () => { void Clipboard.setStringAsync(value); };
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.body}>
        <Text style={styles.value} selectable numberOfLines={1} ellipsizeMode="middle">{value}</Text>
        <TouchableOpacity onPress={onCopy} accessibilityLabel={`copy-${label}`}>
          <Copy size={14} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  label: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  body: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginTop: 2 },
  value: { color: Theme.colors.text, fontFamily: 'SpaceMono', flex: 1 },
});
