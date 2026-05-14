import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Share,
  Dimensions 
} from 'react-native';
import { Theme } from '../../constants/Theme';
import { observabilityApi } from '../../api/observability';
import { 
  Terminal, 
  RefreshCw, 
  Share2, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Clock
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function SystemLogViewer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await observabilityApi.getSystemLogs();
      if (data.status) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch system logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRefreshing(true);
    fetchLogs();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: logs.join('\n'),
        title: 'reNgine System Logs'
      });
    } catch (error) {
      console.error('Error sharing logs:', error);
    }
  };

  const getLogLevel = (line: string) => {
    if (line.includes('ERROR') || line.includes('CRITICAL')) return 'error';
    if (line.includes('WARNING')) return 'warning';
    if (line.includes('SUCCESS') || line.includes('Done')) return 'success';
    return 'info';
  };

  const renderLogItem = ({ item }: { item: string }) => {
    const level = getLogLevel(item);
    let color = Theme.colors.text;
    let icon = <Info size={12} color={Theme.colors.textMuted} />;

    if (level === 'error') {
      color = Theme.colors.error;
      icon = <AlertTriangle size={12} color={Theme.colors.error} />;
    } else if (level === 'warning') {
      color = Theme.colors.warning;
      icon = <AlertTriangle size={12} color={Theme.colors.warning} />;
    } else if (level === 'success') {
      color = Theme.colors.success;
      icon = <CheckCircle size={12} color={Theme.colors.success} />;
    }

    return (
      <View style={styles.logLine}>
        <View style={styles.logIcon}>{icon}</View>
        <Text style={[styles.logText, { color }]}>{item}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Terminal size={20} color={Theme.colors.primary} />
          <Text style={styles.title}>SYSTEM-WIDE LOGS</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
            <Share2 size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleManualRefresh} style={styles.actionBtn}>
            {refreshing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <RefreshCw size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.statusText}>STREAMING SYSTEM EVENTS...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={logs}
          renderItem={renderLogItem}
          keyExtractor={(_, index) => `log-${index}`}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Clock size={40} color={Theme.colors.textMuted} />
              <Text style={styles.emptyText}>NO SYSTEM LOGS RECORDED YET</Text>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          CONNECTED TO CELERY.LOG • TAIL -F ACTIVE
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: Theme.colors.primary,
    fontFamily: 'Bangers',
    fontSize: 18,
    marginLeft: 10,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: Theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContent: {
    padding: 12,
  },
  logLine: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 2,
  },
  logIcon: {
    width: 20,
    marginTop: 2,
  },
  logText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  statusText: {
    color: Theme.colors.textMuted,
    marginTop: 16,
    fontFamily: 'Bangers',
    letterSpacing: 1,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    marginTop: 12,
    fontFamily: 'Bangers',
    textAlign: 'center',
  },
  footer: {
    padding: 8,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    alignItems: 'center',
  },
  footerText: {
    color: Theme.colors.primary,
    fontSize: 9,
    fontFamily: 'monospace',
    opacity: 0.7,
  }
});
