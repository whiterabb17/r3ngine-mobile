import React from 'react';
import { StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle2, XCircle, Trash2, CheckSquare } from 'lucide-react-native';
import { Text, View } from '../Themed';
import { Theme } from '../../constants/Theme';

interface Props {
  selectedCount: number;
  onBulkPromote: () => void;
  onBulkDiscard: () => void;
  onClearSelection: () => void;
}

export default function StagingActions({ selectedCount, onBulkPromote, onBulkDiscard, onClearSelection }: Props) {
  if (selectedCount === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.selectionInfo}>
        <Text style={styles.countText}>{selectedCount} ITEMS SELECTED</Text>
        <TouchableOpacity onPress={onClearSelection}>
          <Text style={styles.clearText}>CLEAR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.btn, styles.discardBtn]} 
          onPress={onBulkDiscard}
        >
          <Trash2 size={20} color={Theme.colors.error} />
          <Text style={[styles.btnText, { color: Theme.colors.error }]}>DISCARD</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btn, styles.promoteBtn]} 
          onPress={onBulkPromote}
        >
          <CheckSquare size={20} color={Theme.colors.success} />
          <Text style={[styles.btnText, { color: Theme.colors.success }]}>VALIDATE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 10,
    fontFamily: 'Bangers',
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
  clearText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#111',
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    fontFamily: 'Bangers',
    letterSpacing: 0.5,
  },
  discardBtn: {
    borderColor: Theme.colors.error + '44',
  },
  promoteBtn: {
    borderColor: Theme.colors.success + '44',
  },
});
