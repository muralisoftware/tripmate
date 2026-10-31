import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Link, useRouter, useFocusEffect } from 'expo-router';
import {
  MapPin,
  Plus,
  Plane,
  Wallet,
  Sparkles,
  Calendar,
  Compass,
  ArrowRight,
} from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { getTrips } from '../../src/services/tripService';
import { getExpenses } from '../../src/services/expenseService';
import { seedSampleData } from '../../src/services/seedData';
import { Trip } from '../../src/types/trip';
import { TripCard } from '../../src/components/trip/TripCard';
import { formatCurrency } from '../../src/utils/currency';

export default function HomeScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const upcomingTrips = trips.filter((t) => t.status === 'upcoming');
  const ongoingTrips = trips.filter((t) => t.status === 'ongoing');

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Traveller 👋</Text>
          <Text style={styles.subtitle}>Where are you going next?</Text>
        </View>

        <TouchableOpacity
          style={styles.logo}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Plane color={COLORS.white} size={22} />
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>
          Your next adventure starts here!
        </Text>
        <Text style={styles.bannerSubtitle}>
          Plan your journey, track expenses, and make memories.
        </Text>

        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.85}
            onPress={() => router.push('/trip/create')}
          >
            <Plus color={COLORS.primary} size={18} />
            <Text style={styles.createButtonText}>Create New Trip</Text>
          </TouchableOpacity>

          {trips.length === 0 && (
            <TouchableOpacity
              style={styles.sampleButton}
              activeOpacity={0.85}
              onPress={handleLoadSamples}
            >
              <Sparkles color={COLORS.white} size={16} />
              <Text style={styles.sampleButtonText}>Load Samples</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Overview</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#E6F5EC' }]}>
            <Plane color={COLORS.primary} size={20} />
          </View>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#E0F2FE' }]}>
            <MapPin color="#0284C7" size={20} />
          </View>
          <Text style={styles.statNumber}>{upcomingTrips.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Wallet color="#D97706" size={20} />
          </View>
          <Text style={styles.statNumberSmall} numberOfLines={1}>
            {formatCurrency(totalSpent)}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
      </View>

      {/* Ongoing Trips Highlight */}
      {ongoingTrips.length > 0 && (
        <View style={styles.ongoingSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.liveTagRow}>
              <View style={styles.pulsingDot} />
              <Text style={styles.sectionTitle}>Happening Now</Text>
            </View>
          </View>
          {ongoingTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </View>
      )}

      {/* Upcoming Trips Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Upcoming Trips</Text>
        {upcomingTrips.length > 0 && (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/trips')}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <ArrowRight color={COLORS.primary} size={14} />
          </TouchableOpacity>
        )}
      </View>

      {upcomingTrips.length === 0 && ongoingTrips.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Compass color={COLORS.primary} size={36} />
          </View>
          <Text style={styles.emptyTitle}>No upcoming trips yet</Text>
          <Text style={styles.emptyText}>
            Ready to explore? Create your first trip itinerary or load sample data to explore features.
          </Text>
          <View style={styles.emptyButtonsRow}>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => router.push('/trip/create')}
            >
              <Plus color={COLORS.white} size={16} />
              <Text style={styles.emptyCreateText}>Plan a Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emptySampleBtn}
              onPress={handleLoadSamples}
            >
              <Sparkles color={COLORS.primary} size={16} />
              <Text style={styles.emptySampleText}>Load Demo Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        upcomingTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
      )}

      {/* Footer message */}
      <View style={styles.footer}>
        <Wallet color={COLORS.secondaryText} size={16} />
        <Text style={styles.footerText}>Every journey begins with a plan.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 35,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.secondaryText,
    marginTop: 4,
    fontSize: 14,
  },
  logo: {
    backgroundColor: COLORS.primary,
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  banner: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 22,
    marginBottom: 24,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 28,
  },
  bannerSubtitle: {
    color: '#E6F5EC',
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  createButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  createButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  sampleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  sampleButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  statNumberSmall: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
    fontWeight: '500',
  },
  ongoingSection: {
    marginBottom: 16,
  },
  liveTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.success,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyText: {
    color: COLORS.secondaryText,
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  emptyButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  emptyCreateBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  emptyCreateText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  emptySampleBtn: {
    backgroundColor: COLORS.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
  },
  emptySampleText: {
    color: COLORS.primaryDark,
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  footerText: {
    color: COLORS.secondaryText,
    fontSize: 13,
  },
});
