import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Wallet,
  CheckCircle2,
  Circle,
  ListTodo,
  FileText,
  ChevronRight,
  Compass,
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { AppButton } from '../../src/components/common/AppButton';
import { TripForm } from '../../src/components/trip/TripForm';
import { ExpenseCard } from '../../src/components/expense/ExpenseCard';

import { getTripById, updateTrip, deleteTrip } from '../../src/services/tripService';
import { getExpensesByTrip, deleteExpense } from '../../src/services/expenseService';
import {
  getItinerariesByTrip,
  toggleItineraryComplete,
} from '../../src/services/itineraryService';
import {
  getPackingItemsByTrip,
  togglePackingItem,
} from '../../src/services/packingService';
import { getNotesByTrip } from '../../src/services/noteService';
import { getMembersByTrip } from '../../src/services/groupExpenseService';

import { Trip } from '../../src/types/trip';
import { Expense } from '../../src/types/expense';
import { Itinerary, PackingItem } from '../../src/types/itinerary';
import { TravelNote } from '../../src/types/note';
import { TripMember } from '../../src/types/groupExpense';

import {
  formatDateRange,
  calculateDurationDays,
  getDaysCountdown,
} from '../../src/utils/date';
import { formatCurrency } from '../../src/utils/currency';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [notes, setNotes] = useState<TravelNote[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [editModalVisible, setEditModalVisible] = useState(false);

  const loadAllTripData = useCallback(async () => {
    if (!id) return;
    try {
      const [tripData, expData, itinData, packData, notesData, membersData] =
        await Promise.all([
          getTripById(id),
          getExpensesByTrip(id),
          getItinerariesByTrip(id),
          getPackingItemsByTrip(id),
          getNotesByTrip(id),
          getMembersByTrip(id),
        ]);

      if (!tripData) {
        Alert.alert('Trip Not Found', 'This trip may have been deleted.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/trips') },
        ]);
        return;
      }

      setTrip(tripData);
      setExpenses(expData);
      setItineraries(itinData);
      setPackingItems(packData);
      setNotes(notesData);
      setMembers(membersData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      loadAllTripData();
    }, [loadAllTripData])
  );

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const packedCount = useMemo(() => {
    return packingItems.filter((p) => p.packed).length;
  }, [packingItems]);

  const completedActivitiesCount = useMemo(() => {
    return itineraries.filter((i) => i.completed).length;
  }, [itineraries]);

  const handleDeleteTrip = () => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete "${trip?.title}" and all its expenses, itineraries, and checklists?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (trip) {
              await deleteTrip(trip.id);
              router.replace('/(tabs)/trips');
            }
          },
        },
      ]
    );
  };

  const handleUpdateTrip = async (updated: Trip) => {
    await updateTrip(updated);
    setTrip(updated);
    setEditModalVisible(false);
    loadAllTripData();
  };

  const handleTogglePacking = async (packId: string) => {
    await togglePackingItem(packId);
    loadAllTripData();
  };

  const handleToggleItinerary = async (itinId: string) => {
    await toggleItineraryComplete(itinId);
    loadAllTripData();
  };

  const handleDeleteExpense = async (expId: string) => {
    await deleteExpense(expId);
    loadAllTripData();
  };

  if (loading || !trip) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const duration = calculateDurationDays(trip.startDate, trip.endDate);
  const countdown = getDaysCountdown(trip.startDate, trip.endDate);
  const budgetUsagePercent =
    trip.budget > 0 ? Math.min(100, Math.round((totalSpent / trip.budget) * 100)) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={trip.title}
        subtitle={trip.destination}
        onBack={() => router.back()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setEditModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Edit3 color={COLORS.text} size={18} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { marginLeft: 8 }]}
              onPress={handleDeleteTrip}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 color={COLORS.danger} size={18} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.destinationBox}>
              <MapPin color={COLORS.white} size={18} />
              <Text style={styles.heroDestination} numberOfLines={1}>
                {trip.destination}
              </Text>
            </View>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{trip.status}</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{trip.title}</Text>

          <View style={styles.heroMetaRow}>
            <Calendar color="#C2E6D1" size={16} />
            <Text style={styles.heroDate}>
              {formatDateRange(trip.startDate, trip.endDate)} ({duration}{' '}
              {duration === 1 ? 'day' : 'days'})
            </Text>
          </View>

          <View style={styles.heroCountdownRow}>
            <Clock color="#C2E6D1" size={15} />
            <Text style={styles.heroCountdown}>{countdown}</Text>
          </View>

          {/* Budget progress bar */}
          <View style={styles.heroBudgetBox}>
            <View style={styles.budgetLabelsRow}>
              <Text style={styles.budgetHeroLabel}>Spent: {formatCurrency(totalSpent, trip.currency)}</Text>
              <Text style={styles.budgetHeroLabel}>Budget: {formatCurrency(trip.budget, trip.currency)}</Text>
            </View>
            <View style={styles.heroProgressBar}>
              <View
                style={[
                  styles.heroProgressFill,
                  { width: `${budgetUsagePercent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Description note if present */}
        {trip.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{trip.description}</Text>
          </View>
        ) : null}

        {/* Feature Navigation Grid */}
        <View style={styles.featuresGrid}>
          {/* Itinerary */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/trip/itinerary',
                params: { tripId: trip.id },
              })
            }
          >
            <View style={[styles.featureIconBox, { backgroundColor: '#E6F5EC' }]}>
              <Calendar color={COLORS.primary} size={22} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Itinerary</Text>
              <Text style={styles.featureSub}>
                {itineraries.length} activities ({completedActivitiesCount} done)
              </Text>
            </View>
            <ChevronRight color={COLORS.secondaryText} size={18} />
          </TouchableOpacity>

          {/* Destinations */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/trip/destinations',
                params: { tripId: trip.id },
              })
            }
          >
            <View style={[styles.featureIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Compass color="#0284C7" size={22} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Destinations & Stops</Text>
              <Text style={styles.featureSub}>
                {trip.destinations?.length || 1} locations planned
              </Text>
            </View>
            <ChevronRight color={COLORS.secondaryText} size={18} />
          </TouchableOpacity>

          {/* Packing Checklist */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/trip/packing',
                params: { tripId: trip.id },
              })
            }
          >
            <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
              <ListTodo color="#D97706" size={22} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Packing Checklist</Text>
              <Text style={styles.featureSub}>
                {packedCount} / {packingItems.length} items packed
              </Text>
            </View>
            <ChevronRight color={COLORS.secondaryText} size={18} />
          </TouchableOpacity>

          {/* Notes */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/trip/notes',
                params: { tripId: trip.id },
              })
            }
          >
            <View style={[styles.featureIconBox, { backgroundColor: '#EDE9FE' }]}>
              <FileText color="#7C3AED" size={22} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Travel Notes & Passes</Text>
              <Text style={styles.featureSub}>
                {notes.length} {notes.length === 1 ? 'note' : 'notes'} saved
              </Text>
            </View>
            <ChevronRight color={COLORS.secondaryText} size={18} />
          </TouchableOpacity>

          {/* Group Expenses & Food Split */}
          <TouchableOpacity
            style={styles.featureCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/trip/group-expenses',
                params: { tripId: trip.id },
              })
            }
          >
            <View style={[styles.featureIconBox, { backgroundColor: '#E6F5EC' }]}>
              <Users color={COLORS.primary} size={22} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Group Expenses & Food Split</Text>
              <Text style={styles.featureSub}>
                {members.length > 0
                  ? `${members.length} members · Individual food & bill splits`
                  : 'Track individual food, split bills & export PDF'}
              </Text>
            </View>
            <ChevronRight color={COLORS.secondaryText} size={18} />
          </TouchableOpacity>
        </View>

        {/* Itinerary Preview Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Schedule Preview</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/trip/itinerary',
                params: { tripId: trip.id },
              })
            }
          >
            <Text style={styles.sectionActionText}>Manage All</Text>
          </TouchableOpacity>
        </View>

        {itineraries.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyActionCard}
            onPress={() =>
              router.push({
                pathname: '/trip/itinerary',
                params: { tripId: trip.id },
              })
            }
          >
            <Calendar color={COLORS.primary} size={24} />
            <Text style={styles.emptyActionTitle}>No activities scheduled</Text>
            <Text style={styles.emptyActionSub}>Tap to build your day-by-day itinerary</Text>
          </TouchableOpacity>
        ) : (
          itineraries.slice(0, 3).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itineraryPreviewItem}
              onPress={() => handleToggleItinerary(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>Day {item.dayNumber}</Text>
              </View>
              <View style={styles.itineraryCenter}>
                <Text
                  style={[
                    styles.itineraryTitle,
                    item.completed && styles.itemCompletedText,
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={styles.itineraryTime}>
                  {item.startTime} - {item.endTime} · {item.location}
                </Text>
              </View>
              {item.completed ? (
                <CheckCircle2 color={COLORS.success} size={22} />
              ) : (
                <Circle color={COLORS.secondaryText} size={22} />
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Packing Quick Check Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Packing Checklist Preview</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/trip/packing',
                params: { tripId: trip.id },
              })
            }
          >
            <Text style={styles.sectionActionText}>View Full List</Text>
          </TouchableOpacity>
        </View>

        {packingItems.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyActionCard}
            onPress={() =>
              router.push({
                pathname: '/trip/packing',
                params: { tripId: trip.id },
              })
            }
          >
            <ListTodo color={COLORS.primary} size={24} />
            <Text style={styles.emptyActionTitle}>Packing list is empty</Text>
            <Text style={styles.emptyActionSub}>Tap to add essentials</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.packingCard}>
            {packingItems.slice(0, 4).map((pack) => (
              <TouchableOpacity
                key={pack.id}
                style={styles.packingRow}
                onPress={() => handleTogglePacking(pack.id)}
                activeOpacity={0.7}
              >
                {pack.packed ? (
                  <CheckCircle2 color={COLORS.primary} size={20} />
                ) : (
                  <Circle color={COLORS.secondaryText} size={20} />
                )}
                <Text
                  style={[
                    styles.packingText,
                    pack.packed && styles.packingTextDone,
                  ]}
                  numberOfLines={1}
                >
                  {pack.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Trip Expenses Preview */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Trip Expenses</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/trip/group-expenses',
                  params: { tripId: trip.id },
                })
              }
            >
              <Text style={[styles.sectionActionText, { color: COLORS.primaryDark, fontWeight: '700' }]}>
                Group Splits
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/expenses')}
            >
              <Text style={styles.sectionActionText}>Expense Hub</Text>
            </TouchableOpacity>
          </View>
        </View>

        {expenses.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyActionCard}
            onPress={() => router.push('/(tabs)/expenses')}
          >
            <Wallet color={COLORS.primary} size={24} />
            <Text style={styles.emptyActionTitle}>No expenses logged yet</Text>
            <Text style={styles.emptyActionSub}>Tap to log your travel spending</Text>
          </TouchableOpacity>
        ) : (
          expenses.slice(0, 3).map((exp) => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              currency={trip.currency}
              onDelete={handleDeleteExpense}
            />
          ))
        )}
      </ScrollView>

      {/* Edit Trip Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
          <Header
            title="Edit Trip Details"
            onBack={() => setEditModalVisible(false)}
          />
          <TripForm
            initialTrip={trip}
            onSubmit={handleUpdateTrip}
            onCancel={() => setEditModalVisible(false)}
            submitButtonTitle="Update Trip"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceSubtle,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  heroDestination: {
    color: '#E6F5EC',
    fontSize: 14,
    fontWeight: '600',
  },
  statusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  heroDate: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
  },
  heroCountdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 16,
  },
  heroCountdown: {
    color: '#C2E6D1',
    fontSize: 13,
    fontWeight: '600',
  },
  heroBudgetBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  budgetLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetHeroLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  heroProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  descriptionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    lineHeight: 19,
  },
  featuresGrid: {
    gap: 10,
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  featureSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionActionText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyActionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  emptyActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  emptyActionSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 4,
  },
  itineraryPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dayBadgeText: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  itineraryCenter: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  itineraryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemCompletedText: {
    textDecorationLine: 'line-through',
    color: COLORS.secondaryText,
  },
  itineraryTime: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  packingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  packingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 10,
  },
  packingText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  packingTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.secondaryText,
  },
});
