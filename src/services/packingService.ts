import { getData, saveData, STORAGE_KEYS } from './storage';
import { PackingItem } from '../types/itinerary';
import { DEFAULT_PACKING_ITEMS } from '../constants/config';

export const getPackingItems = async (): Promise<PackingItem[]> => {
  return getData<PackingItem[]>(STORAGE_KEYS.PACKING, []);
};

export const getPackingItemsByTrip = async (tripId: string): Promise<PackingItem[]> => {
  const all = await getPackingItems();
  return all.filter((item) => item.tripId === tripId);
};

export const addPackingItem = async (item: PackingItem): Promise<void> => {
  const all = await getPackingItems();
  await saveData(STORAGE_KEYS.PACKING, [...all, item]);
};

export const togglePackingItem = async (id: string): Promise<void> => {
  const all = await getPackingItems();
  const next = all.map((item) =>
    item.id === id ? { ...item, packed: !item.packed } : item
  );
  await saveData(STORAGE_KEYS.PACKING, next);
};

export const deletePackingItem = async (id: string): Promise<void> => {
  const all = await getPackingItems();
  await saveData(
    STORAGE_KEYS.PACKING,
    all.filter((item) => item.id !== id)
  );
};

export const deletePackingByTrip = async (tripId: string): Promise<void> => {
  const all = await getPackingItems();
  await saveData(
    STORAGE_KEYS.PACKING,
    all.filter((item) => item.tripId !== tripId)
  );
};

export const seedDefaultPackingList = async (tripId: string): Promise<void> => {
  const existing = await getPackingItemsByTrip(tripId);
  if (existing.length > 0) return;

  const defaultItems: PackingItem[] = DEFAULT_PACKING_ITEMS.map((item, index) => ({
    id: `pack_${tripId}_${Date.now()}_${index}`,
    tripId,
    name: item.name,
    category: item.category,
    packed: false,
  }));

  const all = await getPackingItems();
  await saveData(STORAGE_KEYS.PACKING, [...all, ...defaultItems]);
};
