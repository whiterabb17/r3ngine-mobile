import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Text } from 'react-native';
import { Puzzle, CheckCircle2, Info } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import type { Plugin } from '../../api/control';

interface PluginSelectorProps {
  plugins: Plugin[];
  selectedPlugins: string[];
  onToggle: (slug: string) => void;
}

export default function PluginSelector({ plugins, selectedPlugins, onToggle }: PluginSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Plugin Selection</Text>
      <Text style={styles.subtitle}>
        Select which enabled plugins to include in this scan. Leave all unchecked to run all enabled plugins.
      </Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {plugins.length === 0 ? (
          <View style={styles.emptyState}>
            <Info size={24} color={Theme.colors.textMuted} />
            <Text style={styles.emptyText}>No plugins installed</Text>
            <Text style={styles.emptySubtext}>
              Install plugins from the Plugin Marketplace to enable per-scan selection.
            </Text>
          </View>
        ) : (
          <View style={styles.pluginList}>
            {plugins.map((plugin) => {
              const isSelected = selectedPlugins.includes(plugin.slug);
              return (
                <TouchableOpacity
                  key={plugin.slug}
                  style={[
                    styles.pluginCard,
                    isSelected && {
                      borderColor: Theme.colors.accent,
                      backgroundColor: Theme.colors.accent + '11',
                    },
                  ]}
                  onPress={() => onToggle(plugin.slug)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconContainer, { backgroundColor: Theme.colors.accent + '22' }]}>
                    <Puzzle size={20} color={Theme.colors.accent} />
                  </View>
                  <View style={styles.pluginInfo}>
                    <Text style={[styles.pluginName, isSelected && { color: Theme.colors.accent }]}>
                      {plugin.name}
                    </Text>
                    {plugin.description ? (
                      <Text style={styles.pluginDesc} numberOfLines={2}>
                        {plugin.description}
                      </Text>
                    ) : (
                      <Text style={styles.pluginDesc}>{plugin.slug}</Text>
                    )}
                  </View>
                  <View style={styles.checkbox}>
                    {isSelected ? (
                      <CheckCircle2 size={18} color={Theme.colors.accent} />
                    ) : (
                      <View style={styles.checkboxUnchecked} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 18,
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginBottom: 16,
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  pluginList: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  pluginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pluginInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pluginName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  pluginDesc: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 2,
  },
  checkbox: {
    backgroundColor: 'transparent',
  },
  checkboxUnchecked: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Theme.colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: 'transparent',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.textMuted,
  },
  emptySubtext: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  spacer: {
    height: 40,
    backgroundColor: 'transparent',
  },
});
