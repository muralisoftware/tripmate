import { getData, saveData, STORAGE_KEYS } from './storage';
import {
  TripMember,
  FoodExpenseEntry,
  GroupExpense,
  AdvancePayment,
  Settlement,
  GroupSummary,
  MemberExpenseSummary,
  GroupExpenseCategory,
} from '../types/groupExpense';

// ==========================================
// MEMBER SERVICES
// ==========================================

export async function getAllMembers(): Promise<TripMember[]> {
  return getData<TripMember[]>(STORAGE_KEYS.MEMBERS, []);
}

export async function getMembersByTrip(tripId: string): Promise<TripMember[]> {
  const members = await getAllMembers();
  return members.filter((m) => m.tripId === tripId);
}

export async function addMember(member: TripMember): Promise<void> {
  const members = await getAllMembers();
  await saveData(STORAGE_KEYS.MEMBERS, [...members, member]);
}

export async function updateMember(updatedMember: TripMember): Promise<void> {
  const members = await getAllMembers();
  const updated = members.map((m) =>
    m.id === updatedMember.id ? updatedMember : m
  );
  await saveData(STORAGE_KEYS.MEMBERS, updated);
}

export async function deleteMember(id: string): Promise<void> {
  const members = await getAllMembers();
  await saveData(
    STORAGE_KEYS.MEMBERS,
    members.filter((m) => m.id !== id)
  );

  // Clean up food expenses for this member
  const foodExpenses = await getAllFoodExpenses();
  await saveData(
    STORAGE_KEYS.FOOD_EXPENSES,
    foodExpenses.filter((f) => f.memberId !== id)
  );

  // Clean up advances for this member
  const advances = await getAllAdvances();
  await saveData(
    STORAGE_KEYS.ADVANCES,
    advances.filter((a) => a.memberId !== id)
  );
}

// ==========================================
// FOOD EXPENSE SERVICES
// ==========================================

export async function getAllFoodExpenses(): Promise<FoodExpenseEntry[]> {
  return getData<FoodExpenseEntry[]>(STORAGE_KEYS.FOOD_EXPENSES, []);
}

export async function getFoodExpensesByTrip(tripId: string): Promise<FoodExpenseEntry[]> {
  const items = await getAllFoodExpenses();
  return items.filter((item) => item.tripId === tripId);
}

export async function addFoodExpense(entry: FoodExpenseEntry): Promise<void> {
  const items = await getAllFoodExpenses();
  await saveData(STORAGE_KEYS.FOOD_EXPENSES, [entry, ...items]);
}

export async function addMultipleFoodExpenses(entries: FoodExpenseEntry[]): Promise<void> {
  const items = await getAllFoodExpenses();
  await saveData(STORAGE_KEYS.FOOD_EXPENSES, [...entries, ...items]);
}

export async function updateFoodExpense(updated: FoodExpenseEntry): Promise<void> {
  const items = await getAllFoodExpenses();
  const updatedList = items.map((i) => (i.id === updated.id ? updated : i));
  await saveData(STORAGE_KEYS.FOOD_EXPENSES, updatedList);
}

export async function deleteFoodExpense(id: string): Promise<void> {
  const items = await getAllFoodExpenses();
  await saveData(
    STORAGE_KEYS.FOOD_EXPENSES,
    items.filter((i) => i.id !== id)
  );
}

// ==========================================
// GROUP EXPENSE SERVICES
// ==========================================

export async function getAllGroupExpenses(): Promise<GroupExpense[]> {
  return getData<GroupExpense[]>(STORAGE_KEYS.GROUP_EXPENSES, []);
}

export async function getGroupExpensesByTrip(tripId: string): Promise<GroupExpense[]> {
  const items = await getAllGroupExpenses();
  return items.filter((item) => item.tripId === tripId);
}

export async function addGroupExpense(expense: GroupExpense): Promise<void> {
  const items = await getAllGroupExpenses();
  await saveData(STORAGE_KEYS.GROUP_EXPENSES, [expense, ...items]);
}

export async function updateGroupExpense(updated: GroupExpense): Promise<void> {
  const items = await getAllGroupExpenses();
  const updatedList = items.map((i) => (i.id === updated.id ? updated : i));
  await saveData(STORAGE_KEYS.GROUP_EXPENSES, updatedList);
}

export async function deleteGroupExpense(id: string): Promise<void> {
  const items = await getAllGroupExpenses();
  await saveData(
    STORAGE_KEYS.GROUP_EXPENSES,
    items.filter((i) => i.id !== id)
  );
}

// ==========================================
// ADVANCE PAYMENT SERVICES
// ==========================================

export async function getAllAdvances(): Promise<AdvancePayment[]> {
  return getData<AdvancePayment[]>(STORAGE_KEYS.ADVANCES, []);
}

export async function getAdvancesByTrip(tripId: string): Promise<AdvancePayment[]> {
  const items = await getAllAdvances();
  return items.filter((item) => item.tripId === tripId);
}

export async function addAdvancePayment(advance: AdvancePayment): Promise<void> {
  const items = await getAllAdvances();
  await saveData(STORAGE_KEYS.ADVANCES, [advance, ...items]);
}

export async function updateAdvancePayment(updated: AdvancePayment): Promise<void> {
  const items = await getAllAdvances();
  const updatedList = items.map((i) => (i.id === updated.id ? updated : i));
  await saveData(STORAGE_KEYS.ADVANCES, updatedList);
}

export async function deleteAdvancePayment(id: string): Promise<void> {
  const items = await getAllAdvances();
  await saveData(
    STORAGE_KEYS.ADVANCES,
    items.filter((i) => i.id !== id)
  );
}

// ==========================================
// SETTLEMENT STATUS SERVICES
// ==========================================

export async function getAllSettlements(): Promise<Settlement[]> {
  return getData<Settlement[]>(STORAGE_KEYS.SETTLEMENTS, []);
}

export async function toggleSettlementStatus(settlementId: string): Promise<void> {
  const items = await getAllSettlements();
  const updated = items.map((s) =>
    s.id === settlementId ? { ...s, settled: !s.settled } : s
  );
  await saveData(STORAGE_KEYS.SETTLEMENTS, updated);
}

// ==========================================
// SETTLEMENT & SUMMARY ENGINE
// ==========================================

export function calculateGroupSummary(
  members: TripMember[],
  groupExpenses: GroupExpense[],
  foodExpenses: FoodExpenseEntry[],
  advances: AdvancePayment[],
  existingSettlements: Settlement[] = []
): GroupSummary {
  const categoryTotals: Record<GroupExpenseCategory, number> = {
    Food: 0,
    Hotel: 0,
    Transport: 0,
    Shopping: 0,
    Tickets: 0,
    Other: 0,
  };

  // Add all food expenses into categoryTotals['Food']
  const totalFoodExpenses = foodExpenses.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  categoryTotals.Food += totalFoodExpenses;

  // Add group expenses to categoryTotals
  let groupExpensesTotal = 0;
  for (const exp of groupExpenses) {
    const amt = Number(exp.amount) || 0;
    groupExpensesTotal += amt;
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += amt;
    } else {
      categoryTotals.Other += amt;
    }
  }

  const totalExpenses = totalFoodExpenses + groupExpensesTotal;
  const totalAdvancePaid = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // Build member summaries
  const memberSummaries: MemberExpenseSummary[] = members.map((member) => {
    // 1. Food total for this member
    const memberFood = foodExpenses
      .filter((f) => f.memberId === member.id)
      .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

    // 2. Category totals from group expenses splits
    let hotelTotal = 0;
    let transportTotal = 0;
    let shoppingTotal = 0;
    let ticketsTotal = 0;
    let otherTotal = 0;
    let groupShareTotal = 0;

    for (const exp of groupExpenses) {
      const splits = exp.splits || [];
      const split = splits.find((s) => s.memberId === member.id);
      if (split) {
        const splitAmt = Number(split.amount) || 0;
        groupShareTotal += splitAmt;
        switch (exp.category) {
          case 'Hotel':
            hotelTotal += splitAmt;
            break;
          case 'Transport':
            transportTotal += splitAmt;
            break;
          case 'Shopping':
            shoppingTotal += splitAmt;
            break;
          case 'Tickets':
            ticketsTotal += splitAmt;
            break;
          case 'Food':
            // If logged as group food split
            break;
          default:
            otherTotal += splitAmt;
            break;
        }
      }
    }

    const totalExpense = memberFood + groupShareTotal;

    // 3. Advance paid by this member
    const advancePaid = advances
      .filter((a) => a.memberId === member.id)
      .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    // 4. Upfront group payments made by this member
    const paidDirectly = groupExpenses
      .filter((exp) => exp.paidByMemberId === member.id)
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    // Final balance according to user specification:
    // Final Balance = Individual Total Expense - Advance Paid
    const balance = totalExpense - advancePaid;

    // Net balance for settlement calculation:
    // (Money put in = paidDirectly + advancePaid) - (Money owed = totalExpense)
    const netBalance = paidDirectly + advancePaid - totalExpense;

    return {
      member,
      foodTotal: memberFood,
      hotelTotal,
      transportTotal,
      shoppingTotal,
      ticketsTotal,
      otherTotal,
      totalExpense,
      advancePaid,
      paidDirectly,
      balance,
      netBalance,
    };
  });

  const totalPendingBalance = memberSummaries.reduce(
    (sum, m) => sum + Math.max(0, m.balance),
    0
  );

  // Settlement Algorithm (Debt Minimization)
  // Match debtors (netBalance < -0.01) with creditors (netBalance > 0.01)
  const debtors = memberSummaries
    .filter((m) => m.netBalance < -0.01)
    .map((m) => ({
      id: m.member.id,
      name: m.member.name,
      amountOwed: Math.abs(m.netBalance),
    }))
    .sort((a, b) => b.amountOwed - a.amountOwed);

  const creditors = memberSummaries
    .filter((m) => m.netBalance > 0.01)
    .map((m) => ({
      id: m.member.id,
      name: m.member.name,
      amountToReceive: m.netBalance,
    }))
    .sort((a, b) => b.amountToReceive - a.amountToReceive);

  const calculatedSettlements: Settlement[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const payment = Math.min(debtor.amountOwed, creditor.amountToReceive);

    if (payment > 0.01) {
      const settlementId = `settle_${debtor.id}_${creditor.id}`;
      const existing = existingSettlements.find((s) => s.id === settlementId);

      calculatedSettlements.push({
        id: settlementId,
        fromMemberId: debtor.id,
        fromMemberName: debtor.name,
        toMemberId: creditor.id,
        toMemberName: creditor.name,
        amount: Math.round(payment * 100) / 100,
        settled: existing ? existing.settled : false,
      });

      debtor.amountOwed -= payment;
      creditor.amountToReceive -= payment;
    }

    if (debtor.amountOwed <= 0.01) dIdx++;
    if (creditor.amountToReceive <= 0.01) cIdx++;
  }

  return {
    totalExpenses,
    totalFoodExpenses,
    totalHotelExpenses: categoryTotals.Hotel,
    totalTransportExpenses: categoryTotals.Transport,
    totalShoppingExpenses: categoryTotals.Shopping,
    totalTicketsExpenses: categoryTotals.Tickets,
    totalOtherExpenses: categoryTotals.Other,
    totalAdvancePaid,
    totalPendingBalance,
    categoryTotals,
    memberSummaries,
    settlements: calculatedSettlements,
  };
}
