import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MoreVertical, Layers, Map, Download, Trash2, X } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import apiClient from '../../api/client';

interface ScanActionMenuProps {
  scanId: number;
  slug: string;
  scanStatus: number;
  domainName?: string;
  onStopScan: () => void;
  onRefresh: () => void;
}

export default function ScanActionMenu({
  scanId,
  slug,
  scanStatus,
  domainName,
  onStopScan: _onStopScan,
  onRefresh: _onRefresh,
}: ScanActionMenuProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [exporting, setExporting] = useState(false);

  const open = () => setVisible(true);
  const close = () => setVisible(false);

  const handleViewSubScans = () => {
    close();
    router.push({
      pathname: '/scan/subscans',
      params: { scanHistoryId: String(scanId), domainName: domainName ?? '' },
    } as any);
  };

  const handleViewAttackSurface = () => {
    close();
    router.push({
      pathname: `/scan/attack-surface/${scanId}`,
      params: { domainName: domainName ?? '' },
    } as any);
  };

  const handleExportAi = async () => {
    close();
    setExporting(true);
    try {
      await apiClient.post(`/mapi/scan-summary/${slug}/${scanId}/export-ai/`, {
        preset: 'analyst_assist',
        include_raw_outputs: false,
        include_timeline: true,
        include_sidecars: true,
      });
      Alert.alert(
        'AI Export Queued',
        'The AI export bundle has been triggered. Download it from the web interface under the scan detail page.',
      );
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? 'Export failed';
      Alert.alert('Export Error', msg);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteScan = () => {
    close();
    Alert.alert(
      'Delete Scan',
      'Permanently delete this scan and all its findings? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post(`/mapi/listScans/${scanId}/delete_scan/`);
              router.back();
            } catch {
              Alert.alert('Error', 'Failed to delete scan');
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={open}
        style={styles.triggerBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {exporting ? (
          <ActivityIndicator size="small" color={Theme.colors.primary} />
        ) : (
          <MoreVertical size={22} color={Theme.colors.text} />
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <TouchableWithoutFeedback onPress={close}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Scan Actions</Text>

          <TouchableOpacity style={styles.action} onPress={handleViewSubScans}>
            <Layers size={18} color={Theme.colors.accent} />
            <Text style={styles.actionText}>View Sub Scans</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={handleViewAttackSurface}>
            <Map size={18} color={Theme.colors.info} />
            <Text style={styles.actionText}>Attack Surface Map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} onPress={handleExportAi}>
            <Download size={18} color={Theme.colors.success} />
            <Text style={styles.actionText}>Export AI Bundle</Text>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.action} onPress={handleDeleteScan}>
            <Trash2 size={18} color={Theme.colors.error} />
            <Text style={[styles.actionText, { color: Theme.colors.error }]}>Delete Scan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.action, styles.cancelAction]} onPress={close}>
            <X size={18} color={Theme.colors.textMuted} />
            <Text style={[styles.actionText, { color: Theme.colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    padding: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.border,
    alignSelf: 'center',
    marginBottom: Theme.spacing.md,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
  },
  actionText: {
    fontSize: 15,
    color: Theme.colors.text,
    fontWeight: '600',
  },
  separator: {
    height: Theme.spacing.sm,
  },
  cancelAction: {
    borderBottomWidth: 0,
  },
});
