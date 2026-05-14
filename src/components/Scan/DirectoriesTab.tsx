import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { Folder, Globe, Search, Filter, ExternalLink, FileText, ChevronRight, Hash } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';
import { TacticalHaptics } from '../../utils/haptics';

interface DirectoryFile {
  id: number;
  name: string;
  url: string;
  http_status: number;
  length: number;
  content_type: string;
}

interface DirectoriesTabProps {
  scanId: number;
}

export default function DirectoriesTab({ scanId }: DirectoriesTabProps) {
  const [directories, setDirectories] = useState<DirectoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDirectories = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/listDirectories/?scan_history=${scanId}`);
      // The API returns results in a 'results' field if paginated, or just as an array
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setDirectories(data);
    } catch (err) {
      console.error('Failed to fetch directories:', err);
      TacticalHaptics.error();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scanId]);

  useEffect(() => {
    fetchDirectories();
  }, [fetchDirectories]);

  const onRefresh = () => {
    setRefreshing(true);
    TacticalHaptics.soft();
    fetchDirectories();
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return Theme.colors.success;
    if (status >= 300 && status < 400) return Theme.colors.primary;
    if (status >= 400 && status < 500) return Theme.colors.warning;
    return Theme.colors.error;
  };

  const renderItem = ({ item }: { item: DirectoryFile }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => item.url && Linking.openURL(item.url)}
      activeOpacity={0.7}
    >
      <View style={styles.cardMain}>
        <View style={styles.iconContainer}>
          <Folder size={18} color={Theme.colors.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.fullUrl} numberOfLines={1}>{item.url}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.http_status) + '44' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.http_status) }]}>
            {item.http_status}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Hash size={12} color={Theme.colors.textMuted} />
          <Text style={styles.footerText}>{(item.length / 1024).toFixed(1)} KB</Text>
        </View>
        <View style={styles.footerItem}>
          <FileText size={12} color={Theme.colors.textMuted} />
          <Text style={styles.footerText}>{item.content_type || 'unknown/type'}</Text>
        </View>
        <ExternalLink size={14} color={Theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const filteredDirs = directories.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.url.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loaderText}>INDEXING DIRECTORY FUZZING RESULTS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredDirs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Folder size={48} color={Theme.colors.border} />
            <Text style={styles.emptyTitle}>NO DISCOVERED PATHS</Text>
            <Text style={styles.emptyText}>The directory discovery phase did not yield any tactical findings for this target.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loaderText: {
    marginTop: 16,
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary + '11',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary + '22',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    color: Theme.colors.text,
    fontSize: 15,
    fontWeight: 'bold',
  },
  fullUrl: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'Bangers',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    marginTop: 40,
  },
  emptyTitle: {
    color: Theme.colors.text,
    fontSize: 18,
    fontFamily: 'Bangers',
    marginTop: 16,
    letterSpacing: 1,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
