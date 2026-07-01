import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Theme } from '../../constants/Theme';
import type { IdentityProvider } from '../../api/identity';

const COLOR: Record<IdentityProvider, string> = {
  okta:      Theme.colors.accent,
  azure_ad:  Theme.colors.info,
  auth0:     Theme.colors.warning,
  ping:      Theme.colors.success,
  onelogin:  Theme.colors.primary,
  jumpcloud: Theme.colors.secondary,
  other:     Theme.colors.textMuted,
};

const LABEL: Record<IdentityProvider, string> = {
  okta:      'OKTA',
  azure_ad:  'AZURE AD',
  auth0:     'AUTH0',
  ping:      'PING',
  onelogin:  'ONELOGIN',
  jumpcloud: 'JUMPCLOUD',
  other:     'OTHER',
};

export default function IdentityProviderBadge({ provider }: { provider: IdentityProvider }) {
  const valid = provider in COLOR;
  const color = valid ? COLOR[provider] : Theme.colors.textMuted;
  const label = valid ? LABEL[provider] : '?';
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 2, borderWidth: 1, borderRadius: Theme.borderRadius.sm },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
});
