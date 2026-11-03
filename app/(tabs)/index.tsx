import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Plus,
  Plane,
  Wallet,
  Sparkles,
  Calendar,
  Compass,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  ListTodo,
  Lightbulb,
  Globe,
  ChevronRight,
  X,
} from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { getTrips } from '../../src/services/tripService';
import { getExpenses } from '../../src/services/expenseService';
import { seedSampleData } from '../../src/services/seedData';
import { Trip } from '../../src/types/trip';
import { TripCard } from '../../src/components/trip/TripCard';
import { formatCurrency } from '../../src/utils/currency';
import {
  calculateDurationDays,
  getDaysCountdown,
  formatDateRange,
} from '../../src/utils/date';

const TRAVEL_TIPS = [
  {
    icon: '🎒',
    title: 'Smart Packing Strategy',
    tip: 'Roll clothes instead of folding to save 30% luggage space and prevent wrinkles.',
  },
  {
    icon: '💳',
    title: 'Currency & Spending',
    tip: 'Always pay in local currency at POS machines to avoid expensive dynamic conversion fees.',
  },
  {
    icon: '📶',
    title: '100% Offline Access',
    tip: 'TripMate stores all schedules, hotel codes, and packing lists locally on your phone.',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [tripsData, expensesData] = await Promise.all([
        getTrips(),
        getExpenses(),
      ]);
      setTrips(tripsData);
      const spent = expensesData.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0
      );
      setTotalSpent(spent);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLoadSamples = async () => {
    setLoading(true);
    await seedSampleData();
    await loadData();
  };

  // Time-aware dynamic greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: '☀️' };
    if (hour < 17) return { text: 'Good afternoon', icon: '🌤️' };
    return { text: 'Good evening', icon: '🌙' };
  }, []);

  const upcomingTrips = useMemo(
    () => trips.filter((t) => t.status === 'upcoming'),
    [trips]
  );
  const ongoingTrips = useMemo(
    () => trips.filter((t) => t.status === 'ongoing'),
    [trips]
  );

  const displayedTrips = useMemo(() => {
    if (!searchQuery.trim()) return upcomingTrips;
    const q = searchQuery.toLowerCase().trim();
    return trips.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        (t.destinations && t.destinations.some((d) => d.toLowerCase().includes(q)))
    );
  }, [trips, upcomingTrips, searchQuery]);

  const spotlightTrip = ongoingTrips[0] || upcomingTrips[0] || null;

  // Unique destinations count
  const uniqueDestinations = useMemo(() => {
    return new Set(trips.flatMap((t) => [t.destination, ...(t.destinations || [])]))
      .size;
  }, [trips]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const currentTip = TRAVEL_TIPS[tipIndex];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 24) + 10 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/images/app-logo.png')}
              style={styles.brandLogoHeader}
              resizeMode="contain"
            />
            <Text style={styles.brandTitleText}>TripMate</Text>
            <View style={styles.greetingBadge}>
              <Text style={styles.greetingBadgeIcon}>{greeting.icon}</Text>
              <Text style={styles.greetingBadgeText}>{greeting.text}</Text>
            </View>
          </View>
          <Text style={styles.headerHeadline}>Where to next?</Text>
        </View>

        <TouchableOpacity
          style={styles.avatarButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={styles.avatarInner}>
            <Image
              source={require('../../assets/images/app-logo.png')}
              style={{ width: 34, height: 34, borderRadius: 17 }}
              resizeMode="contain"
            />
          </View>
          {trips.length > 0 && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* Modern Search & Filter Pill */}
      <View style={styles.searchBar}>
        <Search color={COLORS.secondaryText} size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dream destinations, trips..."
          placeholderTextColor={COLORS.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => {
            if (searchQuery.trim()) {
              router.push('/(tabs)/trips');
            }
          }}
        />
        {searchQuery.trim().length > 0 ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X color={COLORS.secondaryText} size={16} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => router.push('/(tabs)/trips')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SlidersHorizontal color={COLORS.primary} size={17} />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Travel Action Pills */}
      <View style={styles.actionPillsContainer}>
        <TouchableOpacity
          style={[styles.actionPill, styles.actionPillPrimary]}
          onPress={() => router.push('/trip/create')}
          activeOpacity={0.8}
        >
          <View style={styles.actionPillIconCircle}>
            <Plus color={COLORS.white} size={16} />
          </View>
          <Text style={styles.actionPillPrimaryText}>Plan Trip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPill}
          onPress={() => router.push('/(tabs)/expenses')}
          activeOpacity={0.8}
        >
          <Wallet color={COLORS.primaryDark} size={16} />
          <Text style={styles.actionPillText}>Expenses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionPill}
          onPress={() => {
            if (trips.length > 0) {
              router.push({
                pathname: '/trip/packing',
                params: { tripId: trips[0].id },
              });
            } else {
              router.push('/trip/create');
            }
          }}
          activeOpacity={0.8}
        >
          <ListTodo color={COLORS.primaryDark} size={16} />
          <Text style={styles.actionPillText}>Packing</Text>
        </TouchableOpacity>

        {trips.length === 0 && (
          <TouchableOpacity
            style={styles.actionPill}
            onPress={handleLoadSamples}
            activeOpacity={0.8}
          >
            <Sparkles color="#D97706" size={16} />
            <Text style={[styles.actionPillText, { color: '#B45309' }]}>Demo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Trending Spotlight Hero Card */}
      {spotlightTrip ? (
        <View style={styles.spotlightCard}>
          <View style={styles.spotlightTopRow}>
            <View
              style={[
                styles.spotlightBadge,
                spotlightTrip.status === 'ongoing'
                  ? styles.spotlightBadgeLive
                  : styles.spotlightBadgeUpcoming,
              ]}
            >
              {spotlightTrip.status === 'ongoing' ? (
                <View style={styles.pulsingLiveDot} />
              ) : (
                <Sparkles color="#A7F3D0" size={12} style={{ marginRight: 4 }} />
              )}
              <Text
                style={[
                  styles.spotlightBadgeText,
                  spotlightTrip.status === 'ongoing' && styles.spotlightBadgeTextLive,
                ]}
              >
                {spotlightTrip.status === 'ongoing'
                  ? 'LIVE EXPEDITION'
                  : 'NEXT ADVENTURE'}
              </Text>
            </View>

            <View style={styles.spotlightCountdownChip}>
              <Clock color="#E6F5EC" size={12} />
              <Text style={styles.spotlightCountdownText}>
                {getDaysCountdown(spotlightTrip.startDate, spotlightTrip.endDate)}
              </Text>
            </View>
          </View>

          <Text style={styles.spotlightTitle}>{spotlightTrip.title}</Text>

          <View style={styles.spotlightLocationRow}>
            <MapPin color="#A7F3D0" size={16} />
            <Text style={styles.spotlightLocation} numberOfLines={1}>
              {spotlightTrip.destination}
            </Text>
          </View>

          <View style={styles.spotlightMetaRow}>
            <Calendar color="#C2E6D1" size={14} />
            <Text style={styles.spotlightDateText}>
              {formatDateRange(spotlightTrip.startDate, spotlightTrip.endDate)} ·{' '}
              {calculateDurationDays(spotlightTrip.startDate, spotlightTrip.endDate)}{' '}
              days
            </Text>
          </View>

          <View style={styles.spotlightDivider} />

          <View style={styles.spotlightFooter}>
            <View>
              <Text style={styles.spotlightBudgetLabel}>BUDGET</Text>
              <Text style={styles.spotlightBudgetValue}>
                {formatCurrency(spotlightTrip.budget, spotlightTrip.currency)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.spotlightActionBtn}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/trip/[id]',
                  params: { id: spotlightTrip.id },
                })
              }
            >
              <Text style={styles.spotlightActionBtnText}>Explore Trip</Text>
              <ArrowRight color={COLORS.primaryDark} size={15} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyHeroCard}>
          <View style={styles.emptyHeroIconContainer}>
            <Globe color={COLORS.primary} size={30} />
          </View>
          <Text style={styles.emptyHeroTitle}>Your Journey Starts Here</Text>
          <Text style={styles.emptyHeroSubtitle}>
            Create your itinerary, organize stops, track expenses and travel offline
            with zero stress.
          </Text>
          <View style={styles.emptyHeroButtonsRow}>
            <TouchableOpacity
              style={styles.emptyHeroPrimaryBtn}
              onPress={() => router.push('/trip/create')}
              activeOpacity={0.85}
            >
              <Plus color={COLORS.white} size={16} />
              <Text style={styles.emptyHeroPrimaryBtnText}>Create Journey</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emptyHeroSecondaryBtn}
              onPress={handleLoadSamples}
              activeOpacity={0.85}
            >
              <Sparkles color={COLORS.primaryDark} size={15} />
              <Text style={styles.emptyHeroSecondaryBtnText}>Load Demo Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Travel Passport Snapshot Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricNumber}>{trips.length}</Text>
          <Text style={styles.metricLabel}>Total Trips</Text>
        </View>

        <View style={styles.metricSeparator} />

        <View style={styles.metricItem}>
          <Text style={styles.metricNumber}>{uniqueDestinations}</Text>
          <Text style={styles.metricLabel}>Destinations</Text>
        </View>

        <View style={styles.metricSeparator} />

        <View style={styles.metricItem}>
          <Text style={styles.metricNumberSmall} numberOfLines={1}>
            {formatCurrency(totalSpent)}
          </Text>
          <Text style={styles.metricLabel}>Spent</Text>
        </View>
      </View>

      {/* Upcoming Trips Section */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWithBadge}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim()
              ? `Search Results (${displayedTrips.length})`
              : 'Planned Journeys'}
          </Text>
          {!searchQuery.trim() && upcomingTrips.length > 0 && (
            <View style={styles.sectionCountBadge}>
              <Text style={styles.sectionCountText}>{upcomingTrips.length}</Text>
            </View>
          )}
        </View>

        {trips.length > 0 && (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/trips')}
          >
            <Text style={styles.seeAllText}>View All</Text>
            <ChevronRight color={COLORS.primary} size={16} />
          </TouchableOpacity>
        )}
      </View>

      {displayedTrips.length === 0 ? (
        <View style={styles.noTripsBox}>
          <Compass color={COLORS.mutedText} size={32} />
          <Text style={styles.noTripsTitle}>
            {searchQuery.trim()
              ? 'No matching destinations'
              : 'No upcoming trips yet'}
          </Text>
          <Text style={styles.noTripsDesc}>
            {searchQuery.trim()
              ? 'Try a different search keyword or clear the search.'
              : 'Tap "Plan Trip" above to schedule your first destination.'}
          </Text>
        </View>
      ) : (
        displayedTrips.slice(0, 4).map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))
      )}

      {/* Smart Traveler Pro-Tip Card */}
      <TouchableOpacity
        style={styles.tipCard}
        activeOpacity={0.9}
        onPress={() => setTipIndex((prev) => (prev + 1) % TRAVEL_TIPS.length)}
      >
        <View style={styles.tipTopRow}>
          <View style={styles.tipBadge}>
            <Lightbulb color="#D97706" size={14} />
            <Text style={styles.tipBadgeText}>TRAVEL PRO-TIP</Text>
          </View>
          <Text style={styles.tipTapHint}>Tap for next tip</Text>
        </View>

        <View style={styles.tipContentRow}>
          <Text style={styles.tipEmoji}>{currentTip.icon}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.tipTitle}>{currentTip.title}</Text>
            <Text style={styles.tipText}>{currentTip.tip}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F6',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greetingContainer: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  brandLogoHeader: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  brandTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  greetingBadgeIcon: {
    fontSize: 14,
  },
  greetingBadgeText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  headerHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  avatarButton: {
    position: 'relative',
    marginLeft: 12,
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  activeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(22, 131, 74, 0.1)',
    marginBottom: 16,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    height: '100%',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionPillPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionPillIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillPrimaryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  actionPillText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  spotlightCard: {
    backgroundColor: '#0F4E2D',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: '#0A3820',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  spotlightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  spotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  spotlightBadgeUpcoming: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  spotlightBadgeLive: {
    backgroundColor: '#DCFCE7',
  },
  spotlightBadgeText: {
    color: '#D1FAE5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  spotlightBadgeTextLive: {
    color: '#166534',
  },
  pulsingLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  spotlightCountdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  spotlightCountdownText: {
    color: '#E6F5EC',
    fontSize: 11,
    fontWeight: '600',
  },
  spotlightTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  spotlightLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  spotlightLocation: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1FAE5',
  },
  spotlightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spotlightDateText: {
    fontSize: 12,
    color: '#A7F3D0',
    fontWeight: '500',
  },
  spotlightDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 14,
  },
  spotlightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotlightBudgetLabel: {
    fontSize: 10,
    color: '#A7F3D0',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  spotlightBudgetValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    marginTop: 2,
  },
  spotlightActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    gap: 6,
  },
  spotlightActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  emptyHeroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyHeroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyHeroSubtitle: {
    fontSize: 13,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
    marginBottom: 18,
  },
  emptyHeroButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyHeroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  emptyHeroPrimaryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyHeroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  emptyHeroSecondaryBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  metricsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricSeparator: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricNumberSmall: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  sectionCountBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  noTripsBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  noTripsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  noTripsDesc: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 4,
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: '#FEFCE8',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginTop: 10,
  },
  tipTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tipBadgeText: {
    color: '#854D0E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tipTapHint: {
    fontSize: 11,
    color: '#A16207',
    fontWeight: '600',
  },
  tipContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 26,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#713F12',
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: '#854D0E',
    lineHeight: 17,
  },
});
