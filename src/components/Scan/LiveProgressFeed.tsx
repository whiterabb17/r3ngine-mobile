import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Terminal, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';
import { paths, components } from '../../types/api';

type LogEntry = components['schemas']['Command'];

interface LiveProgressFeedProps {
  scanId: number;
  active: boolean;
}

export default function LiveProgressFeed({ scanId, active }: LiveProgressFeedProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let interval: any;
    
    if (active && scanId) {
      fetchLogs();
      interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [active, scanId]);

  const fetchLogs = async () => {
    try {
      type ResponseData = paths['/mapi/listScanLogs/']['get']['responses']['200']['content']['application/json'];
      const response = await apiClient.get<ResponseData>(`/mapi/listScanLogs/`, {
        params: { scan_id: scanId }
      });
      if (response.data) {
        // Reverse to show latest at bottom if using flatlist normally, 
        // or keep as is if we want latest at top.
        // reNgine usually shows latest at bottom in web.
        const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch scan logs', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={styles.activityTitleRow}>
          {item.activity?.status === 2 ? (
            <CheckCircle2 size={12} color={Theme.colors.success} />
          ) : (
            <ActivityIndicator size="small" color={Theme.colors.primary} style={styles.miniLoader} />
          )}
          <Text style={styles.activityTitle}>{item.activity?.title || 'Executing Tool'}</Text>
        </View>
        <Text style={styles.timestamp}>Just now</Text>
      </View>
      
      <View style={styles.commandBox}>
        <Text style={styles.commandText}>$ {item.command}</Text>
      </View>
      
      {item.output ? (
        <View style={styles.outputBox}>
          <Text style={styles.outputText} numberOfLines={4}>{item.output.trim()}</Text>
        </View>
      ) : null}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Initializing tactical feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Terminal size={16} color={Theme.colors.primary} />
          <Text style={styles.title}>Tactical Feed</Text>
        </View>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchLogs(); }}>
          <RefreshCw size={14} color={Theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <AlertCircle size={24} color={Theme.colors.textMuted} />
          <Text style={styles.emptyText}>Waiting for activity logs...</Text>
          <Text style={styles.emptySubtext}>Logs will appear here once the scan starts processing tasks.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(item) => (item.id || Math.random()).toString()}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    padding: 12,
  },
  logCard: {
    backgroundColor: 'transparent',
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: Theme.colors.primary + '44',
    paddingLeft: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  miniLoader: {
    transform: [{ scale: 0.6 }],
  },
  timestamp: {
    fontSize: 10,
    color: Theme.colors.textMuted,
  },
  commandBox: {
    backgroundColor: Theme.colors.surface,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  commandText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Theme.colors.success,
  },
  outputBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 6,
  },
  outputText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Theme.colors.textMuted,
    lineHeight: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 12,
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtext: {
    marginTop: 8,
    color: Theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
