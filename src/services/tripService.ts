import { getData, saveData, STORAGE_KEYS } from './storage';
import { Trip } from '../types/trip';
import { deleteExpensesByTrip } from './expenseService';
import { deleteItinerariesByTrip } from './itineraryService';
import { deletePackingByTrip } from './packingService';
import { deleteNotesByTrip } from './noteService';
import { getTripStatus } from '../utils/date';

export const getTrips = async (): Promise<Trip[]> => {
  const trips = await getData<Trip[]>(STORAGE_KEYS.TRIPS, []);
  // Refresh status dynamically
  return trips.map((t) => ({
    ...t,
    status: getTripStatus(t.startDate, t.endDate),
  }));
};

export const getTripById = async (id: string): Promise<Trip | undefined> => {
  const trips = await getTrips();
  return trips.find((t) => t.id === id);
};

export const addTrip = async (trip: Trip): Promise<void> => {
  const trips = await getTrips();
  await saveData(STORAGE_KEYS.TRIPS, [trip, ...trips]);
};

export const updateTrip = async (updatedTrip: Trip): Promise<void> => {
  const trips = await getTrips();
  const updated = trips.map((trip) =>
    trip.id === updatedTrip.id
      ? {
          ...updatedTrip,
          status: getTripStatus(updatedTrip.startDate, updatedTrip.endDate),
        }
      : trip
  );
  await saveData(STORAGE_KEYS.TRIPS, updated);
};

export const deleteTrip = async (id: string): Promise<void> => {
  const trips = await getTrips();
  await saveData(
    STORAGE_KEYS.TRIPS,
    trips.filter((trip) => trip.id !== id)
  );

  // Cascade delete all trip-associated records
  await Promise.all([
    deleteExpensesByTrip(id),
    deleteItinerariesByTrip(id),
    deletePackingByTrip(id),
    deleteNotesByTrip(id),
  ]);
};
