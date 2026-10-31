import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Compass,
  SlidersHorizontal,
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { getTrips } from '../../src/services/tripService';
import { Trip, TripStatus } from '../../src/types/trip';
import { TripCard } from '../../src/components/trip/TripCard';
import { EmptyState } from '../../src/components/common/EmptyState';

type FilterTab = 'all' | TripStatus;

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadTrips = useCallback(async () => {
    try {
      const data = await getTrips();
      setTrips(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchesFilter =
        activeFilter === 'all' ? true : t.status === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        (t.destinations &&
          t.destinations.some((d) => d.toLowerCase().includes(q)));
      return matchesFilter && matchesSearch;
    });
  }, [trips, activeFilter, searchQuery]);

  const filterCounts = useMemo(() => {
    return {
      all: trips.length,
      upcoming: trips.filter((t) => t.status === 'upcoming').length,
      ongoing: trips.filter((t) => t.status === 'ongoing').length,
      completed: trips.filter((t) => t.status === 'completed').length,
    };
  }, [trips]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>My Journeys</Text>
          <Text style={styles.screenSubtitle}>
            {trips.length} {trips.length === 1 ? 'trip' : 'trips'} planned
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/trip/create')}
          activeOpacity={0.8}
        >
          <Plus color={COLORS.white} size={20} />
          <Text style={styles.addButtonText}>New Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color={COLORS.secondaryText} size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trips by name or destination..."
            placeholderTextColor={COLORS.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterTabsRow}>
        {(['all', 'ongoing', 'upcoming', 'completed'] as FilterTab[]).map(
          (tab) => {
            const isSelected = activeFilter === tab;
            const count = filterCounts[tab];
            const label =
              tab === 'all'
                ? 'All'
                : tab.charAt(0).toUpperCase() + tab.slice(1);

            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  isSelected && styles.filterTabActive,
                ]}
                onPress={() => setActiveFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isSelected && styles.filterTabTextActive,
                  ]}
                >
                  {label}
                </Text>
                <View
                  style={[
                    styles.badge,
                    isSelected && styles.badgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isSelected && styles.badgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      {/* Trips List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {filteredTrips.length === 0 ? (
          <EmptyState
            icon={<Compass color={COLORS.primary} size={32} />}
            title={
              searchQuery
                ? 'No matching trips found'
                : activeFilter === 'all'
                ? 'No trips created yet'
                : `No ${activeFilter} trips`
            }
            description={
              searchQuery
                ? 'Try searching with a different destination or trip name.'
                : 'Start organizing your itinerary, budget, and packing list by creating a trip.'
            }
            actionTitle={searchQuery ? 'Clear Search' : 'Create a Trip'}
            onAction={() => {
              if (searchQuery) {
                setSearchQuery('');
              } else {
                router.push('/trip/create');
              }
            }}
          />
        ) : (
          filteredTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)
        )}
      </ScrollView>
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
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSubtle,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  filterTabTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },
  badgeTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
