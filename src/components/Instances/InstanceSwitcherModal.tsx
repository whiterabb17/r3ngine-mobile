import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { Check, X, Plus, Server, Trash2 } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { useInstanceStore, Instance } from '../../store/useInstanceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import AddInstanceModal from './AddInstanceModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function InstanceSwitcherModal({ visible, onClose }: Props) {
  const { instances, currentInstanceId, switchInstance, removeInstance } = useInstanceStore();
  const { setServerIp } = useSettingsStore();
  const [addVisible, setAddVisible] = useState(false);

  const handleSelect = async (inst: Instance) => {
    const { setTokens, logout } = useAuthStore();
    switchInstance(inst.id);
    await setServerIp(inst.serverIp);
    if (inst.token && inst.refreshToken) {
      await setTokens(inst.token, inst.refreshToken);
    } else {
      await logout();
    }
    onClose();
  };

  const handleDelete = (inst: Instance) => {
    if (inst.id === currentInstanceId) return;
    Alert.alert(
      'Remove Server',
      `Remove "${inst.label}" from saved connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: () => removeInstance(inst.id),
        },
      ]
    );
  };

  const handleAdded = async (id: string) => {
    setAddVisible(false);
    const inst = useInstanceStore.getState().instances.find(i => i.id === id);
    if (inst) {
      await handleSelect(inst);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <SafeAreaView style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Switch Server</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={Theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {instances.length === 0 ? (
              <Text style={styles.empty}>No saved servers. Add one below.</Text>
            ) : (
              <FlatList
                data={instances}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => {
                  const isActive = item.id === currentInstanceId;
                  return (
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => handleSelect(item)}
                    >
                      <Server
                        size={16}
                        color={isActive ? Theme.colors.primary : Theme.colors.textMuted}
                        style={{ marginRight: Theme.spacing.sm }}
                      />
                      <View style={styles.rowInfo}>
                        <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>
                          {item.label}
                        </Text>
                        <Text style={styles.rowUrl} numberOfLines={1}>{item.serverIp}</Text>
                      </View>
                      {isActive
                        ? <Check size={16} color={Theme.colors.primary} />
                        : (
                          <TouchableOpacity
                            onPress={() => handleDelete(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={16} color={Theme.colors.textMuted} />
                          </TouchableOpacity>
                        )
                      }
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TouchableOpacity style={styles.addBtn} onPress={() => setAddVisible(true)}>
              <Plus size={16} color={Theme.colors.primary} />
              <Text style={styles.addBtnText}>Add Server</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <AddInstanceModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdded={handleAdded}
      />
    </>
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
    maxHeight: '65%',
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
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
  },
  rowInfo: { flex: 1 },
  rowLabel: { color: Theme.colors.text, fontSize: 15 },
  rowLabelActive: { color: Theme.colors.primary, fontWeight: '600' },
  rowUrl: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    marginHorizontal: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '55',
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primary + '11',
  },
  addBtnText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
