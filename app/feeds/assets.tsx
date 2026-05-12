import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Globe, Search, Filter, ChevronRight, ExternalLink, Shield } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';

interface Subdomain {
  id: number;
  name: string;
  http_url: string;
  http_status: number;
  webserver: string;
  page_title: string;
  target_domain: {
    id: number;
    name: string;
  };
}

export default function GlobalAssetFeed() {
  const { currentProject } = useProjectStore();
  const router = useRouter();
  const [assets, setAssets] = useState<Subdomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<number | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!currentProject) return;
    try {
      const response = await apiClient.get(`listSubdomains/?project=${currentProject}`);
      const data = response.data.results || response.data;
      setAssets(data);
    } catch (error) {
      console.error('Failed to fetch global assets', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (asset.page_title && asset.page_title.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filter ? asset.http_status === filter : true;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return Theme.colors.success;
    if (status >= 300 && status < 400) return Theme.colors.info;
    if (status >= 400 && status < 500) return Theme.colors.warning;
    if (status >= 500) return Theme.colors.error;
    return Theme.colors.textMuted;
  };

  const renderAssetItem = ({ item }: { item: Subdomain }) => (
    <TouchableOpacity 
      style={styles.assetCard}
      onPress={() => router.push(`/target/${item.target_domain.id}` as any)}
    >
      <View style={styles.assetHeader}>
        <View style={styles.assetTitleRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.http_status) }]} />
          <Text style={styles.assetName} numberOfLines={1}>{item.name}</Text>
        </View>
        <ChevronRight size={16} color={Theme.colors.textMuted} />
      </View>

      <View style={styles.assetMeta}>
        <View style={styles.metaItem}>
          <Shield size={12} color={Theme.colors.primary} />
          <Text style={styles.metaText}>{item.target_domain.name}</Text>
        </View>
        {item.webserver && (
          <View style={styles.metaItem}>
            <Text style={[styles.metaText, { color: Theme.colors.textMuted }]}>{item.webserver}</Text>
          </View>
        )}
      </View>

      {item.page_title ? (
        <Text style={styles.pageTitle} numberOfLines={1}>{item.page_title}</Text>
      ) : null}

      <View style={styles.assetFooter}>
        <Text style={styles.httpStatus}>{item.http_status || 'N/A'}</Text>
        {item.http_url ? (
          <TouchableOpacity style={styles.linkBtn}>
            <ExternalLink size={12} color={Theme.colors.primary} />
            <Text style={styles.linkText}>Visit</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Global Assets' }} />
      
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search assets or tech..."
            placeholderTextColor={Theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, !filter && styles.filterChipActive]}
            onPress={() => setFilter(null)}
          >
            <Text style={[styles.filterLabel, !filter && styles.filterLabelActive]}>All Assets</Text>
          </TouchableOpacity>
          {[200, 301, 302, 403, 404, 500].map(status => (
            <TouchableOpacity 
              key={status}
              style={[styles.filterChip, filter === status && styles.filterChipActive]}
              onPress={() => setFilter(status)}
            >
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(status), marginRight: 6 }]} />
              <Text style={[styles.filterLabel, filter === status && styles.filterLabelActive]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Syncing Project Assets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAssets}
          renderItem={renderAssetItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAssets(); }} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Globe size={48} color={Theme.colors.surface} />
              <Text style={styles.emptyText}>No assets found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters.</Text>
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
  clearText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '600',
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  assetCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  assetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  assetName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  metaText: {
    fontSize: 11,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  httpStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.textMuted,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '700',
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
    fontFamily: 'Orbitron',
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
