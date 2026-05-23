import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  RefreshControl
} from 'react-native';
import { Stack } from 'expo-router';
import { 
  Settings, 
  Wrench, 
  FileText, 
  ChevronRight, 
  Database,
  Cpu,
  RefreshCw,
  Info
} from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { listEngines, listExternalTools, listWordlists } from '../../src/api/control';

const ControlScreen = () => {
  const [activeTab, setActiveTab] = useState<'engines' | 'tools' | 'wordlists'>('engines');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let dataList: any[] = [];
      if (activeTab === 'engines') {
        const result = await listEngines();
        dataList = result.engines || [];
      } else if (activeTab === 'tools') {
        const result = await listExternalTools();
        dataList = result.tools || [];
      } else {
        const result = await listWordlists();
        dataList = result.wordlists || [];
      }
      setData(dataList);
    } catch (error) {
      console.error(error);
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderEngine = (engine: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Cpu size={20} color={Theme.colors.primary} />
        <Text style={styles.cardTitle}>{engine.engine_name}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardDetail}>Type: {engine.engine_type}</Text>
        <Text style={styles.cardDetail}>Tasks: {Object.keys(engine.yaml_configuration || {}).length} tools configured</Text>
      </View>
    </View>
  );

  const renderTool = (tool: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Wrench size={20} color={Theme.colors.success} />
        <Text style={styles.cardTitle}>{tool.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tool.version || 'v1.0'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardDetail} numberOfLines={1}>{tool.description}</Text>
        <Text style={styles.cardDetail}>Status: Operational</Text>
      </View>
    </View>
  );

  const renderWordlist = (wordlist: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FileText size={20} color={Theme.colors.warning} />
        <Text style={styles.cardTitle}>{wordlist.name || wordlist}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardDetail}>Format: Text/Wordlist</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'INFRASTRUCTURE HUB',
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.primary,
          headerTitleStyle: { fontFamily: 'Bangers' }
        }} 
      />
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'engines' && styles.activeTab]}
          onPress={() => setActiveTab('engines')}
        >
          <Cpu size={18} color={activeTab === 'engines' ? Theme.colors.primary : Theme.colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'engines' && styles.activeTabText]}>Engines</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tools' && styles.activeTab]}
          onPress={() => setActiveTab('tools')}
        >
          <Wrench size={18} color={activeTab === 'tools' ? Theme.colors.success : Theme.colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'tools' && styles.activeTabText]}>Tools</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'wordlists' && styles.activeTab]}
          onPress={() => setActiveTab('wordlists')}
        >
          <Database size={18} color={activeTab === 'wordlists' ? Theme.colors.warning : Theme.colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'wordlists' && styles.activeTabText]}>Wordlists</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Info size={16} color={Theme.colors.info} />
        <Text style={styles.headerText}>
          Read-only visibility of your remote SOC infrastructure.
        </Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loaderText}>Querying Infrastructure...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            if (activeTab === 'engines') return renderEngine(item);
            if (activeTab === 'tools') return renderTool(item);
            return renderWordlist(item);
          }}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No {activeTab} discovered on server.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeTabText: {
    color: Theme.colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Theme.colors.surface + '80',
    margin: 16,
    borderRadius: 8,
  },
  headerText: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  cardBody: {
    paddingLeft: 32,
  },
  cardDetail: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  badge: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  badgeText: {
    color: Theme.colors.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    color: Theme.colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Theme.colors.textMuted,
  },
});

export default ControlScreen;
