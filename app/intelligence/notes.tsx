import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { StickyNote, Plus, Filter, X, Check } from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { Theme } from '../../src/constants/Theme';
import apiClient from '../../src/api/client';
import { useProjectStore } from '../../src/store/useProjectStore';
import { ReconNoteCard, ReconNote } from '../../src/components/Intelligence/ReconNoteCard';

export default function ReconNotesScreen() {
  const { currentProject } = useProjectStore();
  const [notes, setNotes] = useState<ReconNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // New note form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!currentProject) return;
    try {
      const response = await apiClient.get(`listTodoNotes/?project=${currentProject}`);
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('Failed to fetch recon notes', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleToggleStatus = async (id: number) => {
    try {
      const response = await apiClient.post('toggle/note/status/', { id });
      if (response.data.status) {
        setNotes(prev => prev.map(note => 
          note.id === id ? { ...note, is_done: response.data.is_done } : note
        ));
      }
    } catch (error) {
      console.error('Failed to toggle note status', error);
      Alert.alert('Error', 'Failed to update note status');
    }
  };

  const handleToggleImportance = async (id: number) => {
    try {
      const response = await apiClient.post('toggle/note/importance/', { id });
      if (response.data.status) {
        setNotes(prev => prev.map(note => 
          note.id === id ? { ...note, is_important: response.data.is_important } : note
        ));
      }
    } catch (error) {
      console.error('Failed to toggle note importance', error);
      Alert.alert('Error', 'Failed to update importance');
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.post('action/note/delete/', { id });
              if (response.data.status) {
                setNotes(prev => prev.filter(note => note.id !== id));
              }
            } catch (error) {
              console.error('Failed to delete note', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  };

  const handleAddNote = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await apiClient.post('add/recon_note/', {
        title: newTitle,
        description: newDescription,
        project: currentProject
      });
      
      if (response.data.status) {
        setNewTitle('');
        setNewDescription('');
        setModalVisible(false);
        fetchNotes();
      } else {
        Alert.alert('Error', response.data.message || 'Failed to add note');
      }
    } catch (error) {
      console.error('Failed to add note', error);
      Alert.alert('Error', 'An error occurred while adding the note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <StickyNote size={48} color={Theme.colors.surface} />
      <Text style={styles.emptyText}>No Recon Notes</Text>
      <Text style={styles.emptySubtext}>
        Keep track of manual findings, TO-DOs, and observations during your engagement.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Recon Notes',
        headerRight: () => (
          <TouchableOpacity style={styles.headerBtn}>
            <Filter size={20} color={Theme.colors.primary} />
          </TouchableOpacity>
        )
      }} />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading annotations...</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={({ item }) => (
            <ReconNoteCard 
              note={item} 
              onToggleStatus={handleToggleStatus}
              onToggleImportance={handleToggleImportance}
              onDelete={handleDelete}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchNotes(); }} 
              tintColor={Theme.colors.primary}
            />
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Recon Note</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief summary..."
                placeholderTextColor="#666"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.inputLabel}>Description / Observations</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detailed notes, exploit details, etc..."
                placeholderTextColor="#666"
                multiline={true}
                numberOfLines={6}
                value={newDescription}
                onChangeText={setNewDescription}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.submitBtn]}
                onPress={handleAddNote}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={18} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.btnText}>Save Note</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    color: Theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'Bangers',
  },
  headerBtn: {
    marginRight: 8,
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    fontFamily: 'Bangers',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 12,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Bangers',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
