import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ShieldAlert, Search, Filter, ChevronRight, AlertTriangle, Bug } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';

interface Vulnerability {
  id: number;
  name: string;
  severity: number;
  discovered_date: string;
  scan_history: {
    domain: {
      name: string;
    };
  };
}

export default function GlobalVulnerabilityFeed() {
  const { currentProject } = useProjectStore();
  const router = useRouter();
  const [vulns, setVulns] = useState<Vulnerability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<number | null>(null);

  const fetchVulns = useCallback(async () => {
    if (!currentProject) return;
    try {
      const response = await apiClient.get(`/mapi/listVulnerability/?project=${currentProject}`);
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setVulns(data);
    } catch (error) {
      console.error('Failed to fetch global vulnerabilities', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchVulns();
  }, [fetchVulns]);

  const filteredVulns = vulns.filter(vuln => {
    const matchesSearch = vuln.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter !== null ? vuln.severity === severityFilter : true;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityLabel = (severity: number) => {
    switch (severity) {
      case 4: return 'Critical';
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      case 0: return 'Info';
      default: return 'Unknown';
    }
  };

  const getSeverityColor = (severity: number) => {
    switch (severity) {
      case 4: return Theme.colors.vulnerabilities.critical;
      case 3: return Theme.colors.vulnerabilities.high;
      case 2: return Theme.colors.vulnerabilities.medium;
      case 1: return Theme.colors.vulnerabilities.low;
      case 0: return Theme.colors.vulnerabilities.info;
      default: return Theme.colors.textMuted;
    }
  };

  const renderVulnItem = ({ item }: { item: Vulnerability }) => (
    <TouchableOpacity 
      style={styles.vulnCard}
      onPress={() => {}} // TODO: Navigate to vulnerability detail if available
    >
      <View style={styles.vulnHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) + '22', borderColor: getSeverityColor(item.severity) }]}>
          <Text style={[styles.severityText, { color: getSeverityColor(item.severity) }]}>
            {getSeverityLabel(item.severity)}
          </Text>
        </View>
        <Text style={styles.timestamp}>{new Date(item.discovered_date).toLocaleDateString()}</Text>
      </View>

      <Text style={styles.vulnName} numberOfLines={2}>{item.name}</Text>

      <View style={styles.vulnFooter}>
        <View style={styles.targetRow}>
          <Bug size={12} color={Theme.colors.textMuted} />
          <Text style={styles.targetName}>{item.scan_history?.domain?.name || 'Unknown Target'}</Text>
        </View>
        <ChevronRight size={16} color={Theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Tactical Vuln Feed' }} />
      
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vulnerabilities..."
            placeholderTextColor={Theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, severityFilter === null && styles.filterChipActive]}
            onPress={() => setSeverityFilter(null)}
          >
            <Text style={[styles.filterLabel, severityFilter === null && styles.filterLabelActive]}>All Feed</Text>
          </TouchableOpacity>
          {[4, 3, 2, 1, 0].map(sev => (
            <TouchableOpacity 
              key={sev}
              style={[styles.filterChip, severityFilter === sev && styles.filterChipActive]}
              onPress={() => setSeverityFilter(sev)}
            >
              <View style={[styles.statusDot, { backgroundColor: getSeverityColor(sev), marginRight: 6 }]} />
              <Text style={[styles.filterLabel, severityFilter === sev && styles.filterLabelActive]}>{getSeverityLabel(sev)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Analyzing Threats...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVulns}
          renderItem={renderVulnItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVulns(); }} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ShieldAlert size={48} color={Theme.colors.surface} />
              <Text style={styles.emptyText}>No threats detected</Text>
              <Text style={styles.emptySubtext}>Your project seems clean based on current filters.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  searchBarContainer: {
    padding: 16,
    backgroundColor: Theme.colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: Theme.colors.text,
    fontSize: 14,
  },
  filterRow: {
    backgroundColor: Theme.colors.surface,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterChipActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '11',
  },
  filterLabel: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: '600',
  },
  filterLabelActive: {
    color: Theme.colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  vulnCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  vulnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  vulnName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  vulnFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '44',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  targetName: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.textMuted,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Bangers',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
  }
});
