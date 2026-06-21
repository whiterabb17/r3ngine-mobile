import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Unlock } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import APITypeChip from './APITypeChip';
import type { APIIntelProfile } from '../../api/apiIntel';

interface Props {
  profile: APIIntelProfile;
  onPress?: () => void;
  testID?: string;
}

export default function APIProfileCard({ profile, onPress, testID }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
    >
      <View style={styles.topRow}>
        <APITypeChip type={profile.api_type} />
        <View style={styles.authRow}>
          {profile.requires_auth ? (
            <>
              <Lock size={12} color={Theme.colors.warning} />
              <Text style={styles.authText}>
                {profile.auth_scheme || 'Auth Required'}
              </Text>
            </>
          ) : (
            <>
              <Unlock size={12} color={Theme.colors.textMuted} />
              <Text style={styles.noAuthText}>No Auth</Text>
            </>
          )}
        </View>
      </View>
      <Text style={styles.url} numberOfLines={2}>
        {profile.base_url}
      </Text>
      <Text style={styles.count}>{profile.endpoint_count} endpoints</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.surface,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.xs },
  authText: { fontSize: 11, fontWeight: '600', color: Theme.colors.warning },
  noAuthText: { fontSize: 11, color: Theme.colors.textMuted },
  url: { color: Theme.colors.text, fontFamily: 'SpaceMono', fontSize: 12 },
  count: { color: Theme.colors.textMuted, fontSize: 11 },
});
