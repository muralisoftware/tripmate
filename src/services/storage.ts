import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  TRIPS: '@tripmate/trips',
  EXPENSES: '@tripmate/expenses',
  ITINERARIES: '@tripmate/itineraries',
  PACKING: '@tripmate/packing',
  NOTES: '@tripmate/notes',
  SETTINGS: '@tripmate/settings',
};

export async function getData<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch (error) {
    console.error(`Storage read error for key "${key}":`, error);
    return fallback;
  }
}

export async function saveData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Storage save error for key "${key}":`, error);
    throw error;
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Storage remove error for key "${key}":`, error);
    throw error;
  }
}

export async function clearAllAppData(): Promise<void> {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Storage clear error:', error);
    throw error;
  }
}

export interface BackupData {
  version: string;
  exportedAt: string;
  trips: any[];
  expenses: any[];
  itineraries: any[];
  packing: any[];
  notes: any[];
  settings: any;
}

export async function exportAllData(): Promise<BackupData> {
  const [trips, expenses, itineraries, packing, notes, settings] = await Promise.all([
    getData(STORAGE_KEYS.TRIPS, []),
    getData(STORAGE_KEYS.EXPENSES, []),
    getData(STORAGE_KEYS.ITINERARIES, []),
    getData(STORAGE_KEYS.PACKING, []),
    getData(STORAGE_KEYS.NOTES, []),
    getData(STORAGE_KEYS.SETTINGS, null),
  ]);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    trips,
    expenses,
    itineraries,
    packing,
    notes,
    settings,
  };
}

export async function importAllData(data: BackupData): Promise<void> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup file');
  }

  await Promise.all([
    saveData(STORAGE_KEYS.TRIPS, Array.isArray(data.trips) ? data.trips : []),
    saveData(STORAGE_KEYS.EXPENSES, Array.isArray(data.expenses) ? data.expenses : []),
    saveData(STORAGE_KEYS.ITINERARIES, Array.isArray(data.itineraries) ? data.itineraries : []),
    saveData(STORAGE_KEYS.PACKING, Array.isArray(data.packing) ? data.packing : []),
    saveData(STORAGE_KEYS.NOTES, Array.isArray(data.notes) ? data.notes : []),
    data.settings ? saveData(STORAGE_KEYS.SETTINGS, data.settings) : Promise.resolve(),
  ]);
}
