import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '../../constants/Theme';
import APITypeChip from './APITypeChip';
import type { APIIntelProfile } from '../../api/apiIntel';

interface Props {
  profile: APIIntelProfile;
}

const MAX_SAMPLE_ENDPOINTS = 20;

export default function APIProfileDetail({ profile }: Props) {
  const endpoints = profile.raw_endpoints.slice(0, MAX_SAMPLE_ENDPOINTS);
  const hasMore = profile.endpoint_count > MAX_SAMPLE_ENDPOINTS;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <APITypeChip type={profile.api_type} />
        <Text style={styles.url}>{profile.base_url}</Text>
      </View>

      <View style={styles.statRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.endpoint_count}</Text>
          <Text style={styles.statLabel}>ENDPOINTS</Text>
        </View>
        <View style={styles.stat}>
          <Text
            style={[
              styles.statValue,
              {
                color: profile.requires_auth
                  ? Theme.colors.warning
                  : Theme.colors.textMuted,
              },
            ]}
          >
            {profile.requires_auth
              ? (profile.auth_scheme || 'AUTH')
              : 'OPEN'}
          </Text>
          <Text style={styles.statLabel}>AUTH</Text>
        </View>
      </View>

      {profile.graphql_schema_snippet ? (
        <>
          <Text style={styles.sectionLabel}>SCHEMA SNIPPET</Text>
          <Text style={styles.code}>{profile.graphql_schema_snippet}</Text>
        </>
      ) : null}

      {endpoints.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>
            {`SAMPLE ENDPOINTS${hasMore ? ` (${MAX_SAMPLE_ENDPOINTS} of ${profile.endpoint_count})` : ''}`}
          </Text>
          {endpoints.map((ep, i) => (
            <View key={i} style={styles.endpoint}>
              <Text style={styles.epStatus}>{ep.status}</Text>
              <Text style={styles.epUrl} numberOfLines={1}>
                {ep.url}
              </Text>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: Theme.spacing.md, gap: Theme.spacing.md },
  header: { gap: Theme.spacing.xs },
  url: { color: Theme.colors.text, fontFamily: 'SpaceMono', fontSize: 13 },
  statRow: { flexDirection: 'row', gap: Theme.spacing.md },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.text,
    fontFamily: 'Bangers',
  },
  statLabel: {
    fontSize: 9,
    color: Theme.colors.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  sectionLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  code: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: Theme.colors.text,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  endpoint: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  epStatus: {
    color: Theme.colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: 11,
    width: 36,
  },
  epUrl: { color: Theme.colors.text, fontFamily: 'SpaceMono', fontSize: 11, flex: 1 },
});
