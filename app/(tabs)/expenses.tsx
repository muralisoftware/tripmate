import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Plus,
  Wallet,
  TrendingUp,
  PieChart,
  X,
  Check,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { EXPENSE_CATEGORIES } from '../../src/constants/config';
import { getTrips } from '../../src/services/tripService';
import {
  getExpenses,
  addExpense,
  deleteExpense,
  calculateExpensesByCategory,
} from '../../src/services/expenseService';
import { Trip } from '../../src/types/trip';
import { Expense, ExpenseCategory } from '../../src/types/expense';
import { ExpenseCard } from '../../src/components/expense/ExpenseCard';
import { EmptyState } from '../../src/components/common/EmptyState';
import { formatCurrency } from '../../src/utils/currency';
import { getTodayDateString } from '../../src/utils/date';
import { AppInput } from '../../src/components/common/AppInput';
import { AppButton } from '../../src/components/common/AppButton';

export default function ExpensesScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Add Expense Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('Food');
  const [newTripId, setNewTripId] = useState('');
  const [newDate, setNewDate] = useState(getTodayDateString());
  const [newNotes, setNewNotes] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allTrips, allExpenses] = await Promise.all([
        getTrips(),
        getExpenses(),
      ]);
      setTrips(allTrips);
      setExpenses(allExpenses);
      if (allTrips.length > 0 && !newTripId) {
        setNewTripId(allTrips[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [newTripId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredExpenses = useMemo(() => {
    if (selectedTripId === 'all') return expenses;
    return expenses.filter((e) => e.tripId === selectedTripId);
  }, [expenses, selectedTripId]);

  const selectedTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId);
  }, [trips, selectedTripId]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalBudget = useMemo(() => {
    if (selectedTripId === 'all') {
      return trips.reduce((sum, t) => sum + (Number(t.budget) || 0), 0);
    }
    return selectedTrip?.budget || 0;
  }, [trips, selectedTrip, selectedTripId]);

  const categoryTotals = useMemo(() => {
    return calculateExpensesByCategory(filteredExpenses);
  }, [filteredExpenses]);

  const currencyCode = selectedTrip?.currency || 'INR';

  const handleDeleteExpense = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to remove this expense record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(id);
          loadData();
        },
      },
    ]);
  };

  const handleOpenAddModal = () => {
    if (trips.length === 0) {
      Alert.alert('No Trips Found', 'Please create a trip first before adding expenses.');
      return;
    }
    setNewTripId(selectedTripId !== 'all' ? selectedTripId : trips[0].id);
    setNewTitle('');
    setNewAmount('');
    setNewNotes('');
    setNewDate(getTodayDateString());
    setModalVisible(true);
  };

  const handleSaveExpense = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation', 'Please enter a title for the expense.');
      return;
    }
    const amt = Number(newAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Validation', 'Please enter a valid amount.');
      return;
    }
    if (!newTripId) {
      Alert.alert('Validation', 'Please select a trip.');
      return;
    }

    setSavingExpense(true);
    try {
      const expenseItem: Expense = {
        id: `exp_${Date.now()}`,
        tripId: newTripId,
        title: newTitle.trim(),
        category: newCategory,
        amount: amt,
        date: newDate || getTodayDateString(),
        notes: newNotes.trim() || undefined,
      };

      await addExpense(expenseItem);
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save expense.');
    } finally {
      setSavingExpense(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const budgetUsagePercent =
    totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>Expense Manager</Text>
          <Text style={styles.screenSubtitle}>
            Track budgets and spending
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
        >
          <Plus color={COLORS.white} size={20} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Trip selector chips */}
      <View style={styles.tripFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tripChipsScroll}
        >
          <TouchableOpacity
            style={[
              styles.tripChip,
              selectedTripId === 'all' && styles.tripChipActive,
            ]}
            onPress={() => setSelectedTripId('all')}
          >
            <Text
              style={[
                styles.tripChipText,
                selectedTripId === 'all' && styles.tripChipTextActive,
              ]}
            >
              All Trips
            </Text>
          </TouchableOpacity>

          {trips.map((t) => {
            const isSelected = selectedTripId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tripChip, isSelected && styles.tripChipActive]}
                onPress={() => setSelectedTripId(t.id)}
              >
                <Text
                  style={[
                    styles.tripChipText,
                    isSelected && styles.tripChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {t.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget vs Actual Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={styles.spentAmount}>
                {formatCurrency(totalSpent, currencyCode)}
              </Text>
            </View>
            <View style={styles.budgetRight}>
              <Text style={styles.summaryLabel}>Planned Budget</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(totalBudget, currencyCode)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${budgetUsagePercent}%`,
                  backgroundColor:
                    budgetUsagePercent > 90 ? COLORS.danger : COLORS.primary,
                },
              ]}
            />
          </View>

          <View style={styles.progressMeta}>
            <Text style={styles.progressText}>
              {budgetUsagePercent}% of budget used
            </Text>
            <Text style={styles.remainingText}>
              {totalBudget - totalSpent >= 0
                ? `${formatCurrency(totalBudget - totalSpent, currencyCode)} remaining`
                : `${formatCurrency(Math.abs(totalBudget - totalSpent), currencyCode)} over budget`}
            </Text>
          </View>
        </View>

        {/* Category Breakdown */}
        {totalSpent > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.cardHeader}>Spending by Category</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const amount = categoryTotals[cat] || 0;
                const percent =
                  totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                return (
                  <View key={cat} style={styles.categoryItem}>
                    <View style={styles.catNameRow}>
                      <Text style={styles.catName}>{cat}</Text>
                      <Text style={styles.catAmount}>
                        {formatCurrency(amount, currencyCode)}
                      </Text>
                    </View>
                    <View style={styles.catBarBackground}>
                      <View
                        style={[
                          styles.catBarFill,
                          { width: `${percent}%` },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Expenses List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeader}>Recent Expenses</Text>
          <Text style={styles.listCount}>
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {filteredExpenses.length === 0 ? (
          <EmptyState
            icon={<Wallet color={COLORS.primary} size={30} />}
            title="No expenses recorded"
            description="Keep your travel budget on track by logging flight tickets, food, accommodation, and shopping."
            actionTitle="Log Expense"
            onAction={handleOpenAddModal}
          />
        ) : (
          filteredExpenses.map((exp) => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              currency={currencyCode}
              onDelete={handleDeleteExpense}
            />
          ))
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Travel Expense</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={COLORS.secondaryText} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Trip selector */}
              <Text style={styles.inputLabel}>Associate with Trip</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.modalTripsScroll}
              >
                {trips.map((t) => {
                  const isChosen = newTripId === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.modalTripPill,
                        isChosen && styles.modalTripPillActive,
                      ]}
                      onPress={() => setNewTripId(t.id)}
                    >
                      <Text
                        style={[
                          styles.modalTripPillText,
                          isChosen && styles.modalTripPillTextActive,
                        ]}
                      >
                        {t.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Category picker */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoriesRow}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected = newCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.catOption,
                        isSelected && styles.catOptionActive,
                      ]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          isSelected && styles.catOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppInput
                label="Expense Title *"
                placeholder="e.g. Lunch at seaside cafe, Metro tickets"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <AppInput
                label="Amount *"
                placeholder="e.g. 1500"
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="numeric"
              />

              <AppInput
                label="Date (YYYY-MM-DD)"
                placeholder="YYYY-MM-DD"
                value={newDate}
                onChangeText={setNewDate}
                leftIcon={<Calendar color={COLORS.primary} size={18} />}
              />

              <AppInput
                label="Notes (Optional)"
                placeholder="e.g. Paid via travel card, included tip"
                value={newNotes}
                onChangeText={setNewNotes}
                multiline
              />

              <View style={styles.modalBtnRow}>
                <AppButton
                  title="Save Expense"
                  onPress={handleSaveExpense}
                  loading={savingExpense}
                  icon={<Check color={COLORS.white} size={18} />}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  screenSubtitle: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  tripFilterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tripChipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tripChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tripChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tripChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  tripChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  spentAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  budgetRight: {
    alignItems: 'flex-end',
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondaryText,
    marginTop: 6,
  },
  progressContainer: {
    height: 10,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  categoryGrid: {
    gap: 10,
  },
  categoryItem: {
    gap: 4,
  },
  catNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  catBarBackground: {
    height: 6,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  listCount: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '500',
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
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  modalTripsScroll: {
    marginBottom: 14,
  },
  modalTripPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSubtle,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTripPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  modalTripPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  modalTripPillTextActive: {
    color: COLORS.primaryDark,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  catOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catOptionActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  catOptionText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  catOptionTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  modalBtnRow: {
    marginTop: 10,
    marginBottom: 20,
  },
});
