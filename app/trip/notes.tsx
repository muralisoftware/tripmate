import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  FileText,
  Trash2,
  Edit3,
  X,
  Check,
  Calendar,
} from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { AppInput } from '../../src/components/common/AppInput';
import { AppButton } from '../../src/components/common/AppButton';
import { EmptyState } from '../../src/components/common/EmptyState';
import { getTripById } from '../../src/services/tripService';
import {
  getNotesByTrip,
  addNote,
  updateNote,
  deleteNote,
} from '../../src/services/noteService';
import { Trip } from '../../src/types/trip';
import { TravelNote } from '../../src/types/note';
import { formatDate } from '../../src/utils/date';

export default function NotesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [notes, setNotes] = useState<TravelNote[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!tripId) return;
    try {
      const [tripData, notesData] = await Promise.all([
        getTripById(tripId),
        getNotesByTrip(tripId),
      ]);
      setTrip(tripData || null);
      setNotes(notesData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleOpenCreate = () => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    setModalVisible(true);
  };

  const handleOpenEdit = (note: TravelNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this travel note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(id);
          loadData();
        },
      },
    ]);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) {
      Alert.alert('Validation', 'Please enter a note title.');
      return;
    }

    setSaving(true);
    try {
      if (editingNoteId) {
        const updated: TravelNote = {
          id: editingNoteId,
          tripId: tripId!,
          title: noteTitle.trim(),
          content: noteContent.trim(),
          updatedAt: new Date().toISOString(),
        };
        await updateNote(updated);
      } else {
        const newNote: TravelNote = {
          id: `note_${Date.now()}`,
          tripId: tripId!,
          title: noteTitle.trim(),
          content: noteContent.trim(),
          updatedAt: new Date().toISOString(),
        };
        await addNote(newNote);
      }

      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Travel Notes & Info"
        subtitle={trip?.title}
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleOpenCreate}
            activeOpacity={0.8}
          >
            <Plus color={COLORS.white} size={18} />
            <Text style={styles.addBtnText}>Note</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {notes.length === 0 ? (
          <EmptyState
            icon={<FileText color={COLORS.primary} size={32} />}
            title="No travel notes yet"
            description="Keep track of hotel confirmations, flight booking codes, Wi-Fi passwords, and local travel advice."
            actionTitle="Create First Note"
            onAction={handleOpenCreate}
          />
        ) : (
          notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleOpenEdit(note)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Edit3 color={COLORS.secondaryText} size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(note.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 color={COLORS.danger} size={16} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.noteContent}>{note.content}</Text>

              <View style={styles.noteFooter}>
                <Calendar color={COLORS.mutedText} size={12} />
                <Text style={styles.updatedText}>
                  Updated {formatDate(note.updatedAt.slice(0, 10))}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Note Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingNoteId ? 'Edit Travel Note' : 'New Travel Note'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={COLORS.secondaryText} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput
                label="Note Title *"
                placeholder="e.g. Hotel Booking Details, Wi-Fi Code"
                value={noteTitle}
                onChangeText={setNoteTitle}
              />

              <AppInput
                label="Content"
                placeholder="Write your notes, reservation codes, emergency numbers..."
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={6}
                style={{ height: 120 }}
              />

              <AppButton
                title={editingNoteId ? 'Update Note' : 'Save Note'}
                onPress={handleSaveNote}
                loading={saving}
                icon={<Check color={COLORS.white} size={18} />}
                style={{ marginTop: 10, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  noteCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  noteContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 21,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  updatedText: {
    fontSize: 11,
    color: COLORS.secondaryText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
});
