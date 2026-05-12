import React from 'react';
import { StyleSheet, ScrollView, FlatList } from 'react-native';
import { LayoutGrid, Network, Cpu, Globe } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../constants/Theme';

interface Technology {
  name: string;
  count: number;
}

interface Port {
  number: number;
  service_name: string;
  is_uncommon: boolean;
  count: number;
}

interface TechStackTabProps {
  technologies: Technology[];
  ports: Port[];
}

export default function TechStackTab({ technologies = [], ports = [] }: TechStackTabProps) {
  const renderTechItem = ({ item }: { item: Technology }) => (
    <View style={styles.row}>
      <View style={styles.iconContainer}>
        <Cpu size={16} color={Theme.colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.bar, 
              { width: `${Math.min((item.count / (technologies[0]?.count || 1)) * 100, 100)}%` }
            ]} 
          />
          <Text style={styles.count}>{item.count}</Text>
        </View>
      </View>
    </View>
  );

  const renderPortItem = ({ item }: { item: Port }) => (
    <View style={styles.row}>
      <View style={[styles.iconContainer, { backgroundColor: item.is_uncommon ? Theme.colors.warning + '15' : Theme.colors.info + '15' }]}>
        <Network size={16} color={item.is_uncommon ? Theme.colors.warning : Theme.colors.info} />
      </View>
      <View style={styles.info}>
        <View style={styles.portHeader}>
          <Text style={styles.name}>Port {item.number}</Text>
          <Text style={styles.serviceName}>{item.service_name}</Text>
        </View>
        <View style={styles.barContainer}>
          <View 
            style={[
              styles.bar, 
              { 
                backgroundColor: item.is_uncommon ? Theme.colors.warning : Theme.colors.info,
                width: `${Math.min((item.count / (ports[0]?.count || 1)) * 100, 100)}%` 
              }
            ]} 
          />
          <Text style={styles.count}>{item.count} Assets</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <LayoutGrid size={18} color={Theme.colors.text} />
          <Text style={styles.sectionTitle}>Top Technologies</Text>
        </View>
        <View style={styles.card}>
          {technologies.length > 0 ? (
            technologies.map((tech, index) => (
              <React.Fragment key={index}>
                {renderTechItem({ item: tech })}
              </React.Fragment>
            ))
          ) : (
            <Text style={styles.emptyText}>No technologies detected</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Network size={18} color={Theme.colors.text} />
          <Text style={styles.sectionTitle}>Discovered Ports</Text>
        </View>
        <View style={styles.card}>
          {ports.length > 0 ? (
            ports.map((port, index) => (
              <React.Fragment key={index}>
                {renderPortItem({ item: port })}
              </React.Fragment>
            ))
          ) : (
            <Text style={styles.emptyText}>No ports detected</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: 40,
  },
  section: {
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: Theme.spacing.sm,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 12,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginBottom: 4,
  },
  portHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  serviceName: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    height: 4,
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
    flex: 1,
  },
  count: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    minWidth: 30,
    textAlign: 'right',
  },
  emptyText: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  }
});
