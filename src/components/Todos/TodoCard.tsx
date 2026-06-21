import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle, Circle, Star, Trash2 } from 'lucide-react-native';
import { Theme } from '../../constants/Theme';
import { Todo } from '../../api/todos';

interface Props {
  todo: Todo;
  onToggleDone: (id: number, current: boolean) => void;
  onToggleImportant: (id: number, current: boolean) => void;
  onDelete: (id: number) => void;
}

export default function TodoCard({ todo, onToggleDone, onToggleImportant, onDelete }: Props) {
  return (
    <View style={[styles.card, todo.is_done && styles.cardDone]}>
      <TouchableOpacity onPress={() => onToggleDone(todo.id, todo.is_done)} style={styles.checkBtn}>
        {todo.is_done
          ? <CheckCircle size={22} color={Theme.colors.success} />
          : <Circle size={22} color={Theme.colors.textMuted} />
        }
      </TouchableOpacity>

      <View style={styles.body}>
        <Text style={[styles.title, todo.is_done && styles.titleDone]} numberOfLines={2}>
          {todo.title}
        </Text>
        {!!todo.description && (
          <Text style={styles.desc} numberOfLines={2}>{todo.description}</Text>
        )}
        {!!todo.domain_name && (
          <Text style={styles.meta}>{todo.domain_name}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onToggleImportant(todo.id, todo.is_important)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Star
            size={18}
            color={todo.is_important ? Theme.colors.warning : Theme.colors.textMuted}
            fill={todo.is_important ? Theme.colors.warning : 'none'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(todo.id)}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={16} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.colors.border,
  },
  cardDone: { opacity: 0.55 },
  checkBtn: { paddingRight: Theme.spacing.sm },
  body: { flex: 1 },
  title: { color: Theme.colors.text, fontSize: 14, fontWeight: '500' },
  titleDone: { textDecorationLine: 'line-through', color: Theme.colors.textMuted },
  desc: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  meta: { color: Theme.colors.primary, fontSize: 11, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, paddingLeft: Theme.spacing.sm },
  deleteBtn: { marginLeft: Theme.spacing.xs },
});
