import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Shield, Settings, Activity, Wrench, Server } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../../src/constants/Theme';
import { useProjectStore } from '../../src/store/useProjectStore';
import ProjectSwitcherModal from '../../src/components/Projects/ProjectSwitcherModal';
import InstanceSwitcherModal from '../../src/components/Instances/InstanceSwitcherModal';
import { useInstanceStore } from '../../src/store/useInstanceStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { currentProject, loadProjects } = useProjectStore();
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [instanceVisible, setInstanceVisible] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const projectLabel = currentProject ?? 'No Project';

  const headerRight = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: Theme.spacing.sm, backgroundColor: 'transparent' }}>
      <TouchableOpacity
        onPress={() => setInstanceVisible(true)}
        style={[styles.projectBtn, { paddingHorizontal: 6 }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Server size={14} color={Theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setSwitcherVisible(true)}
        style={styles.projectBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.projectLabel} numberOfLines={1}>
          {projectLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Theme.colors.primary,
          tabBarInactiveTintColor: Theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: Theme.colors.background,
            borderTopColor: Theme.colors.border,
            height: 65 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            paddingTop: 10,
          },
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="scans"
          options={{ title: 'Scans', tabBarIcon: ({ color }) => <Activity size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="targets"
          options={{ title: 'Targets', tabBarIcon: ({ color }) => <Shield size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="tools"
          options={{ title: 'Tools', tabBarIcon: ({ color }) => <Wrench size={24} color={color} /> }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Settings', tabBarIcon: ({ color }) => <Settings size={24} color={color} /> }}
        />
      </Tabs>

      <ProjectSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />

      <InstanceSwitcherModal
        visible={instanceVisible}
        onClose={() => setInstanceVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  projectBtn: {
    marginRight: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    maxWidth: 120,
  },
  projectLabel: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
