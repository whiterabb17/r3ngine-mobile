import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '../../constants/Theme';

export interface ReconNote {
  id: number;
  title: string;
  description: string;
  is_done: boolean;
  is_important: boolean;
  subdomain?: {
    id: number;
    name: string;
  };
  scan_history?: {
    id: number;
    target_domain: {
      name: string;
    };
  };
}

interface ReconNoteCardProps {
  note: ReconNote;
  onToggleStatus: (id: number) => void;
  onToggleImportance: (id: number) => void;
  onDelete: (id: number) => void;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ReconNoteCard: React.FC<ReconNoteCardProps> = ({
  note,
  onToggleStatus,
  onToggleImportance,
  onDelete,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => onToggleStatus(note.id)}
            style={styles.statusButton}
          >
            <MaterialCommunityIcons
              name={note.is_done ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={note.is_done ? '#4CAF50' : '#888'}
            />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                note.is_done && styles.completedText,
              ]}
              numberOfLines={1}
            >
              {note.title || 'No Title'}
            </Text>
            {note.subdomain && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{note.subdomain.name}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onToggleImportance(note.id)}
            style={styles.importanceButton}
          >
            <MaterialCommunityIcons
              name={note.is_important ? 'star' : 'star-outline'}
              size={24}
              color={note.is_important ? '#FFD700' : '#888'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text
            style={[
              styles.description,
              note.is_done && styles.completedText,
            ]}
            numberOfLines={3}
          >
            {note.description || 'No description provided.'}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.metaInfo}>
            {note.scan_history?.target_domain?.name && (
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="target" size={12} color="#aaa" />
                <Text style={styles.metaText}>{note.scan_history.target_domain.name}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => onDelete(note.id)}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: Theme.colors.surface,
  },
  innerContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusButton: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  badge: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  badgeText: {
    color: '#FF6B6B',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  importanceButton: {
    marginLeft: 12,
  },
  content: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
  },
});
