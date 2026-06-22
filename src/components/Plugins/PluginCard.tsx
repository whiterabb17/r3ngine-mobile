import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Package, ShieldCheck, ShieldAlert } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { Plugin } from '../../api/plugins';

interface Props {
  plugin: Plugin;
  onToggleEnabled: (slug: string, current: boolean) => void;
}

const TRUST_COLOR: Record<string, string> = {
  signed: Theme.colors.success,
  community: Theme.colors.warning,
  unsigned: Theme.colors.error,
};

export default function PluginCard({ plugin, onToggleEnabled }: Props) {
  const trustColor = TRUST_COLOR[plugin.trust_level] ?? Theme.colors.textMuted;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Package size={24} color={Theme.colors.primary} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{plugin.name}</Text>
          <Text style={styles.version}>v{plugin.version}</Text>
        </View>
        {!!plugin.description && (
          <Text style={styles.desc} numberOfLines={2}>{plugin.description}</Text>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.anchor}>{plugin.anchor_step} · {plugin.runtime_position}</Text>
          {plugin.trust_level === 'signed'
            ? <ShieldCheck size={12} color={trustColor} />
            : <ShieldAlert size={12} color={trustColor} />
          }
          <Text style={[styles.trust, { color: trustColor }]}>{plugin.trust_level}</Text>
        </View>
      </View>
      <Switch
        value={plugin.is_enabled}
        onValueChange={() => onToggleEnabled(plugin.slug, plugin.is_enabled)}
        trackColor={{ true: Theme.colors.primary, false: Theme.colors.border }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.sm, marginBottom: Theme.spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: Theme.colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: Theme.borderRadius.md, backgroundColor: Theme.colors.primary + '22', alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.sm },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: Theme.colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  version: { color: Theme.colors.textMuted, fontSize: 11 },
  desc: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  anchor: { color: Theme.colors.textMuted, fontSize: 11 },
  trust: { fontSize: 11, fontWeight: '600' },
});
