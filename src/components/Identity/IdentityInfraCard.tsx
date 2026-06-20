import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import IdentityProviderBadge from './IdentityProviderBadge';
import type { IdentityInfraDiscovery, MatchStrength } from '../../api/identity';

const STRENGTH_COLOR: Record<MatchStrength, string> = {
  high:   Theme.colors.success,
  medium: Theme.colors.warning,
  low:    Theme.colors.textMuted,
};

export default function IdentityInfraCard({ item, onPress }: { item: IdentityInfraDiscovery; onPress: () => void }) {
  const assetCount =
    item.detection_signals.matched_urls.length +
    item.detection_signals.matched_titles.length +
    Object.keys(item.detection_signals.matched_headers).length;
  const strength = STRENGTH_COLOR[item.match_strength] ?? Theme.colors.textMuted;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, item.dismissed && styles.dismissed]}>
      <View style={styles.head}>
        <IdentityProviderBadge provider={item.provider} />
        <View style={[styles.strength, { borderColor: strength }]}>
          <Text style={[styles.strengthText, { color: strength }]}>{item.match_strength.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {assetCount} signal{assetCount === 1 ? '' : 's'}
        {item.confirmed ? ' · CONFIRMED' : ''}
        {item.dismissed ? ' · DISMISSED' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Theme.colors.surface, borderColor: Theme.colors.border, borderWidth: 1, borderRadius: Theme.borderRadius.md, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm },
  dismissed: { opacity: 0.4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  strength: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderRadius: Theme.borderRadius.sm, borderWidth: 1 },
  strengthText: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  meta: { color: Theme.colors.textMuted, marginTop: Theme.spacing.xs, fontSize: 11 },
});
