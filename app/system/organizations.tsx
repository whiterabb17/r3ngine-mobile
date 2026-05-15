import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Users, Target, ChevronRight, Plus, Search, Building2, LayoutGrid } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { TacticalHaptics } from '../../src/utils/haptics';

interface Organization {
  id: number;
  name: string;
  description: string;
  insert_date: string;
  project: number;
  domains_count?: number; // Calculated or from related data
}

export default function OrganizationsScreen() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/mapi/listOrganizations/');
      setOrganizations(response.data.organizations || []);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setError('Tactical link to organizations severed.');
      TacticalHaptics.error();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    TacticalHaptics.soft();
    fetchOrganizations();
  };

  const renderOrgItem = ({ item }: { item: Organization }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/system/organizations/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Building2 size={24} color={Theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.orgName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.orgDate}>Established: {new Date(item.insert_date).toLocaleDateString()}</Text>
        </View>
        <ChevronRight size={20} color={Theme.colors.textMuted} />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {item.description || 'No operational description provided.'}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.stat}>
          <Target size={14} color={Theme.colors.textMuted} />
          <Text style={styles.statText}>Grouped Targets</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TACTICAL UNIT</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>SYNCHRONIZING ORGANIZATIONAL LOGISTICS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'ORGANIZATIONS',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Bangers' }
        }} 
      />

      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search Tactical Units...</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => TacticalHaptics.success()}
        >
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={organizations}
        renderItem={renderOrgItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LayoutGrid size={48} color={Theme.colors.border} />
            <Text style={styles.emptyText}>No active organizations detected in the operational theater.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: Theme.spacing.sm,
  },
  searchPlaceholder: {
    color: Theme.colors.textMuted,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: Theme.colors.primary,
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary + '11',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary + '22',
  },
  headerText: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  orgName: {
    color: Theme.colors.text,
    fontSize: 18,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  orgDate: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
    paddingTop: Theme.spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: Theme.colors.border + '33',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    maxWidth: '80%',
    lineHeight: 20,
  },
});
