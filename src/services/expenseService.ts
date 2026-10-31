import { getData, saveData, STORAGE_KEYS } from './storage';
import { Expense, ExpenseCategory } from '../types/expense';

export const getExpenses = async (): Promise<Expense[]> => {
  return getData<Expense[]>(STORAGE_KEYS.EXPENSES, []);
};

export const getExpensesByTrip = async (tripId: string): Promise<Expense[]> => {
  const all = await getExpenses();
  return all.filter((e) => e.tripId === tripId);
};

export const addExpense = async (expense: Expense): Promise<void> => {
  const all = await getExpenses();
  await saveData(STORAGE_KEYS.EXPENSES, [expense, ...all]);
};

export const updateExpense = async (updated: Expense): Promise<void> => {
  const all = await getExpenses();
  const next = all.map((e) => (e.id === updated.id ? updated : e));
  await saveData(STORAGE_KEYS.EXPENSES, next);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const all = await getExpenses();
  await saveData(
    STORAGE_KEYS.EXPENSES,
    all.filter((e) => e.id !== id)
  );
};

export const deleteExpensesByTrip = async (tripId: string): Promise<void> => {
  const all = await getExpenses();
  await saveData(
    STORAGE_KEYS.EXPENSES,
    all.filter((e) => e.tripId !== tripId)
  );
};

export const calculateTripExpenseTotal = (expenses: Expense[]): number => {
  return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
};

export const calculateExpensesByCategory = (
  expenses: Expense[]
): Record<ExpenseCategory, number> => {
  const categories: Record<ExpenseCategory, number> = {
    Food: 0,
    Hotel: 0,
    Transport: 0,
    Shopping: 0,
    Activities: 0,
    Other: 0,
  };

  expenses.forEach((e) => {
    if (categories[e.category] !== undefined) {
      categories[e.category] += Number(e.amount) || 0;
    } else {
      categories.Other += Number(e.amount) || 0;
    }
  });

  return categories;
};
