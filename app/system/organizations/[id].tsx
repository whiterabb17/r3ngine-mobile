import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Building2, Target, Globe, Shield, ChevronLeft, Zap, Info, ExternalLink } from 'lucide-react-native';
import { Theme } from '../../../src/constants/Theme';
import apiClient from '../../../src/api/client';
import { TacticalHaptics } from '../../../src/utils/haptics';

interface TargetItem {
  id: number;
  name: string;
  ip_address_cidr: string;
  description: string;
  is_monitored: boolean;
}

interface OrgDetail {
  id: number;
  name: string;
  description: string;
}

export default function OrganizationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setError(null);
      const response = await apiClient.get(`/api/queryTargetsInOrganization/?organization_id=${id}`);
      // The API returns {'organization': [data], 'domains': [targets]}
      setOrg(response.data.organization[0]);
      setTargets(response.data.domains || []);
    } catch (err) {
      console.error('Failed to fetch org detail:', err);
      setError('Tactical intelligence retrieval failed.');
      TacticalHaptics.error();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    TacticalHaptics.soft();
    fetchDetail();
  };

  const renderTargetItem = ({ item }: { item: TargetItem }) => (
    <TouchableOpacity 
      style={styles.targetCard}
      onPress={() => router.push(`/target/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.targetIcon}>
        <Globe size={18} color={Theme.colors.primary} />
      </View>
      <View style={styles.targetContent}>
        <Text style={styles.targetName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.targetIp}>{item.ip_address_cidr || 'No CIDR Defined'}</Text>
      </View>
      {item.is_monitored && (
        <View style={styles.monitorBadge}>
          <Zap size={10} color={Theme.colors.warning} fill={Theme.colors.warning} />
        </View>
      )}
      <ChevronLeft size={16} color={Theme.colors.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>ANALYZING ORGANIZATIONAL ASSETS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: org?.name || 'ORG DETAIL',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: '#fff',
          headerTitleStyle: { fontFamily: 'Bangers' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: -10, padding: 10 }}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
          )
        }} 
      />

      <FlatList
        data={targets}
        renderItem={renderTargetItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.orgHeader}>
              <View style={styles.orgIconBg}>
                <Building2 size={32} color={Theme.colors.primary} />
              </View>
              <View style={styles.orgInfo}>
                <Text style={styles.orgTitle}>{org?.name}</Text>
                <Text style={styles.orgSubtitle}>Tactical Asset Group</Text>
              </View>
            </View>

            <View style={styles.descriptionBox}>
              <Info size={16} color={Theme.colors.primary} />
              <Text style={styles.descriptionText}>
                {org?.description || 'Strategic grouping for targeted reconnaissance and monitoring operations.'}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{targets.length}</Text>
                <Text style={styles.statLabel}>DOMAINS</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{targets.filter(t => t.is_monitored).length}</Text>
                <Text style={styles.statLabel}>MONITORED</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>-</Text>
                <Text style={styles.statLabel}>VULNS</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>ASSOCIATED TARGETS</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No targets are currently assigned to this tactical unit.</Text>
            <TouchableOpacity style={styles.assignBtn} onPress={() => TacticalHaptics.impact()}>
              <Zap size={16} color="#000" />
              <Text style={styles.assignBtnText}>ASSIGN TARGETS</Text>
            </TouchableOpacity>
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
    padding: Theme.spacing.md,
    backgroundColor: 'transparent',
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  orgIconBg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary + '44',
  },
  orgInfo: {
    marginLeft: Theme.spacing.lg,
    flex: 1,
  },
  orgTitle: {
    fontSize: 24,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  orgSubtitle: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  descriptionBox: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  descriptionText: {
    flex: 1,
    color: Theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xl,
    gap: Theme.spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statValue: {
    color: Theme.colors.text,
    fontSize: 20,
    fontFamily: 'Bangers',
  },
  statLabel: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Bangers',
    letterSpacing: 1,
    marginBottom: Theme.spacing.md,
  },
  listContent: {
    paddingBottom: Theme.spacing.xl,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  targetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  targetContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  targetName: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  targetIp: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  monitorBadge: {
    marginRight: 12,
    padding: 4,
    backgroundColor: Theme.colors.warning + '22',
    borderRadius: 4,
  },
  emptyContainer: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  assignBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Theme.borderRadius.md,
    gap: 8,
  },
  assignBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
});
