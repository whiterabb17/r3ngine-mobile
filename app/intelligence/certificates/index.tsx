import React, { useMemo, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Theme } from '../../../src/constants/Theme';
import CertCard from '../../../src/components/Certificates/CertCard';
import { listCertificates, CERTS_KEYS, type Certificate } from '../../../src/api/certificates';

type Filter = 'all' | 'expired' | 'self-signed' | 'expiring';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'expired', label: 'EXPIRED' },
  { key: 'self-signed', label: 'SELF-SIGNED' },
  { key: 'expiring', label: 'EXPIRING <30D' },
];

export default function CertificatesScreen({ scanId }: { scanId?: number } = {}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const q = useQuery({
    queryKey: CERTS_KEYS.list(scanId),
    queryFn: () => listCertificates(scanId),
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const data = q.data ?? [];
    const now = Date.now();
    switch (filter) {
      case 'expired':     return data.filter(c => c.is_expired);
      case 'self-signed': return data.filter(c => c.is_self_signed);
      case 'expiring':    return data.filter(c => !c.is_expired && new Date(c.not_after).getTime() - now < 30 * 86400_000);
      default:            return data;
    }
  }, [q.data, filter]);

  if (q.isLoading) {
    return <View style={styles.center}><ActivityIndicator color={Theme.colors.primary} /></View>;
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={{ padding: Theme.spacing.md }}
      data={filtered}
      keyExtractor={(c) => String(c.id)}
      ListHeaderComponent={
        <View style={styles.chips}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, filter === f.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No certificates discovered.</Text>}
      renderItem={({ item }: { item: Certificate }) => (
        <CertCard cert={item} onPress={() => router.push(`/intelligence/certificates/${item.id}` as never)} />
      )}
      refreshControl={
        <RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} tintColor={Theme.colors.primary} />
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.xs, marginBottom: Theme.spacing.md },
  chip: { paddingHorizontal: Theme.spacing.sm, paddingVertical: 4, borderRadius: Theme.borderRadius.full, borderWidth: 1, borderColor: Theme.colors.border },
  chipActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { color: Theme.colors.textMuted, fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  chipTextActive: { color: Theme.colors.background },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
});
