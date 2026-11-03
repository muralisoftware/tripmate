export interface TripMember {
  id: string;
  tripId: string;
  name: string;
  phone?: string;
  email?: string;
  avatarColor?: string;
  createdAt: string;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface FoodExpenseEntry {
  id: string;
  tripId: string;
  memberId: string;
  memberName: string;
  mealType: MealType;
  amount: number;
  date: string;
  description?: string;
  notes?: string;
  createdAt: string;
}

export type GroupExpenseCategory =
  | 'Food'
  | 'Hotel'
  | 'Transport'
  | 'Shopping'
  | 'Tickets'
  | 'Other';

export type SplitType = 'individual' | 'equal' | 'custom';

export interface ExpenseSplit {
  memberId: string;
  memberName: string;
  amount: number;
}

export interface GroupExpense {
  id: string;
  tripId: string;
  title: string;
  category: GroupExpenseCategory;
  amount: number;
  paidByMemberId: string;
  paidByMemberName: string;
  date: string;
  splitType: SplitType;
  splits: ExpenseSplit[];
  notes?: string;
  receiptUri?: string;
  createdAt: string;
}

export interface AdvancePayment {
  id: string;
  tripId: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  paymentMethod?: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';
  notes?: string;
  createdAt: string;
}

export interface MemberExpenseSummary {
  member: TripMember;
  foodTotal: number;
  hotelTotal: number;
  transportTotal: number;
  shoppingTotal: number;
  ticketsTotal: number;
  otherTotal: number;
  totalExpense: number; // total share of expenses (food + group splits)
  advancePaid: number;  // total advance money paid
  paidDirectly: number; // expenses this member paid upfront for the group
  balance: number;      // totalExpense - advancePaid (individual balance)
  netBalance: number;   // (paidDirectly + advancePaid) - totalExpense (positive: receive, negative: owes)
}

export interface Settlement {
  id: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  settled: boolean;
}

export interface GroupSummary {
  totalExpenses: number;
  totalFoodExpenses: number;
  totalHotelExpenses: number;
  totalTransportExpenses: number;
  totalShoppingExpenses: number;
  totalTicketsExpenses: number;
  totalOtherExpenses: number;
  totalAdvancePaid: number;
  totalPendingBalance: number;
  categoryTotals: Record<GroupExpenseCategory, number>;
  memberSummaries: MemberExpenseSummary[];
  settlements: Settlement[];
}
