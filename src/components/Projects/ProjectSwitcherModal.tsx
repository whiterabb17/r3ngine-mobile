import React, { useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { useProjectStore } from '../../store/useProjectStore';
import { Project } from '../../api/projects';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ProjectSwitcherModal({ visible, onClose }: Props) {
  const { availableProjects, currentProject, setCurrentProject } = useProjectStore();

  const handleSelect = useCallback(
    (project: Project) => {
      setCurrentProject(project.slug);
      onClose();
    },
    [setCurrentProject, onClose]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Switch Project</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {availableProjects.length === 0 ? (
            <Text style={styles.empty}>No projects available.</Text>
          ) : (
            <FlatList
              data={availableProjects}
              keyExtractor={(p) => p.slug}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)}>
                  <Text
                    style={[
                      styles.rowText,
                      item.slug === currentProject && styles.rowTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.slug === currentProject && (
                    <Check size={16} color={Theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    paddingBottom: Theme.spacing.xl,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: { color: Theme.colors.text, fontSize: 16, fontWeight: '600' },
  empty: {
    color: Theme.colors.textMuted,
    textAlign: 'center',
    padding: Theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
  },
  rowText: { color: Theme.colors.text, fontSize: 15 },
  rowTextActive: { color: Theme.colors.primary, fontWeight: '600' },
});
