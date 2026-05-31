import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
  TextInput,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import {
  Folder,
  FolderOpen,
  ExternalLink,
  FileCode,
  Database,
  ChevronRight,
  ChevronDown,
  Copy,
  Search,
  X,
  Globe,
} from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';
import { TacticalHaptics } from '../../utils/haptics';

/**
 * SubdomainBucket — Phase 1 API response item.
 * Returned when calling /mapi/listDirectories/?scan_history=<id>
 */
interface SubdomainBucket {
  /** Subdomain database ID */
  id: number;
  /** Subdomain hostname */
  name: string;
  /** Number of endpoints discovered on this subdomain */
  directory_count: number;
}

/**
 * EndpointItem — Phase 2 API response item (EndPointDirectorySerializer).
 * Returned when calling /mapi/listDirectories/?scan_history=<id>&subdomain_id=<id>
 * Note: `name` is a base64-encoded URL path.
 */
interface EndpointItem {
  /** Endpoint database ID */
  id: number;
  /** Base64-encoded path (e.g. btoa('/admin/login')) */
  name: string;
  /** Full HTTP URL */
  url: string;
  /** HTTP status code (200, 301, 404, etc.) */
  http_status: number;
  /** MIME content type */
  content_type: string;
  /** Response body length in bytes */
  length: number;
}

interface DirectoriesTabProps {
  /** The scan history ID to fetch directories for */
  scanId: number;
}

/**
 * Decode a base64-encoded path string.
 * The Hermes JS engine (used by React Native 0.71+) exposes global `atob`.
 * Falls back to manual decode on older runtimes.
 */
const decodeBase64Path = (encoded: string): string => {
  try {
    return atob(encoded);
  } catch {
    return encoded;
  }
};

/**
 * Return a colour based on an HTTP status code.
 */
const getStatusColor = (status: number): string => {
  if (status >= 200 && status < 300) return Theme.colors.success;
  if (status >= 300 && status < 400) return Theme.colors.primary;
  if (status >= 400 && status < 500) return Theme.colors.warning;
  return Theme.colors.error;
};

/**
 * DirectoriesTab Component
 *
 * Renders fuzzing/directory discovery results as a two-level collapsible tree.
 *
 * Level 1 — Subdomains (Phase 1 API): shows subdomain hostname and endpoint count.
 * Level 2 — Endpoints (Phase 2 API): lazy-loaded when a subdomain is expanded,
 *   showing the decoded path, HTTP status badge, content-type, and size.
 */
export default function DirectoriesTab({ scanId }: DirectoriesTabProps) {
  /** Phase 1: list of subdomains that have endpoints */
  const [subdomains, setSubdomains] = useState<SubdomainBucket[]>([]);
  /** Phase 2: map of subdomainId → loaded endpoints */
  const [endpointMap, setEndpointMap] = useState<Map<number, EndpointItem[]>>(new Map());
  /** Tracks which subdomains are currently fetching Phase 2 data */
  const [loadingSet, setLoadingSet] = useState<Set<number>>(new Set());
  /** Tracks which subdomains are expanded */
  const [expandedSet, setExpandedSet] = useState<Set<number>>(new Set());
  /** Top-level loading state for Phase 1 */
  const [loading, setLoading] = useState(true);
  /** Pull-to-refresh indicator */
  const [refreshing, setRefreshing] = useState(false);
  /** Search query to filter visible paths */
  const [search, setSearch] = useState('');

  /**
   * Fetch Phase 1: subdomains with endpoint counts.
   * API: GET /mapi/listDirectories/?scan_history=<scanId>
   * Returns: { count, results: [{ id, name, directory_count }] }
   */
  const fetchSubdomains = useCallback(async () => {
    try {
      const response = await apiClient.get('/mapi/listDirectories/', {
        params: { scan_history: scanId },
      });
      const data: SubdomainBucket[] = response.data?.results ?? (Array.isArray(response.data) ? response.data : []);
      setSubdomains(data);
    } catch (err) {
      console.error('[DirectoriesTab] Phase 1 fetch failed:', err);
      TacticalHaptics.error();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scanId]);

  /**
   * Fetch Phase 2: endpoints for a specific subdomain.
   * API: GET /mapi/listDirectories/?scan_history=<scanId>&subdomain_id=<subdomainId>
   * Returns paginated EndpointItem list.
   * Only fetches once per subdomain; subsequent expands use cached data.
   */
  const fetchEndpoints = useCallback(async (subdomainId: number) => {
    // Guard: do not re-fetch if already loaded
    if (endpointMap.has(subdomainId)) return;

    setLoadingSet(prev => new Set(prev).add(subdomainId));
    try {
      const response = await apiClient.get('/mapi/listDirectories/', {
        params: { scan_history: scanId, subdomain_id: subdomainId },
      });
      // Endpoint list may come paginated or as a flat array
      const raw = response.data;
      const items: EndpointItem[] = Array.isArray(raw) ? raw : (raw?.results ?? []);
      setEndpointMap(prev => new Map(prev).set(subdomainId, items));
    } catch (err) {
      console.error(`[DirectoriesTab] Phase 2 fetch failed for subdomain ${subdomainId}:`, err);
      TacticalHaptics.error();
      // Store empty array so the user sees the empty state rather than infinite spinner
      setEndpointMap(prev => new Map(prev).set(subdomainId, []));
    } finally {
      setLoadingSet(prev => {
        const next = new Set(prev);
        next.delete(subdomainId);
        return next;
      });
    }
  }, [scanId, endpointMap]);

  useEffect(() => {
    fetchSubdomains();
  }, [fetchSubdomains]);

  /**
   * Toggle the expand/collapse state of a subdomain row.
   * Triggers a Phase 2 fetch on first expand.
   */
  const toggleSubdomain = useCallback((subdomainId: number) => {
    TacticalHaptics.soft();
    setExpandedSet(prev => {
      const next = new Set(prev);
      if (next.has(subdomainId)) {
        next.delete(subdomainId);
      } else {
        next.add(subdomainId);
        // Lazy-load endpoints on first expand
        fetchEndpoints(subdomainId);
      }
      return next;
    });
  }, [fetchEndpoints]);

  const onRefresh = () => {
    setRefreshing(true);
    // Reset all state to force a full re-fetch
    setSubdomains([]);
    setEndpointMap(new Map());
    setExpandedSet(new Set());
    setLoadingSet(new Set());
    fetchSubdomains();
  };

  /**
   * Copy a URL path to the device clipboard.
   * Shows a brief Android toast confirmation.
   */
  const copyPath = (path: string) => {
    Clipboard.setString(path);
    TacticalHaptics.success();
    try {
      ToastAndroid.showWithGravity('Path copied!', ToastAndroid.SHORT, ToastAndroid.BOTTOM);
    } catch {
      // iOS does not have ToastAndroid — silently ignore
    }
  };

  /**
   * Render a single endpoint item inside an expanded subdomain.
   */
  const renderEndpoint = (endpoint: EndpointItem, searchQuery: string) => {
    const path = decodeBase64Path(endpoint.name);
    // Filter by search query when one is active
    if (searchQuery && !path.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(endpoint.url || '').toLowerCase().includes(searchQuery.toLowerCase())) {
      return null;
    }
    const statusColor = getStatusColor(endpoint.http_status || 0);
    const sizeKb = ((endpoint.length || 0) / 1024).toFixed(1);

    return (
      <View key={endpoint.id} style={styles.endpointRow}>
        {/* Path and status line */}
        <View style={styles.endpointHeader}>
          <Text style={styles.endpointPath} numberOfLines={1}>{path}</Text>
          <View style={[styles.statusBadge, {
            backgroundColor: statusColor + '22',
            borderColor: statusColor + '55',
          }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {endpoint.http_status || '???'}
            </Text>
          </View>
        </View>

        {/* Metadata row */}
        <View style={styles.endpointMeta}>
          <View style={styles.metaItem}>
            <FileCode size={11} color={Theme.colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>{endpoint.content_type || 'text/html'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Database size={11} color={Theme.colors.textMuted} />
            <Text style={styles.metaText}>{sizeKb} KB</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => endpoint.url && Linking.openURL(endpoint.url)}
          >
            <ExternalLink size={12} color={Theme.colors.primary} />
            <Text style={styles.actionText}>OPEN URL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => copyPath(path)}
          >
            <Copy size={12} color={Theme.colors.textMuted} />
            <Text style={styles.actionText}>COPY PATH</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /**
   * Render a single subdomain bucket row with its collapse/expand chevron.
   */
  const renderSubdomain = ({ item }: { item: SubdomainBucket }) => {
    const isExpanded = expandedSet.has(item.id);
    const isLoading = loadingSet.has(item.id);
    const endpoints = endpointMap.get(item.id) ?? [];

    return (
      <View style={styles.subdomainCard}>
        {/* Subdomain header row — tap to expand */}
        <TouchableOpacity
          style={styles.subdomainHeader}
          onPress={() => toggleSubdomain(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.subdomainIconBox}>
            {isExpanded
              ? <FolderOpen size={18} color={Theme.colors.primary} />
              : <Folder size={18} color={Theme.colors.textMuted} />}
          </View>

          <View style={styles.subdomainInfo}>
            <Text style={styles.subdomainName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.subdomainCountRow}>
              <Globe size={11} color={Theme.colors.textMuted} />
              <Text style={styles.subdomainCount}>
                {item.directory_count} {item.directory_count === 1 ? 'path' : 'paths'} found
              </Text>
            </View>
          </View>

          <View style={styles.subdomainRight}>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{item.directory_count}</Text>
            </View>
            {isExpanded
              ? <ChevronDown size={18} color={Theme.colors.textMuted} />
              : <ChevronRight size={18} color={Theme.colors.textMuted} />}
          </View>
        </TouchableOpacity>

        {/* Expanded content — endpoint list */}
        {isExpanded && (
          <View style={styles.endpointList}>
            {isLoading ? (
              <View style={styles.endpointLoader}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={styles.endpointLoaderText}>LOADING PATHS...</Text>
              </View>
            ) : endpoints.length === 0 ? (
              <View style={styles.endpointEmpty}>
                <Text style={styles.endpointEmptyText}>No endpoints stored for this subdomain.</Text>
              </View>
            ) : (
              endpoints.map(ep => renderEndpoint(ep, search))
            )}
          </View>
        )}
      </View>
    );
  };

  // ─── Loading state (Phase 1) ───────────────────────────────────────────────
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
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Search size={16} color={Theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter paths..."
          placeholderTextColor={Theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Subdomain list */}
      <FlatList
        data={subdomains}
        renderItem={renderSubdomain}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Folder size={48} color={Theme.colors.border} />
            <Text style={styles.emptyTitle}>NO DISCOVERED PATHS</Text>
            <Text style={styles.emptyText}>
              The directory discovery phase did not yield any tactical findings for this scan.
            </Text>
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

  // ─── Loading / Empty ──────────────────────────────────────────────────────
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
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // ─── Search bar ───────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 13,
    padding: 0,
  },

  // ─── List ─────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: 40,
  },

  // ─── Subdomain card ───────────────────────────────────────────────────────
  subdomainCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  subdomainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: 12,
  },
  subdomainIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  subdomainInfo: {
    flex: 1,
  },
  subdomainName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 2,
  },
  subdomainCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subdomainCount: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  subdomainRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: Theme.colors.primary + '22',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '44',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
  },

  // ─── Endpoint list (Level 2) ──────────────────────────────────────────────
  endpointList: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  endpointLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Theme.spacing.md,
  },
  endpointLoaderText: {
    color: Theme.colors.primary,
    fontSize: 11,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  endpointEmpty: {
    padding: Theme.spacing.md,
    alignItems: 'center',
  },
  endpointEmptyText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
  },

  // ─── Single endpoint item ─────────────────────────────────────────────────
  endpointRow: {
    padding: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border + '44',
    backgroundColor: Theme.colors.background + 'aa',
  },
  endpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  endpointPath: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.text,
    fontFamily: 'monospace' as any,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Bangers',
  },
  endpointMeta: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },

  // ─── Action buttons ───────────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  actionText: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.text,
    letterSpacing: 0.3,
  },
});
