import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  Search, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  History, 
  Network, 
  ChevronRight,
  Info
} from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';

const tools = [
  {
    id: 'whois',
    title: 'WHOIS Lookup',
    description: 'Get ownership and registration info for domains or IPs.',
    icon: Globe,
    color: '#3b82f6',
    route: '/tools/whois'
  },
  {
    id: 'waf',
    title: 'WAF Detector',
    description: 'Identify if a target is protected by a Firewall.',
    icon: ShieldCheck,
    color: '#ef4444',
    route: '/tools/waf'
  },
  {
    id: 'cms',
    title: 'CMS Detector',
    description: 'Discover the technology stack and CMS version.',
    icon: Cpu,
    color: '#10b981',
    route: '/tools/cms'
  },
  {
    id: 'reverse-whois',
    title: 'Reverse WHOIS',
    description: 'Find domains owned by a specific organization or email.',
    icon: Search,
    color: '#8b5cf6',
    route: '/tools/reverse-whois'
  },
  {
    id: 'ip-history',
    title: 'Domain IP History',
    description: 'Track DNS and infrastructure changes over time.',
    icon: History,
    color: '#f59e0b',
    route: '/tools/ip-history'
  },
  {
    id: 'ip-to-domain',
    title: 'IP to Domain',
    description: 'Resolve IP addresses back to hostnames (PTR).',
    icon: Network,
    color: '#06b6d4',
    route: '/tools/ip-to-domain'
  }
];

const ToolsScreen = () => {
  const router = useRouter();

  const renderTool = ({ item }: { item: typeof tools[0] }) => (
    <TouchableOpacity 
      style={styles.toolCard}
      onPress={() => router.push(item.route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <item.icon size={24} color={item.color} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.toolTitle}>{item.title}</Text>
        <Text style={styles.toolDescription}>{item.description}</Text>
      </View>
      <ChevronRight size={20} color={Theme.colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'TOOLS',
          headerStyle: { backgroundColor: Theme.colors.surface },
          headerTintColor: Theme.colors.primary,
          headerTitleStyle: {
            fontFamily: 'Bangers',
            fontSize: 24,
          }
        }}
      />
      
      <View style={styles.infoBanner}>
        <Info size={16} color={Theme.colors.info} />
        <Text style={styles.infoText}>
          Rapid intelligence gathering tools for on-the-go analysis.
        </Text>
      </View>

      <FlatList
        data={tools}
        keyExtractor={(item) => item.id}
        renderItem={renderTool}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.info,
  },
  infoText: {
    color: Theme.colors.textMuted,
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  toolDescription: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    lineHeight: 18,
  },
});

export default ToolsScreen;
