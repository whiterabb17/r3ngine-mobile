import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Filter, Clock, Globe, Shield, Zap, AlertTriangle } from 'lucide-react-native';
import apiClient from '../../src/api/client';
import { Theme } from '../../src/constants/Theme';
import { formatDistanceToNow } from 'date-fns';

export default function MonitoringFeedScreen() {
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchDiscoveries = async () => {
    try {
      const response = await apiClient.get('/mapi/monitoring/');
      // Handling potential pagination or direct list
      const data = response.data.results || response.data;
      setDiscoveries(data);
    } catch (err) {
      console.error('Failed to fetch monitoring discoveries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiscoveries();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiscoveries();
  };

  const getDiscoveryIcon = (type: string) => {
    switch (type) {
      case 'subdomain': return <Globe size={16} color={Theme.colors.primary} />;
      case 'vulnerability': return <AlertTriangle size={16} color={Theme.colors.error} />;
      case 'port': return <Zap size={16} color={Theme.colors.secondary} />;
      default: return <Clock size={16} color={Theme.colors.info} />;
    }
  };

  const DiscoveryCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          {getDiscoveryIcon(item.discovery_type)}
          <Text style={styles.typeText}>{item.discovery_type?.toUpperCase()}</Text>
        </View>
        <Text style={styles.timeText}>
          {item.discovered_at ? formatDistanceToNow(new Date(item.discovered_at), { addSuffix: true }) : 'Just now'}
        </Text>
      </View>
      
      <Text style={styles.domainText}>{item.domain_name}</Text>
      <Text style={styles.contentText}>{item.content?.value || JSON.stringify(item.content)}</Text>
      
      <View style={styles.cardFooter}>
        <Shield size={12} color={Theme.colors.textMuted} />
        <Text style={styles.footerText}>Verified via ReconX Monitoring</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'RECONX DISCOVERY',
          headerTitleStyle: { fontFamily: 'Bangers' }
        }} 
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Synchronizing with ReconX Grid...</Text>
        </View>
      ) : (
        <FlatList
          data={discoveries}
          renderItem={({ item }) => <DiscoveryCard item={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Search size={48} color={Theme.colors.border} />
              <Text style={styles.emptyText}>No new discoveries detected in monitoring cycle.</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Theme.spacing.md,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  typeText: {
    color: Theme.colors.text,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  timeText: {
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  domainText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentText: {
    color: Theme.colors.secondary,
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: Theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border + '33',
    paddingTop: Theme.spacing.sm,
  },
  footerText: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  loadingText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
    fontFamily: 'Bangers',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
    maxWidth: 250,
  },
});
