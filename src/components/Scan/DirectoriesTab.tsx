import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { Folder, Globe, Search, Filter, ExternalLink, FileText, ChevronRight, Hash, FileCode, Database, Copy } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';
import { TacticalHaptics } from '../../utils/haptics';
import { paths, components } from '../../types/api';

type Directory = components['schemas']['DirectoryFile'];

interface DirectoriesTabProps {
  scanId: number;
}

export default function DirectoriesTab({ scanId }: DirectoriesTabProps) {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const fetchDirectories = useCallback(async () => {
    try {
      type ResponseData = paths['/mapi/listDirectories/']['get']['responses']['200']['content']['application/json'];
      const response = await apiClient.get<ResponseData>(`/mapi/listDirectories/`, {
        params: { scan_history: scanId }
      });
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

  const renderItem = ({ item }: { item: Directory }) => {
    const isExpanded = expandedRows.has(item.id || 0);

    return (
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.cardHeader}
          onPress={() => toggleRow(item.id || 0)}
          activeOpacity={0.7}
        >
          <View style={styles.headerMain}>
            <View style={styles.urlSection}>
              <Text style={styles.directoryName} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.http_status || 0) + '22', borderColor: getStatusColor(item.http_status || 0) + '44' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.http_status || 0) }]}>
                  {item.http_status || '404'}
                </Text>
              </View>
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <FileCode size={12} color={Theme.colors.textMuted} />
                <Text style={styles.metricText}>{item.content_type || 'text/html'}</Text>
              </View>
              <View style={styles.metric}>
                <Database size={12} color={Theme.colors.textMuted} />
                <Text style={styles.metricText}>{((item.length || 0) / 1024).toFixed(1)} KB</Text>
              </View>
            </View>
          </View>
          <ChevronRight 
            size={20} 
            color={Theme.colors.textMuted} 
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => item.url && Linking.openURL(item.url)}
              >
                <ExternalLink size={14} color={Theme.colors.primary} />
                <Text style={styles.actionText}>OPEN URL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Copy size={14} color={Theme.colors.textMuted} />
                <Text style={styles.actionText}>COPY PATH</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const filteredDirs = directories.filter(d => 
    (d.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (d.url || '').toLowerCase().includes(search.toLowerCase())
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
        keyExtractor={(item) => (item.id || 0).toString()}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMain: {
    flex: 1,
  },
  urlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  directoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  subdomainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  subdomainText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.text,
  },
});
