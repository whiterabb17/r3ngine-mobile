import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import type { IdentityInfraDiscovery } from '../../api/identity';

interface Props { signals: IdentityInfraDiscovery['detection_signals'] }

export default function IdentityEvidence({ signals }: Props) {
  return (
    <View>
      <Band label={`MATCHED URLS · ${signals.matched_urls.length}`}>
        {signals.matched_urls.map((u, i) => (
          <Text key={`${u}-${i}`} style={styles.line} numberOfLines={2} selectable>{u}</Text>
        ))}
      </Band>
      <Band label={`MATCHED TITLES · ${signals.matched_titles.length}`}>
        {signals.matched_titles.map((t, i) => (
          <Text key={`${t}-${i}`} style={styles.line} selectable>{t}</Text>
        ))}
      </Band>
      <Band label={`MATCHED HEADERS · ${Object.keys(signals.matched_headers).length}`}>
        {Object.entries(signals.matched_headers).map(([k, v]) => (
          <View key={k} style={styles.kv}>
            <Text style={styles.k}>{k}</Text>
            <Text style={styles.v} selectable>{v}</Text>
          </View>
        ))}
      </Band>
    </View>
  );
}

function Band({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.band}>
      <TouchableOpacity style={styles.bandHead} onPress={() => setOpen(v => !v)}>
        {open ? <ChevronDown size={14} color={Theme.colors.textMuted} /> : <ChevronRight size={14} color={Theme.colors.textMuted} />}
        <Text style={styles.bandLabel}>{label}</Text>
      </TouchableOpacity>
      {open && <View style={styles.bandBody}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  band: { borderBottomWidth: 1, borderBottomColor: Theme.colors.border, paddingVertical: Theme.spacing.sm },
  bandHead: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  bandLabel: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  bandBody: { paddingTop: Theme.spacing.sm },
  line: { color: Theme.colors.text, fontFamily: 'SpaceMono', paddingVertical: 2 },
  kv: { paddingVertical: 2 },
  k: { color: Theme.colors.textMuted, fontSize: 10, letterSpacing: 1 },
  v: { color: Theme.colors.text, fontFamily: 'SpaceMono' },
});
