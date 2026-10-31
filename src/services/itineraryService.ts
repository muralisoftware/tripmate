import { getData, saveData, STORAGE_KEYS } from './storage';
import { Itinerary } from '../types/itinerary';

export const getItineraries = async (): Promise<Itinerary[]> => {
  return getData<Itinerary[]>(STORAGE_KEYS.ITINERARIES, []);
};

export const getItinerariesByTrip = async (tripId: string): Promise<Itinerary[]> => {
  const all = await getItineraries();
  return all
    .filter((item) => item.tripId === tripId)
    .sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) {
        return a.dayNumber - b.dayNumber;
      }
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
};

export const addItinerary = async (item: Itinerary): Promise<void> => {
  const all = await getItineraries();
  await saveData(STORAGE_KEYS.ITINERARIES, [...all, item]);
};

export const updateItinerary = async (updated: Itinerary): Promise<void> => {
  const all = await getItineraries();
  const next = all.map((item) => (item.id === updated.id ? updated : item));
  await saveData(STORAGE_KEYS.ITINERARIES, next);
};

export const toggleItineraryComplete = async (id: string): Promise<void> => {
  const all = await getItineraries();
  const next = all.map((item) =>
    item.id === id ? { ...item, completed: !item.completed } : item
  );
  await saveData(STORAGE_KEYS.ITINERARIES, next);
};

export const deleteItinerary = async (id: string): Promise<void> => {
  const all = await getItineraries();
  await saveData(
    STORAGE_KEYS.ITINERARIES,
    all.filter((item) => item.id !== id)
  );
};

export const deleteItinerariesByTrip = async (tripId: string): Promise<void> => {
  const all = await getItineraries();
  await saveData(
    STORAGE_KEYS.ITINERARIES,
    all.filter((item) => item.tripId !== tripId)
  );
};
