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
  Info,
  Sliders
} from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { listEngines, listExternalTools, listWordlists, listHardwareProfiles, type HardwareProfile } from '../../src/api/control';

const ControlScreen = () => {
  const [activeTab, setActiveTab] = useState<'engines' | 'profiles' | 'tools' | 'wordlists'>('engines');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setData([]); // Reset list on tab change to prevent rendering mismatched components
    try {
      let dataList: any[] = [];
      if (activeTab === 'engines') {
        const result = await listEngines();
        dataList = result.engines || [];
      } else if (activeTab === 'profiles') {
        dataList = await listHardwareProfiles();
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

  const renderEngine = (engine: any) => {
    if (!engine || !engine.engine_name) return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Cpu size={20} color={Theme.colors.primary} />
          <Text style={styles.cardTitle}>{engine.engine_name}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardDetail}>Type: {engine.default_engine ? 'Primary' : 'Custom'}</Text>
          <Text style={styles.cardDetail}>Tasks: {engine.configured_tools_count || 0} tools configured</Text>
        </View>
      </View>
    );
  };

  const renderProfile = (profile: HardwareProfile) => {
    if (!profile || !profile.name) return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Cpu size={20} color={Theme.colors.accent} />
          <Text style={styles.cardTitle}>{profile.name.toUpperCase()}</Text>
          {profile.is_default && (
            <View style={styles.badgeDefault}>
              <Text style={styles.badgeDefaultText}>DEFAULT</Text>
            </View>
          )}
          <View style={[styles.badge, { borderColor: profile.profile_type === 'builtin' ? Theme.colors.primary + '66' : Theme.colors.accent + '66' }]}>
            <Text style={[styles.badgeText, { color: profile.profile_type === 'builtin' ? Theme.colors.primary : Theme.colors.accent }]}>
              {profile.profile_type === 'builtin' ? 'Built-in' : 'Custom'}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          {profile.description ? (
            <Text style={styles.profileDescription}>{profile.description}</Text>
          ) : null}
          <View style={styles.profileMetaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Threads:</Text>
              <Text style={styles.metaValue}>{profile.threads}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Rate:</Text>
              <Text style={styles.metaValue}>{profile.rate_limit}/s</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Timeout:</Text>
              <Text style={styles.metaValue}>{profile.timeout}m</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Delay:</Text>
              <Text style={styles.metaValue}>{profile.delay}s</Text>
            </View>
          </View>
          <Text style={[styles.cardDetail, { marginTop: 10 }]}>
            Status: {profile.is_active ? 'Active / Enabled' : 'Deactivated'}
          </Text>
        </View>
      </View>
    );
  };

  const renderTool = (tool: any) => {
    if (!tool || !tool.name) return null;
    return (
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
  };

  const renderWordlist = (wordlist: any) => {
    const name = typeof wordlist === 'string' ? wordlist : (wordlist?.name || '');
    if (!name) return null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FileText size={20} color={Theme.colors.warning} />
          <Text style={styles.cardTitle}>{name}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardDetail}>Format: Text/Wordlist</Text>
        </View>
      </View>
    );
  };

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
          style={[styles.tab, activeTab === 'profiles' && styles.activeTab]}
          onPress={() => setActiveTab('profiles')}
        >
          <Sliders size={18} color={activeTab === 'profiles' ? Theme.colors.accent : Theme.colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'profiles' && styles.activeTabText]}>Profiles</Text>
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
            if (activeTab === 'profiles') return renderProfile(item);
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
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
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
    fontSize: 15,
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
  badgeDefault: {
    backgroundColor: Theme.colors.success + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Theme.colors.success + '44',
    marginRight: 6,
  },
  badgeDefaultText: {
    color: Theme.colors.success,
    fontSize: 8,
    fontWeight: 'bold',
  },
  profileDescription: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  profileMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: Theme.colors.border,
  },
  metaLabel: {
    color: Theme.colors.textMuted,
    fontSize: 11,
  },
  metaValue: {
    color: Theme.colors.text,
    fontSize: 11,
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

