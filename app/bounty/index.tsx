import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import { listBountyPrograms, BountyProgram } from '../../src/api/bounty';
import ProgramCard from '../../src/components/Bounty/ProgramCard';
import ProgramFilterBar from '../../src/components/Bounty/ProgramFilterBar';

type SortOption = 'age' | 'name' | 'reports';

export default function BountyHubPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<BountyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('age');

  const fetchPrograms = useCallback(async (sortBy: SortOption = sort) => {
    setError(null);
    try {
      const data = await listBountyPrograms({ sort_by: sortBy });
      setPrograms(data);
    } catch (e: any) {
      setError('Failed to load bounty programs. Is a HackerOne API key configured?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sort]);

  useEffect(() => { fetchPrograms(sort); }, [sort]);

  const onRefresh = () => { setRefreshing(true); fetchPrograms(sort); };
  const handleSortChange = (s: SortOption) => { setSort(s); setLoading(true); };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Bounty Hub', headerStyle: { backgroundColor: Theme.colors.background }, headerTintColor: '#fff' }} />

      <ProgramFilterBar active={sort} onChange={handleSortChange} />

      {loading && <ActivityIndicator color={Theme.colors.primary} style={styles.spinner} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && programs.length === 0 && !error && (
        <Text style={styles.empty}>No bounty programs found.</Text>
      )}

      <FlatList
        data={programs}
        keyExtractor={(p) => p.handle}
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            onPress={() => router.push(`/bounty/${item.handle}` as any)}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  list: { padding: Theme.spacing.md },
  spinner: { marginTop: Theme.spacing.xl },
  error: { color: Theme.colors.error, textAlign: 'center', margin: Theme.spacing.md },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
});
