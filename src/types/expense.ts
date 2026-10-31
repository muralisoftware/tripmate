export type ExpenseCategory =
  | 'Food'
  | 'Hotel'
  | 'Transport'
  | 'Shopping'
  | 'Activities'
  | 'Other';

export interface Expense {
  id: string;
  tripId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}
