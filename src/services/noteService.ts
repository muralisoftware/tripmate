import { getData, saveData, STORAGE_KEYS } from './storage';
import { TravelNote } from '../types/note';

export const getNotes = async (): Promise<TravelNote[]> => {
  return getData<TravelNote[]>(STORAGE_KEYS.NOTES, []);
};

export const getNotesByTrip = async (tripId: string): Promise<TravelNote[]> => {
  const all = await getNotes();
  return all.filter((note) => note.tripId === tripId);
};

export const addNote = async (note: TravelNote): Promise<void> => {
  const all = await getNotes();
  await saveData(STORAGE_KEYS.NOTES, [note, ...all]);
};

export const updateNote = async (updated: TravelNote): Promise<void> => {
  const all = await getNotes();
  const next = all.map((n) => (n.id === updated.id ? updated : n));
  await saveData(STORAGE_KEYS.NOTES, next);
};

export const deleteNote = async (id: string): Promise<void> => {
  const all = await getNotes();
  await saveData(
    STORAGE_KEYS.NOTES,
    all.filter((n) => n.id !== id)
  );
};

export const deleteNotesByTrip = async (tripId: string): Promise<void> => {
  const all = await getNotes();
  await saveData(
    STORAGE_KEYS.NOTES,
    all.filter((n) => n.tripId !== tripId)
  );
};
