import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users,
  Plus,
  UtensilsCrossed,
  Receipt,
  Wallet,
  ArrowRightLeft,
  Share2,
  FileDown,
  Trash2,
  Edit3,
  Calendar,
  Phone,
  Mail,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  X,
  UserPlus,
  ChevronRight,
  PieChart,
  Layers,
  Sparkles,
} from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { AppInput } from '../../src/components/common/AppInput';
import { AppButton } from '../../src/components/common/AppButton';
import { EmptyState } from '../../src/components/common/EmptyState';

import { getTripById, getTrips } from '../../src/services/tripService';
import {
  getMembersByTrip,
  addMember,
  updateMember,
  deleteMember,
  getFoodExpensesByTrip,
  addFoodExpense,
  addMultipleFoodExpenses,
  deleteFoodExpense,
  getGroupExpensesByTrip,
  addGroupExpense,
  deleteGroupExpense,
  getAdvancesByTrip,
  addAdvancePayment,
  deleteAdvancePayment,
  calculateGroupSummary,
  getAllSettlements,
  toggleSettlementStatus,
} from '../../src/services/groupExpenseService';
import { exportGroupExpensePdf } from '../../src/services/pdfReportService';
import { exportGroupExpenseExcel } from '../../src/services/excelExportService';

import { Trip } from '../../src/types/trip';
import {
  TripMember,
  FoodExpenseEntry,
  GroupExpense,
  AdvancePayment,
  MealType,
  GroupExpenseCategory,
  SplitType,
  ExpenseSplit,
  GroupSummary,
} from '../../src/types/groupExpense';
import { formatCurrency } from '../../src/utils/currency';
import { getTodayDateString } from '../../src/utils/date';

type ActiveTab = 'dashboard' | 'food' | 'expenses' | 'members' | 'settlement';

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const CATEGORIES: GroupExpenseCategory[] = [
  'Food',
  'Hotel',
  'Transport',
  'Shopping',
  'Tickets',
  'Other',
];

const MEMBER_COLORS = [
  '#059669', // Emerald
  '#0284C7', // Sky
  '#7C3AED', // Purple
  '#D97706', // Amber
  '#DC2626', // Red
  '#0D9488', // Teal
  '#4F46E5', // Indigo
];

export default function GroupExpensesScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // Core Data
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [foodExpenses, setFoodExpenses] = useState<FoodExpenseEntry[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [advances, setAdvances] = useState<AdvancePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Search & Filter State
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>('all');

  // Keyboard offset state for modals
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ==========================================
  // MODAL STATES
  // ==========================================

  // 1. Member Modal
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<TripMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberEmail, setMemberEmail] = useState('');

  // 2. Food Expense Modal (Supports Single & Batch Entry)
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [foodEntryMode, setFoodEntryMode] = useState<'batch' | 'single'>('batch');
  const [foodMealType, setFoodMealType] = useState<MealType>('Lunch');
  const [foodDate, setFoodDate] = useState(getTodayDateString());
  const [foodDesc, setFoodDesc] = useState('');
  const [foodNotes, setFoodNotes] = useState('');
  // For Single Entry:
  const [singleFoodMemberId, setSingleFoodMemberId] = useState('');
  const [singleFoodAmount, setSingleFoodAmount] = useState('');
  // For Batch Entry: Map of memberId -> amount string
  const [batchFoodAmounts, setBatchFoodAmounts] = useState<Record<string, string>>({});

  // 3. Group Expense Modal
  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<GroupExpenseCategory>('Hotel');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(getTodayDateString());
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitType, setExpSplitType] = useState<SplitType>('equal');
  const [expSelectedMembers, setExpSelectedMembers] = useState<string[]>([]);
  const [expCustomSplits, setExpCustomSplits] = useState<Record<string, string>>({});
  const [expNotes, setExpNotes] = useState('');

  // 4. Advance Payment Modal
  const [advanceModalVisible, setAdvanceModalVisible] = useState(false);
  const [advMemberId, setAdvMemberId] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(getTodayDateString());
  const [advMethod, setAdvMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('UPI');
  const [advNotes, setAdvNotes] = useState('');

  // ==========================================
  // DATA LOADING
  // ==========================================

  const loadData = useCallback(async () => {
    const activeTripId = Array.isArray(tripId) ? tripId[0] : tripId;
    try {
      let tData: Trip | undefined;
      let finalTripId = activeTripId;

      if (finalTripId) {
        tData = await getTripById(finalTripId);
      }

      if (!tData) {
        const allTrips = await getTrips();
        if (allTrips.length > 0) {
          tData = allTrips[0];
          finalTripId = tData.id;
        }
      }

      if (!tData || !finalTripId) {
        Alert.alert('No Trips Found', 'Please create a trip first before viewing group expenses.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        setLoading(false);
        return;
      }

      const [mData, fData, gData, aData] = await Promise.all([
        getMembersByTrip(finalTripId),
        getFoodExpensesByTrip(finalTripId),
        getGroupExpensesByTrip(finalTripId),
        getAdvancesByTrip(finalTripId),
      ]);

      setTrip(tData);
      setMembers(mData);
      setFoodExpenses(fData);
      setGroupExpenses(gData);
      setAdvances(aData);
    } catch (err) {
      console.error('Error loading group expense data:', err);
    } finally {
      setLoading(false);
    }
  }, [tripId, router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Summary Calculations
  const summary: GroupSummary = useMemo(() => {
    return calculateGroupSummary(members, groupExpenses, foodExpenses, advances);
  }, [members, groupExpenses, foodExpenses, advances]);

  const currency = trip?.currency || 'INR';

  // Budget status
  const isOverBudget = trip ? summary.totalExpenses > trip.budget : false;
  const budgetUsagePercent =
    trip && trip.budget > 0
      ? Math.min(100, Math.round((summary.totalExpenses / trip.budget) * 100))
      : 0;

  // ==========================================
  // MEMBER HANDLERS
  // ==========================================

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberName('');
    setMemberPhone('');
    setMemberEmail('');
    setMemberModalVisible(true);
  };

  const handleOpenEditMember = (m: TripMember) => {
    setEditingMember(m);
    setMemberName(m.name);
    setMemberPhone(m.phone || '');
    setMemberEmail(m.email || '');
    setMemberModalVisible(true);
  };

  const handleSaveMember = async () => {
    if (!memberName.trim()) {
      Alert.alert('Validation Error', 'Please enter a member name.');
      return;
    }
    if (!tripId) return;

    try {
      if (editingMember) {
        await updateMember({
          ...editingMember,
          name: memberName.trim(),
          phone: memberPhone.trim() || undefined,
          email: memberEmail.trim() || undefined,
        });
      } else {
        const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
        const newMem: TripMember = {
          id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tripId,
          name: memberName.trim(),
          phone: memberPhone.trim() || undefined,
          email: memberEmail.trim() || undefined,
          avatarColor: color,
          createdAt: new Date().toISOString(),
        };
        await addMember(newMem);
      }
      setMemberModalVisible(false);
      await loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save member.');
    }
  };

  const handleDeleteMember = (m: TripMember) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${m.name}? This will delete their individual food logs and advance entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteMember(m.id);
            await loadData();
          },
        },
      ]
    );
  };

  // ==========================================
  // FOOD EXPENSE HANDLERS
  // ==========================================

  const handleOpenFoodModal = () => {
    if (members.length === 0) {
      Alert.alert('No Members', 'Please add trip members before logging food expenses.', [
        { text: 'Add Member', onPress: handleOpenAddMember },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setFoodEntryMode('batch');
    setFoodMealType('Lunch');
    setFoodDate(getTodayDateString());
    setFoodDesc('');
    setFoodNotes('');
    setSingleFoodMemberId(members[0]?.id || '');
    setSingleFoodAmount('');
    // Initialize batch amounts empty
    const initialBatch: Record<string, string> = {};
    members.forEach((m) => {
      initialBatch[m.id] = '';
    });
    setBatchFoodAmounts(initialBatch);
    setFoodModalVisible(true);
  };

  const handleSaveFoodExpense = async () => {
    if (!tripId) return;

    try {
      if (foodEntryMode === 'single') {
        const amt = parseFloat(singleFoodAmount);
        if (isNaN(amt) || amt <= 0) {
          Alert.alert('Validation Error', 'Please enter a valid amount.');
          return;
        }
        const member = members.find((m) => m.id === singleFoodMemberId);
        if (!member) {
          Alert.alert('Validation Error', 'Please select a member.');
          return;
        }

        const newEntry: FoodExpenseEntry = {
          id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          tripId,
          memberId: member.id,
          memberName: member.name,
          mealType: foodMealType,
          amount: amt,
          date: foodDate.trim() || getTodayDateString(),
          description: foodDesc.trim() || undefined,
          notes: foodNotes.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        await addFoodExpense(newEntry);
      } else {
        // Batch Entry for each person
        const entriesToAdd: FoodExpenseEntry[] = [];
        for (const m of members) {
          const rawAmt = batchFoodAmounts[m.id];
          const amt = parseFloat(rawAmt);
          if (!isNaN(amt) && amt > 0) {
            entriesToAdd.push({
              id: `food_${Date.now()}_${m.id}_${Math.random().toString(36).substring(2, 5)}`,
              tripId,
              memberId: m.id,
              memberName: m.name,
              mealType: foodMealType,
              amount: amt,
              date: foodDate.trim() || getTodayDateString(),
              description: foodDesc.trim() || undefined,
              notes: foodNotes.trim() || undefined,
              createdAt: new Date().toISOString(),
            });
          }
        }

        if (entriesToAdd.length === 0) {
          Alert.alert('Validation Error', 'Please enter a food amount for at least one person.');
          return;
        }

        await addMultipleFoodExpenses(entriesToAdd);
      }

      setFoodModalVisible(false);
      await loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save food expense.');
    }
  };

  const handleDeleteFoodExpense = (entry: FoodExpenseEntry) => {
    Alert.alert(
      'Delete Food Expense',
      `Delete ${entry.memberName}'s ${entry.mealType} expense of ${formatCurrency(entry.amount, currency)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteFoodExpense(entry.id);
            await loadData();
          },
        },
      ]
    );
  };

  // ==========================================
  // GROUP EXPENSE HANDLERS
  // ==========================================

  const handleOpenExpenseModal = () => {
    if (members.length === 0) {
      Alert.alert('No Members', 'Please add trip members before recording expenses.', [
        { text: 'Add Member', onPress: handleOpenAddMember },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setExpTitle('');
    setExpCategory('Hotel');
    setExpAmount('');
    setExpDate(getTodayDateString());
    setExpPaidBy(members[0]?.id || '');
    setExpSplitType('equal');
    setExpSelectedMembers(members.map((m) => m.id));
    const initialCustom: Record<string, string> = {};
    members.forEach((m) => {
      initialCustom[m.id] = '';
    });
    setExpCustomSplits(initialCustom);
    setExpNotes('');
    setExpenseModalVisible(true);
  };

  const handleToggleMemberForEqualSplit = (id: string) => {
    if (expSelectedMembers.includes(id)) {
      if (expSelectedMembers.length === 1) {
        Alert.alert('Requirement', 'At least one member must be selected for the split.');
        return;
      }
      setExpSelectedMembers(expSelectedMembers.filter((mId) => mId !== id));
    } else {
      setExpSelectedMembers([...expSelectedMembers, id]);
    }
  };

  const handleSaveGroupExpense = async () => {
    if (!tripId) return;
    const totalAmt = parseFloat(expAmount);
    if (!expTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter an expense title.');
      return;
    }
    if (isNaN(totalAmt) || totalAmt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    const payer = members.find((m) => m.id === expPaidBy);
    if (!payer) {
      Alert.alert('Validation Error', 'Please select who paid this expense.');
      return;
    }

    let calculatedSplits: ExpenseSplit[] = [];

    if (expSplitType === 'equal') {
      if (expSelectedMembers.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one member to share this expense.');
        return;
      }
      const splitAmount = Math.round((totalAmt / expSelectedMembers.length) * 100) / 100;
      calculatedSplits = expSelectedMembers.map((mId) => {
        const m = members.find((mem) => mem.id === mId)!;
        return {
          memberId: m.id,
          memberName: m.name,
          amount: splitAmount,
        };
      });
    } else if (expSplitType === 'individual') {
      // 100% assigned to payer or selected single member
      calculatedSplits = [
        {
          memberId: payer.id,
          memberName: payer.name,
          amount: totalAmt,
        },
      ];
    } else {
      // Custom Split
      let sum = 0;
      for (const m of members) {
        const sAmt = parseFloat(expCustomSplits[m.id]) || 0;
        sum += sAmt;
        if (sAmt > 0) {
          calculatedSplits.push({
            memberId: m.id,
            memberName: m.name,
            amount: sAmt,
          });
        }
      }
      if (Math.abs(sum - totalAmt) > 0.05) {
        Alert.alert(
          'Split Total Mismatch',
          `The sum of custom splits (${formatCurrency(sum, currency)}) must match the total amount (${formatCurrency(totalAmt, currency)}).`
        );
        return;
      }
    }

    try {
      const newExp: GroupExpense = {
        id: `gexp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tripId,
        title: expTitle.trim(),
        category: expCategory,
        amount: totalAmt,
        paidByMemberId: payer.id,
        paidByMemberName: payer.name,
        date: expDate.trim() || getTodayDateString(),
        splitType: expSplitType,
        splits: calculatedSplits,
        notes: expNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await addGroupExpense(newExp);
      setExpenseModalVisible(false);
      await loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save group expense.');
    }
  };

  const handleDeleteGroupExpense = (exp: GroupExpense) => {
    Alert.alert(
      'Delete Expense',
      `Delete "${exp.title}" (${formatCurrency(exp.amount, currency)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGroupExpense(exp.id);
            await loadData();
          },
        },
      ]
    );
  };

  // ==========================================
  // ADVANCE PAYMENT HANDLERS
  // ==========================================

  const handleOpenAdvanceModal = () => {
    if (members.length === 0) {
      Alert.alert('No Members', 'Please add trip members before recording advances.', [
        { text: 'Add Member', onPress: handleOpenAddMember },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setAdvMemberId(members[0]?.id || '');
    setAdvAmount('');
    setAdvDate(getTodayDateString());
    setAdvMethod('UPI');
    setAdvNotes('');
    setAdvanceModalVisible(true);
  };

  const handleSaveAdvancePayment = async () => {
    if (!tripId) return;
    const amt = parseFloat(advAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid advance amount.');
      return;
    }
    const member = members.find((m) => m.id === advMemberId);
    if (!member) {
      Alert.alert('Validation Error', 'Please select a member.');
      return;
    }

    try {
      const newAdv: AdvancePayment = {
        id: `adv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tripId,
        memberId: member.id,
        memberName: member.name,
        amount: amt,
        date: advDate.trim() || getTodayDateString(),
        paymentMethod: advMethod,
        notes: advNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await addAdvancePayment(newAdv);
      setAdvanceModalVisible(false);
      await loadData();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to record advance payment.');
    }
  };

  const handleDeleteAdvancePayment = (adv: AdvancePayment) => {
    Alert.alert(
      'Delete Advance Payment',
      `Delete advance of ${formatCurrency(adv.amount, currency)} from ${adv.memberName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAdvancePayment(adv.id);
            await loadData();
          },
        },
      ]
    );
  };

  // ==========================================
  // EXPORT HANDLERS (PDF & EXCEL)
  // ==========================================

  const handleExportPdf = async () => {
    if (!trip) return;
    setExporting(true);
    try {
      await exportGroupExpensePdf({
        trip,
        members,
        foodExpenses,
        groupExpenses,
        advances,
        summary,
      });
    } catch (err) {
      console.error('PDF export error:', err);
      Alert.alert('Export Failed', 'Could not generate PDF report.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!trip) return;
    setExporting(true);
    try {
      await exportGroupExpenseExcel({
        trip,
        members,
        foodExpenses,
        groupExpenses,
        advances,
        summary,
      });
    } catch (err) {
      console.error('Excel export error:', err);
      Alert.alert('Export Failed', 'Could not export Excel CSV.');
    } finally {
      setExporting(false);
    }
  };

  const handleToggleSettlement = async (settlementId: string) => {
    await toggleSettlementStatus(settlementId);
    await loadData();
  };

  if (loading || !trip) {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Filtered Food Expenses
  const filteredFoodExpenses = foodExpenses.filter((f) => {
    if (selectedMealFilter !== 'all' && f.mealType !== selectedMealFilter) return false;
    return true;
  });

  // Filtered Group Expenses
  const filteredGroupExpenses = groupExpenses.filter((g) => {
    if (selectedCategoryFilter !== 'all' && g.category !== selectedCategoryFilter) return false;
    if (expenseSearch.trim()) {
      const q = expenseSearch.toLowerCase().trim();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchPayer = g.paidByMemberName.toLowerCase().includes(q);
      const matchMember = (g.splits || []).some((s) => s.memberName.toLowerCase().includes(q));
      if (!matchTitle && !matchPayer && !matchMember) return false;
    }
    return true;
  });

  const topSafeInset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 12);

  return (
    <View style={styles.container}>
      {/* Responsive Top Safe Header Container */}
      <View style={[styles.headerContainer, { paddingTop: topSafeInset }]}>
        <Header
          title="Group Expenses"
          subtitle={`${trip.title} · ${members.length} ${members.length === 1 ? 'Member' : 'Members'}`}
          style={styles.customHeader}
          rightAction={
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={styles.headerActionPill}
                onPress={handleExportPdf}
                disabled={exporting}
                activeOpacity={0.7}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Share2 color={COLORS.primary} size={15} />
                    <Text style={styles.headerActionPillText}>Report</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Modern Segmented Navigation Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'dashboard' && styles.tabItemActive]}
            onPress={() => setActiveTab('dashboard')}
          >
            <PieChart
              size={15}
              color={activeTab === 'dashboard' ? COLORS.primary : COLORS.secondaryText}
            />
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'dashboard' && styles.tabItemTextActive,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'food' && styles.tabItemActive]}
            onPress={() => setActiveTab('food')}
          >
            <UtensilsCrossed
              size={15}
              color={activeTab === 'food' ? COLORS.primary : COLORS.secondaryText}
            />
            <Text
              style={[styles.tabItemText, activeTab === 'food' && styles.tabItemTextActive]}
            >
              Food ({foodExpenses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'expenses' && styles.tabItemActive]}
            onPress={() => setActiveTab('expenses')}
          >
            <Receipt
              size={15}
              color={activeTab === 'expenses' ? COLORS.primary : COLORS.secondaryText}
            />
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'expenses' && styles.tabItemTextActive,
              ]}
            >
              All Expenses ({groupExpenses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'members' && styles.tabItemActive]}
            onPress={() => setActiveTab('members')}
          >
            <Users
              size={15}
              color={activeTab === 'members' ? COLORS.primary : COLORS.secondaryText}
            />
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'members' && styles.tabItemTextActive,
              ]}
            >
              Members & Advances ({members.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settlement' && styles.tabItemActive]}
            onPress={() => setActiveTab('settlement')}
          >
            <ArrowRightLeft
              size={15}
              color={activeTab === 'settlement' ? COLORS.primary : COLORS.secondaryText}
            />
            <Text
              style={[
                styles.tabItemText,
                activeTab === 'settlement' && styles.tabItemTextActive,
              ]}
            >
              Settlement & Reports
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[styles.mainScrollContent, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD                                          */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <View>
            {/* Over-Budget Alert Banner */}
            {isOverBudget && (
              <View style={styles.budgetAlertBanner}>
                <AlertTriangle color="#B91C1C" size={20} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.budgetAlertTitle}>Trip Budget Exceeded!</Text>
                  <Text style={styles.budgetAlertSub}>
                    Total spending of {formatCurrency(summary.totalExpenses, currency)} has exceeded planned budget ({formatCurrency(trip.budget, currency)}) by{' '}
                    {formatCurrency(summary.totalExpenses - trip.budget, currency)}.
                  </Text>
                </View>
              </View>
            )}

            {/* Quick Primary Actions Strip */}
            <View style={styles.quickActionStrip}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleOpenFoodModal}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <UtensilsCrossed color="#D97706" size={18} />
                </View>
                <Text style={styles.quickActionText}>+ Food</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleOpenExpenseModal}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
                  <Receipt color="#0284C7" size={18} />
                </View>
                <Text style={styles.quickActionText}>+ Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleOpenAdvanceModal}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#E6F5EC' }]}>
                  <Wallet color={COLORS.primary} size={18} />
                </View>
                <Text style={styles.quickActionText}>+ Advance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleOpenAddMember}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
                  <UserPlus color="#7C3AED" size={18} />
                </View>
                <Text style={styles.quickActionText}>+ Member</Text>
              </TouchableOpacity>
            </View>

            {/* Top Metric Cards */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Group Spend</Text>
                <Text style={styles.metricVal}>
                  {formatCurrency(summary.totalExpenses, currency)}
                </Text>
                <Text style={styles.metricSub}>
                  Planned: {formatCurrency(trip.budget, currency)} ({budgetUsagePercent}%)
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Total Food Spend</Text>
                <Text style={[styles.metricVal, { color: '#D97706' }]}>
                  {formatCurrency(summary.totalFoodExpenses, currency)}
                </Text>
                <Text style={styles.metricSub}>{foodExpenses.length} food logs</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Advances Collected</Text>
                <Text style={[styles.metricVal, { color: COLORS.primary }]}>
                  {formatCurrency(summary.totalAdvancePaid, currency)}
                </Text>
                <Text style={styles.metricSub}>{advances.length} advance transfers</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Pending Balance</Text>
                <Text style={[styles.metricVal, { color: '#DC2626' }]}>
                  {formatCurrency(summary.totalPendingBalance, currency)}
                </Text>
                <Text style={styles.metricSub}>Awaiting final settle</Text>
              </View>
            </View>

            {/* Member Balances & Advances Table Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>Member Balances & Advances</Text>
                  <Text style={styles.cardSubtitle}>
                    Final Balance = Individual Expense − Advance Paid
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.smallActionBtn}
                  onPress={() => setActiveTab('members')}
                >
                  <Text style={styles.smallActionText}>Manage</Text>
                </TouchableOpacity>
              </View>

              {members.length === 0 ? (
                <EmptyState
                  icon={<Users color={COLORS.primary} size={32} />}
                  title="No Members Added"
                  description="Add members to start tracking individual food, expenses, and advances."
                  actionTitle="+ Add First Member"
                  onAction={handleOpenAddMember}
                />
              ) : (
                <View style={styles.memberBalanceList}>
                  {summary.memberSummaries.map((m) => {
                    const isPositive = m.balance > 0;
                    const isSettled = Math.abs(m.balance) < 0.01;

                    return (
                      <View key={m.member.id} style={styles.memberBalanceRow}>
                        <View style={styles.memberAvatarCol}>
                          <View
                            style={[
                              styles.memberAvatar,
                              { backgroundColor: m.member.avatarColor || COLORS.primary },
                            ]}
                          >
                            <Text style={styles.memberAvatarText}>
                              {m.member.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.memberRowName}>{m.member.name}</Text>
                            <Text style={styles.memberRowSub}>
                              Food: {formatCurrency(m.foodTotal, currency)} · Total:{' '}
                              {formatCurrency(m.totalExpense, currency)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.memberBalanceRight}>
                          <View style={styles.advancePill}>
                            <Text style={styles.advancePillText}>
                              Adv: {formatCurrency(m.advancePaid, currency)}
                            </Text>
                          </View>

                          <View style={styles.balanceStatusCol}>
                            <Text
                              style={[
                                styles.balanceAmountText,
                                isPositive
                                  ? styles.balanceTextPending
                                  : styles.balanceTextSettled,
                              ]}
                            >
                              {formatCurrency(m.balance, currency)}
                            </Text>
                            <Text style={styles.balanceSubLabel}>
                              {isSettled
                                ? 'Settled'
                                : isPositive
                                ? 'Needs to pay'
                                : 'To receive'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Category Breakdown Progress */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Spending by Category</Text>
              <Text style={styles.cardSubtitle}>
                Distribution across food, stay, commute, and tickets
              </Text>

              <View style={styles.categoryProgressList}>
                {CATEGORIES.map((cat) => {
                  const amt = summary.categoryTotals[cat] || 0;
                  const pct =
                    summary.totalExpenses > 0
                      ? Math.round((amt / summary.totalExpenses) * 100)
                      : 0;

                  return (
                    <View key={cat} style={styles.catProgressRow}>
                      <View style={styles.catProgressHeader}>
                        <Text style={styles.catName}>{cat}</Text>
                        <Text style={styles.catAmt}>
                          {formatCurrency(amt, currency)} ({pct}%)
                        </Text>
                      </View>
                      <View style={styles.catBarBackground}>
                        <View
                          style={[
                            styles.catBarFill,
                            {
                              width: `${pct}%`,
                              backgroundColor:
                                cat === 'Food'
                                  ? '#D97706'
                                  : cat === 'Hotel'
                                  ? '#0284C7'
                                  : cat === 'Transport'
                                  ? '#7C3AED'
                                  : COLORS.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Report Export Action Banner */}
            <View style={styles.exportBannerCard}>
              <View style={styles.exportBannerLeft}>
                <Sparkles color={COLORS.primary} size={24} />
                <View>
                  <Text style={styles.exportBannerTitle}>Trip Expense Reports</Text>
                  <Text style={styles.exportBannerSub}>
                    Download professional PDF report or Excel spreadsheet
                  </Text>
                </View>
              </View>
              <View style={styles.exportBtnRow}>
                <TouchableOpacity
                  style={styles.exportBtnPdf}
                  onPress={handleExportPdf}
                  activeOpacity={0.8}
                >
                  <FileDown color={COLORS.white} size={16} />
                  <Text style={styles.exportBtnPdfText}>PDF Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportBtnExcel}
                  onPress={handleExportExcel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportBtnExcelText}>Excel (CSV)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 2: INDIVIDUAL FOOD EXPENSES                           */}
        {/* ========================================================= */}
        {activeTab === 'food' && (
          <View>
            {/* Header with Quick Add Food */}
            <View style={styles.tabSectionHeaderRow}>
              <View>
                <Text style={styles.tabSectionTitle}>Individual Food Logs</Text>
                <Text style={styles.tabSectionSub}>
                  Total Food Spend: {formatCurrency(summary.totalFoodExpenses, currency)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryAddBtn}
                onPress={handleOpenFoodModal}
                activeOpacity={0.8}
              >
                <Plus color={COLORS.white} size={18} />
                <Text style={styles.primaryAddBtnText}>Add Food</Text>
              </TouchableOpacity>
            </View>

            {/* Meal Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedMealFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedMealFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedMealFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  All Meals ({foodExpenses.length})
                </Text>
              </TouchableOpacity>

              {MEAL_TYPES.map((meal) => {
                const count = foodExpenses.filter((f) => f.mealType === meal).length;
                const isSelected = selectedMealFilter === meal;
                return (
                  <TouchableOpacity
                    key={meal}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedMealFilter(meal)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {meal} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Food Person Summary Strip */}
            <View style={styles.foodMemberStripCard}>
              <Text style={styles.foodMemberStripTitle}>Food Spending Per Person</Text>
              <View style={styles.foodMemberGrid}>
                {summary.memberSummaries.map((m) => (
                  <View key={m.member.id} style={styles.foodMemberCol}>
                    <Text style={styles.foodMemberColName}>{m.member.name}</Text>
                    <Text style={styles.foodMemberColAmount}>
                      {formatCurrency(m.foodTotal, currency)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Food Expense Itemized List */}
            {filteredFoodExpenses.length === 0 ? (
              <EmptyState
                icon={<UtensilsCrossed color="#D97706" size={32} />}
                title="No Food Expenses Logged"
                description="Record breakfast, lunch, dinner, or snack expenses for each traveler individually."
                actionTitle="+ Log Food Expense"
                onAction={handleOpenFoodModal}
              />
            ) : (
              filteredFoodExpenses.map((entry) => (
                <View key={entry.id} style={styles.foodEntryCard}>
                  <View style={styles.foodEntryLeft}>
                    <View style={styles.mealBadge}>
                      <Text style={styles.mealBadgeText}>{entry.mealType}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.foodEntryMember}>{entry.memberName}</Text>
                      {entry.description ? (
                        <Text style={styles.foodEntryDesc}>{entry.description}</Text>
                      ) : null}
                      <Text style={styles.foodEntryDate}>
                        📅 {entry.date}
                        {entry.notes ? ` · 📝 ${entry.notes}` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.foodEntryRight}>
                    <Text style={styles.foodEntryAmount}>
                      {formatCurrency(entry.amount, currency)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteFoodExpense(entry)}
                      style={styles.deleteIconBtn}
                    >
                      <Trash2 color="#9CA3AF" size={17} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ALL GROUP EXPENSES (SPLITS)                        */}
        {/* ========================================================= */}
        {activeTab === 'expenses' && (
          <View>
            {/* Header Row */}
            <View style={styles.tabSectionHeaderRow}>
              <View>
                <Text style={styles.tabSectionTitle}>Group Expenses & Splits</Text>
                <Text style={styles.tabSectionSub}>
                  Shared hotel stays, cabs, tickets, and activities
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryAddBtn}
                onPress={handleOpenExpenseModal}
                activeOpacity={0.8}
              >
                <Plus color={COLORS.white} size={18} />
                <Text style={styles.primaryAddBtnText}>Add Expense</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Search color="#9CA3AF" size={18} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title, payer, or member..."
                value={expenseSearch}
                onChangeText={setExpenseSearch}
                placeholderTextColor="#9CA3AF"
              />
              {expenseSearch ? (
                <TouchableOpacity onPress={() => setExpenseSearch('')}>
                  <X color="#9CA3AF" size={18} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategoryFilter === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategoryFilter('all')}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategoryFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  All ({groupExpenses.length})
                </Text>
              </TouchableOpacity>

              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategoryFilter === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedCategoryFilter(cat)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Group Expense Itemized List */}
            {filteredGroupExpenses.length === 0 ? (
              <EmptyState
                icon={<Receipt color="#0284C7" size={32} />}
                title="No Group Expenses Found"
                description="Split hotel bills, cabs, or activity tickets equally or with custom amounts."
                actionTitle="+ Log Shared Expense"
                onAction={handleOpenExpenseModal}
              />
            ) : (
              filteredGroupExpenses.map((exp) => (
                <View key={exp.id} style={styles.groupExpCard}>
                  <View style={styles.groupExpHeaderRow}>
                    <View style={styles.groupExpCatBadge}>
                      <Text style={styles.groupExpCatText}>{exp.category}</Text>
                    </View>
                    <Text style={styles.groupExpDate}>{exp.date}</Text>
                  </View>

                  <View style={styles.groupExpContentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupExpTitle}>{exp.title}</Text>
                      <Text style={styles.groupExpPaidBy}>
                        Paid upfront by <Text style={{ fontWeight: '700' }}>{exp.paidByMemberName}</Text>
                      </Text>
                    </View>

                    <Text style={styles.groupExpAmount}>
                      {formatCurrency(exp.amount, currency)}
                    </Text>
                  </View>

                  {/* Splits Breakdown Strip */}
                  <View style={styles.splitsContainer}>
                    <Text style={styles.splitsHeading}>
                      {exp.splitType.toUpperCase()} SPLIT:
                    </Text>
                    <View style={styles.splitsChipsRow}>
                      {(exp.splits || []).map((s) => (
                        <View key={s.memberId} style={styles.splitChip}>
                          <Text style={styles.splitChipText}>
                            {s.memberName}:{' '}
                            <Text style={{ fontWeight: '700' }}>
                              {formatCurrency(s.amount, currency)}
                            </Text>
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {exp.notes ? (
                    <Text style={styles.groupExpNotes}>📝 {exp.notes}</Text>
                  ) : null}

                  <View style={styles.groupExpFooter}>
                    <TouchableOpacity
                      style={styles.deleteGroupExpBtn}
                      onPress={() => handleDeleteGroupExpense(exp)}
                    >
                      <Trash2 color="#EF4444" size={15} />
                      <Text style={styles.deleteGroupExpText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MEMBERS & ADVANCES                                 */}
        {/* ========================================================= */}
        {activeTab === 'members' && (
          <View>
            {/* Members Section Header */}
            <View style={styles.tabSectionHeaderRow}>
              <View>
                <Text style={styles.tabSectionTitle}>Trip Travelers</Text>
                <Text style={styles.tabSectionSub}>
                  {members.length} {members.length === 1 ? 'member' : 'members'} enrolled in group
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryAddBtn}
                onPress={handleOpenAddMember}
                activeOpacity={0.8}
              >
                <UserPlus color={COLORS.white} size={18} />
                <Text style={styles.primaryAddBtnText}>Add Member</Text>
              </TouchableOpacity>
            </View>

            {/* Members List */}
            {members.length === 0 ? (
              <EmptyState
                icon={<UserPlus color="#7C3AED" size={32} />}
                title="No Members Added Yet"
                description="Add members to assign food, split expenses, and record advance payments."
                actionTitle="+ Add Member"
                onAction={handleOpenAddMember}
              />
            ) : (
              members.map((m) => {
                const memSummary = summary.memberSummaries.find(
                  (s) => s.member.id === m.id
                );

                return (
                  <View key={m.id} style={styles.memberCard}>
                    <View style={styles.memberCardTop}>
                      <View
                        style={[
                          styles.memberAvatarBig,
                          { backgroundColor: m.avatarColor || COLORS.primary },
                        ]}
                      >
                        <Text style={styles.memberAvatarBigText}>
                          {m.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.memberCardName}>{m.name}</Text>
                        {m.phone ? (
                          <Text style={styles.memberCardMeta}>📞 {m.phone}</Text>
                        ) : null}
                        {m.email ? (
                          <Text style={styles.memberCardMeta}>✉️ {m.email}</Text>
                        ) : null}
                      </View>

                      <View style={styles.memberActionsRow}>
                        <TouchableOpacity
                          style={styles.memberActionIconBtn}
                          onPress={() => handleOpenEditMember(m)}
                        >
                          <Edit3 color="#4B5563" size={17} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.memberActionIconBtn}
                          onPress={() => handleDeleteMember(m)}
                        >
                          <Trash2 color="#EF4444" size={17} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Member Stats Quick View */}
                    {memSummary ? (
                      <View style={styles.memberStatsStrip}>
                        <View style={styles.memberStatItem}>
                          <Text style={styles.memberStatLabel}>Food Total</Text>
                          <Text style={styles.memberStatValue}>
                            {formatCurrency(memSummary.foodTotal, currency)}
                          </Text>
                        </View>

                        <View style={styles.memberStatItem}>
                          <Text style={styles.memberStatLabel}>Total Expense</Text>
                          <Text style={[styles.memberStatValue, { fontWeight: '700' }]}>
                            {formatCurrency(memSummary.totalExpense, currency)}
                          </Text>
                        </View>

                        <View style={styles.memberStatItem}>
                          <Text style={styles.memberStatLabel}>Advance Paid</Text>
                          <Text style={[styles.memberStatValue, { color: COLORS.primary }]}>
                            {formatCurrency(memSummary.advancePaid, currency)}
                          </Text>
                        </View>

                        <View style={styles.memberStatItem}>
                          <Text style={styles.memberStatLabel}>Balance</Text>
                          <Text
                            style={[
                              styles.memberStatValue,
                              {
                                color: memSummary.balance > 0 ? '#DC2626' : '#16834A',
                              },
                            ]}
                          >
                            {formatCurrency(memSummary.balance, currency)}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}

            {/* Advance Payments Section Header */}
            <View style={[styles.tabSectionHeaderRow, { marginTop: 32 }]}>
              <View>
                <Text style={styles.tabSectionTitle}>Advance Payments Log</Text>
                <Text style={styles.tabSectionSub}>
                  Total Advance: {formatCurrency(summary.totalAdvancePaid, currency)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryAddBtn}
                onPress={handleOpenAdvanceModal}
                activeOpacity={0.8}
              >
                <Plus color={COLORS.white} size={18} />
                <Text style={styles.primaryAddBtnText}>Record Advance</Text>
              </TouchableOpacity>
            </View>

            {/* Advance Payments List */}
            {advances.length === 0 ? (
              <View style={styles.emptyAdvancesBox}>
                <Wallet color="#9CA3AF" size={28} />
                <Text style={styles.emptyAdvancesTitle}>No Advances Recorded</Text>
                <Text style={styles.emptyAdvancesSub}>
                  Track initial deposits and advance payments made by travelers before or during the trip.
                </Text>
              </View>
            ) : (
              advances.map((adv) => (
                <View key={adv.id} style={styles.advanceCard}>
                  <View style={styles.advanceLeft}>
                    <View style={styles.advanceIconBox}>
                      <Wallet color={COLORS.primary} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advanceMember}>{adv.memberName}</Text>
                      <Text style={styles.advanceMeta}>
                        📅 {adv.date} · 💳 {adv.paymentMethod || 'Cash'}
                        {adv.notes ? ` · ${adv.notes}` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.advanceRight}>
                    <Text style={styles.advanceAmount}>
                      +{formatCurrency(adv.amount, currency)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteAdvancePayment(adv)}
                      style={styles.deleteIconBtn}
                    >
                      <Trash2 color="#9CA3AF" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 5: FINAL SETTLEMENT & REPORTS                         */}
        {/* ========================================================= */}
        {activeTab === 'settlement' && (
          <View>
            {/* Settlement Overview Title */}
            <View style={styles.tabSectionHeaderRow}>
              <View>
                <Text style={styles.tabSectionTitle}>Final Settlement</Text>
                <Text style={styles.tabSectionSub}>
                  Optimized debt calculation: Who pays whom
                </Text>
              </View>
            </View>

            {/* Settlement Calculation Cards */}
            {summary.settlements.length === 0 ? (
              <View style={styles.allSettledCard}>
                <CheckCircle2 color={COLORS.success} size={40} />
                <Text style={styles.allSettledTitle}>All Expenses Settled!</Text>
                <Text style={styles.allSettledSub}>
                  There are no pending debts or reimbursements between trip members.
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 24 }}>
                {summary.settlements.map((s) => (
                  <View
                    key={s.id}
                    style={[
                      styles.settleCard,
                      s.settled && styles.settleCardCompleted,
                    ]}
                  >
                    <View style={styles.settleCardLeft}>
                      <View style={styles.settlePersonRow}>
                        <Text style={styles.settleDebtor}>{s.fromMemberName}</Text>
                        <Text style={styles.settlePaysText}>pays</Text>
                        <Text style={styles.settleCreditor}>{s.toMemberName}</Text>
                      </View>
                      <Text style={styles.settleAmount}>
                        {formatCurrency(s.amount, currency)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.settleStatusBtn,
                        s.settled && styles.settleStatusBtnDone,
                      ]}
                      onPress={() => handleToggleSettlement(s.id)}
                      activeOpacity={0.8}
                    >
                      {s.settled ? (
                        <>
                          <Check color={COLORS.white} size={15} />
                          <Text style={styles.settleStatusBtnDoneText}>Settled</Text>
                        </>
                      ) : (
                        <Text style={styles.settleStatusBtnPendingText}>
                          Mark Paid
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Export & Download Hub */}
            <View style={styles.exportHubCard}>
              <Text style={styles.exportHubTitle}>Download & Share Reports</Text>
              <Text style={styles.exportHubSub}>
                Export full audit logs with itemized food expenses, split breakdowns, advance deductions, and settlement plan.
              </Text>

              <View style={styles.exportHubActions}>
                <TouchableOpacity
                  style={styles.exportBigBtnPrimary}
                  onPress={handleExportPdf}
                  disabled={exporting}
                  activeOpacity={0.8}
                >
                  <FileDown color={COLORS.white} size={22} />
                  <View>
                    <Text style={styles.exportBigBtnTitle}>Download PDF Report</Text>
                    <Text style={styles.exportBigBtnSub}>
                      Clean green-and-white TripMate document
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.exportBigBtnSecondary}
                  onPress={handleExportExcel}
                  disabled={exporting}
                  activeOpacity={0.8}
                >
                  <Share2 color={COLORS.primary} size={22} />
                  <View>
                    <Text style={styles.exportBigBtnSecTitle}>Export to Excel / CSV</Text>
                    <Text style={styles.exportBigBtnSecSub}>
                      Full spreadsheet for accounting & records
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT MEMBER                                */}
      {/* ========================================================= */}
      <Modal
        visible={memberModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMemberModalVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20 },
          ]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMember ? 'Edit Member' : 'Add Trip Member'}
              </Text>
              <TouchableOpacity
                onPress={() => setMemberModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X color={COLORS.secondaryText} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput
                label="Full Name *"
                placeholder="e.g. Murali"
                value={memberName}
                onChangeText={setMemberName}
              />

              <AppInput
                label="Phone Number (Optional)"
                placeholder="e.g. +91 98765 43210"
                value={memberPhone}
                onChangeText={setMemberPhone}
                keyboardType="phone-pad"
              />

              <AppInput
                label="Email (Optional)"
                placeholder="e.g. murali@example.com"
                value={memberEmail}
                onChangeText={setMemberEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.modalActions}>
                <AppButton
                  title={editingMember ? 'Update Member' : 'Add to Trip'}
                  onPress={handleSaveMember}
                  icon={<Check color={COLORS.white} size={18} />}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 2: FOOD EXPENSE (SINGLE & BATCH MODES)               */}
      {/* ========================================================= */}
      <Modal
        visible={foodModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFoodModalVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20 },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { maxHeight: screenHeight - keyboardHeight - 60 },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Individual Food Expense</Text>
                <Text style={styles.modalSub}>
                  Record different food amounts per person
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFoodModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X color={COLORS.secondaryText} size={20} />
              </TouchableOpacity>
            </View>

            {/* Entry Mode Switch: Batch vs Single */}
            <View style={styles.modeSwitchRow}>
              <TouchableOpacity
                style={[
                  styles.modeSwitchBtn,
                  foodEntryMode === 'batch' && styles.modeSwitchBtnActive,
                ]}
                onPress={() => setFoodEntryMode('batch')}
              >
                <Text
                  style={[
                    styles.modeSwitchText,
                    foodEntryMode === 'batch' && styles.modeSwitchTextActive,
                  ]}
                >
                  All Travelers (Batch)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeSwitchBtn,
                  foodEntryMode === 'single' && styles.modeSwitchBtnActive,
                ]}
                onPress={() => setFoodEntryMode('single')}
              >
                <Text
                  style={[
                    styles.modeSwitchText,
                    foodEntryMode === 'single' && styles.modeSwitchTextActive,
                  ]}
                >
                  Single Person
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Meal Type Selector */}
              <Text style={styles.inputGroupLabel}>Meal Type *</Text>
              <View style={styles.mealChipsSelector}>
                {MEAL_TYPES.map((meal) => (
                  <TouchableOpacity
                    key={meal}
                    style={[
                      styles.mealSelectChip,
                      foodMealType === meal && styles.mealSelectChipActive,
                    ]}
                    onPress={() => setFoodMealType(meal)}
                  >
                    <Text
                      style={[
                        styles.mealSelectChipText,
                        foodMealType === meal && styles.mealSelectChipTextActive,
                      ]}
                    >
                      {meal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppInput
                label="Date (YYYY-MM-DD) *"
                placeholder="YYYY-MM-DD"
                value={foodDate}
                onChangeText={setFoodDate}
                leftIcon={<Calendar color={COLORS.primary} size={18} />}
              />

              <AppInput
                label="Restaurant / Item Description"
                placeholder="e.g. Seafood Dinner, Beachside Warung"
                value={foodDesc}
                onChangeText={setFoodDesc}
              />

              {/* BATCH ENTRY MODE: Input for each member */}
              {foodEntryMode === 'batch' ? (
                <View style={styles.batchContainer}>
                  <Text style={styles.inputGroupLabel}>
                    Enter Food Amount for Each Person ({currency}):
                  </Text>
                  {members.map((m) => (
                    <View key={m.id} style={styles.batchMemberRow}>
                      <View style={styles.batchMemberLabelCol}>
                        <View
                          style={[
                            styles.batchAvatar,
                            { backgroundColor: m.avatarColor || COLORS.primary },
                          ]}
                        >
                          <Text style={styles.batchAvatarText}>
                            {m.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.batchMemberName}>{m.name}</Text>
                      </View>

                      <View style={styles.batchInputWrapper}>
                        <Text style={styles.batchCurrencyPrefix}>
                          {currency === 'INR' ? '₹' : currency}
                        </Text>
                        <TextInput
                          style={styles.batchInput}
                          placeholder="0"
                          keyboardType="numeric"
                          value={batchFoodAmounts[m.id] || ''}
                          onChangeText={(text) => {
                            setBatchFoodAmounts({
                              ...batchFoodAmounts,
                              [m.id]: text,
                            });
                          }}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                /* SINGLE ENTRY MODE: Select member and enter amount */
                <View>
                  <Text style={styles.inputGroupLabel}>Select Person *</Text>
                  <View style={styles.memberPillsRow}>
                    {members.map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.memberSelectPill,
                          singleFoodMemberId === m.id && styles.memberSelectPillActive,
                        ]}
                        onPress={() => setSingleFoodMemberId(m.id)}
                      >
                        <Text
                          style={[
                            styles.memberSelectPillText,
                            singleFoodMemberId === m.id &&
                              styles.memberSelectPillTextActive,
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <AppInput
                    label="Food Amount *"
                    placeholder="e.g. 250"
                    keyboardType="numeric"
                    value={singleFoodAmount}
                    onChangeText={setSingleFoodAmount}
                  />
                </View>
              )}

              <AppInput
                label="Notes (Optional)"
                placeholder="e.g. Split drinks included, tip paid in cash"
                value={foodNotes}
                onChangeText={setFoodNotes}
                multiline
              />

              <View style={styles.modalActions}>
                <AppButton
                  title="Save Food Expense"
                  onPress={handleSaveFoodExpense}
                  icon={<Check color={COLORS.white} size={18} />}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 3: GROUP EXPENSE & SPLIT                             */}
      {/* ========================================================= */}
      <Modal
        visible={expenseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20 },
          ]}
        >
          <View
            style={[
              styles.modalContent,
              { maxHeight: screenHeight - keyboardHeight - 60 },
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Group Expense</Text>
                <Text style={styles.modalSub}>
                  Hotel, transport, tickets & shared expenses
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setExpenseModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X color={COLORS.secondaryText} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput
                label="Expense Title *"
                placeholder="e.g. Private Pool Villa, Scooter Rentals"
                value={expTitle}
                onChangeText={setExpTitle}
              />

              {/* Category Picker */}
              <Text style={styles.inputGroupLabel}>Category *</Text>
              <View style={styles.mealChipsSelector}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.mealSelectChip,
                      expCategory === cat && styles.mealSelectChipActive,
                    ]}
                    onPress={() => setExpCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.mealSelectChipText,
                        expCategory === cat && styles.mealSelectChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppInput
                label={`Total Amount (${currency}) *`}
                placeholder="e.g. 6000"
                keyboardType="numeric"
                value={expAmount}
                onChangeText={setExpAmount}
              />

              <AppInput
                label="Date (YYYY-MM-DD) *"
                placeholder="YYYY-MM-DD"
                value={expDate}
                onChangeText={setExpDate}
                leftIcon={<Calendar color={COLORS.primary} size={18} />}
              />

              {/* Paid Upfront By */}
              <Text style={styles.inputGroupLabel}>Paid Upfront By *</Text>
              <View style={styles.memberPillsRow}>
                {members.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.memberSelectPill,
                      expPaidBy === m.id && styles.memberSelectPillActive,
                    ]}
                    onPress={() => setExpPaidBy(m.id)}
                  >
                    <Text
                      style={[
                        styles.memberSelectPillText,
                        expPaidBy === m.id && styles.memberSelectPillTextActive,
                      ]}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Split Type Selector */}
              <Text style={styles.inputGroupLabel}>Split Strategy *</Text>
              <View style={styles.splitTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.splitTypeBtn,
                    expSplitType === 'equal' && styles.splitTypeBtnActive,
                  ]}
                  onPress={() => setExpSplitType('equal')}
                >
                  <Text
                    style={[
                      styles.splitTypeBtnText,
                      expSplitType === 'equal' && styles.splitTypeBtnTextActive,
                    ]}
                  >
                    Equal Split
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.splitTypeBtn,
                    expSplitType === 'custom' && styles.splitTypeBtnActive,
                  ]}
                  onPress={() => setExpSplitType('custom')}
                >
                  <Text
                    style={[
                      styles.splitTypeBtnText,
                      expSplitType === 'custom' && styles.splitTypeBtnTextActive,
                    ]}
                  >
                    Custom Split
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.splitTypeBtn,
                    expSplitType === 'individual' && styles.splitTypeBtnActive,
                  ]}
                  onPress={() => setExpSplitType('individual')}
                >
                  <Text
                    style={[
                      styles.splitTypeBtnText,
                      expSplitType === 'individual' && styles.splitTypeBtnTextActive,
                    ]}
                  >
                    Single Person
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Equal Split: Checkboxes */}
              {expSplitType === 'equal' && (
                <View style={styles.splitMembersSelectBox}>
                  <Text style={styles.subGroupLabel}>
                    Select members sharing this bill:
                  </Text>
                  {members.map((m) => {
                    const isChecked = expSelectedMembers.includes(m.id);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.memberCheckboxRow}
                        onPress={() => handleToggleMemberForEqualSplit(m.id)}
                      >
                        <View
                          style={[
                            styles.checkboxBox,
                            isChecked && styles.checkboxBoxChecked,
                          ]}
                        >
                          {isChecked && <Check color={COLORS.white} size={14} />}
                        </View>
                        <Text style={styles.checkboxLabel}>{m.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Custom Split: Amount inputs */}
              {expSplitType === 'custom' && (
                <View style={styles.splitMembersSelectBox}>
                  <Text style={styles.subGroupLabel}>
                    Enter individual share for each member:
                  </Text>
                  {members.map((m) => (
                    <View key={m.id} style={styles.customSplitInputRow}>
                      <Text style={styles.customSplitLabel}>{m.name}</Text>
                      <View style={styles.batchInputWrapper}>
                        <Text style={styles.batchCurrencyPrefix}>
                          {currency === 'INR' ? '₹' : currency}
                        </Text>
                        <TextInput
                          style={styles.batchInput}
                          placeholder="0"
                          keyboardType="numeric"
                          value={expCustomSplits[m.id] || ''}
                          onChangeText={(text) => {
                            setExpCustomSplits({
                              ...expCustomSplits,
                              [m.id]: text,
                            });
                          }}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <AppInput
                label="Notes (Optional)"
                placeholder="e.g. Booking confirmation #9872"
                value={expNotes}
                onChangeText={setExpNotes}
                multiline
              />

              <View style={styles.modalActions}>
                <AppButton
                  title="Save Group Expense"
                  onPress={handleSaveGroupExpense}
                  icon={<Check color={COLORS.white} size={18} />}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL 4: RECORD ADVANCE PAYMENT                           */}
      {/* ========================================================= */}
      <Modal
        visible={advanceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdvanceModalVisible(false)}
      >
        <View
          style={[
            styles.modalOverlay,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 20 },
          ]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Advance Payment</Text>
                <Text style={styles.modalSub}>
                  Pre-paid trip deposits and advance transfers
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAdvanceModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X color={COLORS.secondaryText} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Member Picker */}
              <Text style={styles.inputGroupLabel}>Person Paying Advance *</Text>
              <View style={styles.memberPillsRow}>
                {members.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.memberSelectPill,
                      advMemberId === m.id && styles.memberSelectPillActive,
                    ]}
                    onPress={() => setAdvMemberId(m.id)}
                  >
                    <Text
                      style={[
                        styles.memberSelectPillText,
                        advMemberId === m.id && styles.memberSelectPillTextActive,
                      ]}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppInput
                label={`Advance Amount (${currency}) *`}
                placeholder="e.g. 1000"
                keyboardType="numeric"
                value={advAmount}
                onChangeText={setAdvAmount}
              />

              <AppInput
                label="Date (YYYY-MM-DD) *"
                placeholder="YYYY-MM-DD"
                value={advDate}
                onChangeText={setAdvDate}
                leftIcon={<Calendar color={COLORS.primary} size={18} />}
              />

              {/* Payment Method */}
              <Text style={styles.inputGroupLabel}>Payment Method</Text>
              <View style={styles.mealChipsSelector}>
                {(['UPI', 'Cash', 'Bank Transfer', 'Card'] as const).map((method) => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.mealSelectChip,
                      advMethod === method && styles.mealSelectChipActive,
                    ]}
                    onPress={() => setAdvMethod(method)}
                  >
                    <Text
                      style={[
                        styles.mealSelectChipText,
                        advMethod === method && styles.mealSelectChipTextActive,
                      ]}
                    >
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <AppInput
                label="Notes (Optional)"
                placeholder="e.g. GPay reference / Cash paid at station"
                value={advNotes}
                onChangeText={setAdvNotes}
                multiline
              />

              <View style={styles.modalActions}>
                <AppButton
                  title="Save Advance Payment"
                  onPress={handleSaveAdvancePayment}
                  icon={<Check color={COLORS.white} size={18} />}
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
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customHeader: {
    borderBottomWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  headerActionPillText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },

  // Segment Tab Bar
  tabBarContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBarScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F6F4',
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  tabItemTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },

  // Main Scroll
  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    padding: 16,
  },

  // Budget Alert Banner
  budgetAlertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  budgetAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  budgetAlertSub: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
    lineHeight: 16,
  },

  // Quick Action Strip
  quickActionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Metric Cards Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },

  // Card Container
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  smallActionBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  smallActionText: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },

  // Member Balances Table List
  memberBalanceList: {
    marginTop: 4,
  },
  memberBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F1',
  },
  memberAvatarCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  memberRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberRowSub: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  memberBalanceRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  advancePill: {
    backgroundColor: '#F3F6F4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  advancePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },
  balanceStatusCol: {
    alignItems: 'flex-end',
  },
  balanceAmountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  balanceTextPending: {
    color: '#D97706',
  },
  balanceTextSettled: {
    color: COLORS.primary,
  },
  balanceSubLabel: {
    fontSize: 10,
    color: COLORS.secondaryText,
  },

  // Category Progress
  categoryProgressList: {
    marginTop: 14,
    gap: 12,
  },
  catProgressRow: {
    gap: 6,
  },
  catProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  catAmt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },
  catBarBackground: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EAEFEA',
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Export Banner
  exportBannerCard: {
    backgroundColor: '#E6F5EC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#B9E5CC',
  },
  exportBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  exportBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  exportBannerSub: {
    fontSize: 11,
    color: '#2A5E40',
    marginTop: 2,
  },
  exportBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportBtnPdf: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  exportBtnPdfText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  exportBtnExcel: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  exportBtnExcelText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },

  // Section Header Row
  tabSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tabSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  tabSectionSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  primaryAddBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  primaryAddBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },

  // Filters
  filterChipScroll: {
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  filterChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },

  // Food Member Strip
  foodMemberStripCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  foodMemberStripTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  foodMemberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodMemberCol: {
    width: '48%',
    backgroundColor: '#F7FAF8',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  foodMemberColName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  foodMemberColAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 2,
  },

  // Food Entry Card
  foodEntryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodEntryLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  mealBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  mealBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  foodEntryMember: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  foodEntryDesc: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  foodEntryDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  foodEntryRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  foodEntryAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
  },
  deleteIconBtn: {
    padding: 4,
  },

  // Search Bar
  searchBar: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 2,
  },

  // Group Exp Card
  groupExpCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  groupExpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupExpCatBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  groupExpCatText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  groupExpDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  groupExpContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  groupExpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  groupExpPaidBy: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 3,
  },
  groupExpAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  splitsContainer: {
    backgroundColor: '#F7FAF8',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  splitsHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondaryText,
    marginBottom: 6,
  },
  splitsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  splitChip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8E4',
  },
  splitChipText: {
    fontSize: 11,
    color: COLORS.text,
  },
  groupExpNotes: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
  },
  groupExpFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  deleteGroupExpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteGroupExpText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },

  // Member Card
  memberCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatarBig: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarBigText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  memberCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  memberCardMeta: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  memberActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  memberActionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberStatsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E6ECE8',
  },
  memberStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  memberStatLabel: {
    fontSize: 10,
    color: COLORS.secondaryText,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberStatValue: {
    fontSize: 13,
    color: COLORS.text,
  },

  // Advances Card
  emptyAdvancesBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyAdvancesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  emptyAdvancesSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  advanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  advanceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advanceMember: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  advanceMeta: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  advanceRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  advanceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Settlement Tab Styles
  allSettledCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 20,
  },
  allSettledTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#065F46',
    marginTop: 10,
  },
  allSettledSub: {
    fontSize: 12,
    color: '#047857',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  settleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settleCardCompleted: {
    borderLeftColor: '#9CA3AF',
    opacity: 0.7,
  },
  settleCardLeft: {
    flex: 1,
  },
  settlePersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  settleDebtor: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  settlePaysText: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  settleCreditor: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  settleAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  settleStatusBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settleStatusBtnDone: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settleStatusBtnPendingText: {
    color: '#B45309',
    fontWeight: '700',
    fontSize: 12,
  },
  settleStatusBtnDoneText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },

  // Export Hub Card
  exportHubCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportHubTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  exportHubSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 16,
  },
  exportHubActions: {
    gap: 10,
  },
  exportBigBtnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportBigBtnTitle: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  exportBigBtnSub: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 1,
  },
  exportBigBtnSecondary: {
    backgroundColor: '#F3F6F4',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exportBigBtnSecTitle: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 14,
  },
  exportBigBtnSecSub: {
    color: COLORS.secondaryText,
    fontSize: 11,
    marginTop: 1,
  },

  // Modal Common Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    marginTop: 16,
    marginBottom: 8,
  },

  // Mode Switch
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  modeSwitchBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeSwitchBtnActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modeSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  modeSwitchTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },

  // Meal Chips & Category Chips
  inputGroupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subGroupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
    marginBottom: 8,
  },
  mealChipsSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  mealSelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealSelectChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  mealSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  mealSelectChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },

  // Member Pills Selector
  memberPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  memberSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberSelectPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  memberSelectPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  memberSelectPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },

  // Batch Food Container
  batchContainer: {
    backgroundColor: '#F9FBFA',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  batchMemberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },
  batchMemberLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  batchAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchAvatarText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  batchMemberName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  batchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    width: 110,
  },
  batchCurrencyPrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondaryText,
    marginRight: 4,
  },
  batchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 6,
    textAlign: 'right',
  },

  // Split Types
  splitTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  splitTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  splitTypeBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  splitTypeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  splitTypeBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },

  splitMembersSelectBox: {
    backgroundColor: '#F9FBFA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  memberCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  customSplitInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  customSplitLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
});

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={errorBoundaryStyles.container}>
      <Text style={errorBoundaryStyles.title}>Unable to Load Group Expenses</Text>
      <Text style={errorBoundaryStyles.message}>
        {error?.message || 'An unexpected error occurred while loading group expense data.'}
      </Text>
      <TouchableOpacity style={errorBoundaryStyles.retryBtn} onPress={retry} activeOpacity={0.8}>
        <Text style={errorBoundaryStyles.retryText}>Reload Screen</Text>
      </TouchableOpacity>
    </View>
  );
}

const errorBoundaryStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
