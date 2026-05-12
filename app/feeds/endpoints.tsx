import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Link, Search, Filter, ChevronRight, ExternalLink, Hash } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';

interface Endpoint {
  id: number;
  http_url: string;
  http_status: number;
  content_type: string;
  matched_gf_patterns: string;
  subdomain: {
    name: string;
  };
}

export default function EndpointExplorer() {
  const { currentProject } = useProjectStore();
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEndpoints = useCallback(async () => {
    if (!currentProject) return;
    try {
      const response = await apiClient.get(`listEndpoints/?project=${currentProject}`);
      const data = response.data.results || response.data;
      setEndpoints(data);
    } catch (error) {
      console.error('Failed to fetch project endpoints', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const filteredEndpoints = endpoints.filter(ep => 
    ep.http_url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ep.matched_gf_patterns && ep.matched_gf_patterns.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderEndpointItem = ({ item }: { item: Endpoint }) => (
    <View style={styles.epCard}>
      <View style={styles.epHeader}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.http_status || '???'}</Text>
        </View>
        <Text style={styles.subdomainName} numberOfLines={1}>{item.subdomain?.name}</Text>
      </View>

      <Text style={styles.urlText} numberOfLines={2}>{item.http_url}</Text>

      {item.matched_gf_patterns ? (
        <View style={styles.gfRow}>
          {item.matched_gf_patterns.split(',').map((pattern, idx) => (
            <View key={idx} style={styles.gfBadge}>
              <Hash size={10} color={Theme.colors.primary} />
              <Text style={styles.gfText}>{pattern.trim()}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.epFooter}>
        <Text style={styles.contentType}>{item.content_type || 'unknown/type'}</Text>
        <TouchableOpacity style={styles.linkBtn}>
          <ExternalLink size={14} color={Theme.colors.primary} />
          <Text style={styles.linkText}>Open</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Endpoint Explorer' }} />
      
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search URLs or GF patterns..."
            placeholderTextColor={Theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Mining Project Endpoints...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEndpoints}
          renderItem={renderEndpointItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEndpoints(); }} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Link size={48} color={Theme.colors.surface} />
              <Text style={styles.emptyText}>No endpoints discovered</Text>
              <Text style={styles.emptySubtext}>Run an endpoint discovery scan to see results here.</Text>
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  epCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  epHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  statusBadge: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.textMuted,
  },
  subdomainName: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
    flex: 1,
  },
  urlText: {
    fontSize: 14,
    color: Theme.colors.text,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 18,
  },
  gfRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  gfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary + '11',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  gfText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  epFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '44',
  },
  contentType: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    fontStyle: 'italic',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  linkText: {
    fontSize: 13,
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
