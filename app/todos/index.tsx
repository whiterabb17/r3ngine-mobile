import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Theme } from '../../src/constants/Theme';
import { useProjectStore } from '../../src/store/useProjectStore';
import { listTodos, createTodo, patchTodo, deleteTodo, Todo } from '../../src/api/todos';
import TodoCard from '../../src/components/Todos/TodoCard';
import AddTodoModal from '../../src/components/Todos/AddTodoModal';

export default function TodoPage() {
  const { currentProject } = useProjectStore();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addVisible, setAddVisible] = useState(false);

  const fetchTodos = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listTodos({ project: currentProject });
      setTodos(data);
    } catch {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, [currentProject]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const handleAdd = async (title: string, description: string) => {
    if (!currentProject) return;
    const todo = await createTodo({ title, description, project: currentProject });
    setTodos((prev) => [todo, ...prev]);
  };

  const handleToggleDone = async (id: number, current: boolean) => {
    const updated = await patchTodo(id, { is_done: !current });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleToggleImportant = async (id: number, current: boolean) => {
    const updated = await patchTodo(id, { is_important: !current });
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Todo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTodo(id);
          setTodos((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const pending = todos.filter((t) => !t.is_done);
  const done = todos.filter((t) => t.is_done);
  const ordered = [...todos.filter(t => t.is_important && !t.is_done), ...pending.filter(t => !t.is_important), ...done];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Todos',
          headerStyle: { backgroundColor: Theme.colors.background },
          headerTintColor: '#fff',
          headerRight: () => (
            <TouchableOpacity onPress={() => setAddVisible(true)} style={styles.addBtn}>
              <Plus size={22} color={Theme.colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      {loading && <ActivityIndicator color={Theme.colors.primary} style={styles.spinner} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && todos.length === 0 && (
        <Text style={styles.empty}>No todos yet. Tap + to add one.</Text>
      )}

      <FlatList
        data={ordered}
        keyExtractor={(t) => String(t.id)}
        renderItem={({ item }) => (
          <TodoCard
            todo={item}
            onToggleDone={handleToggleDone}
            onToggleImportant={handleToggleImportant}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={styles.list}
      />

      <AddTodoModal
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onAdd={handleAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  list: { padding: Theme.spacing.md },
  spinner: { marginTop: Theme.spacing.xl },
  error: { color: Theme.colors.error, textAlign: 'center', marginTop: Theme.spacing.md },
  empty: { color: Theme.colors.textMuted, textAlign: 'center', marginTop: Theme.spacing.xl },
  addBtn: { marginRight: Theme.spacing.sm },
});
