import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react-native';
import { Trip } from '../../types/trip';
import { COLORS } from '../../constants/colors';
import { formatDateRange, calculateDurationDays, getDaysCountdown } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';

interface TripCardProps {
  trip: Trip;
  totalSpent?: number;
}

export function TripCard({ trip, totalSpent }: TripCardProps) {
  const router = useRouter();
  const duration = calculateDurationDays(trip.startDate, trip.endDate);
  const countdown = getDaysCountdown(trip.startDate, trip.endDate);

  const getStatusBadge = () => {
    switch (trip.status) {
      case 'ongoing':
        return {
          bg: '#DCFCE7',
          color: '#15803D',
          label: 'Ongoing',
        };
      case 'upcoming':
        return {
          bg: '#E0F2FE',
          color: '#0369A1',
          label: 'Upcoming',
        };
      case 'completed':
        return {
          bg: '#F3F4F6',
          color: '#4B5563',
          label: 'Completed',
        };
      default:
        return {
          bg: COLORS.primaryLight,
          color: COLORS.primary,
          label: trip.status,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => {
        router.push({
          pathname: '/trip/[id]',
          params: { id: trip.id },
        });
      }}
    >
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.statusText, { color: badge.color }]}>
            {badge.label}
          </Text>
        </View>
        <Text style={styles.durationText}>{duration} {duration === 1 ? 'day' : 'days'}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {trip.title}
      </Text>

      <View style={styles.infoRow}>
        <MapPin color={COLORS.primary} size={16} />
        <Text style={styles.infoText} numberOfLines={1}>
          {trip.destination}
          {trip.destinations && trip.destinations.length > 1
            ? ` (+${trip.destinations.length - 1} stops)`
            : ''}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Calendar color={COLORS.secondaryText} size={16} />
        <Text style={styles.dateText}>
          {formatDateRange(trip.startDate, trip.endDate)}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.countdownBox}>
          <Clock color={COLORS.secondaryText} size={14} />
          <Text style={styles.countdownText} numberOfLines={1}>
            {countdown}
          </Text>
        </View>

        <View style={styles.budgetBox}>
          <Text style={styles.budgetLabel}>Budget</Text>
          <Text style={styles.budgetValue}>
            {formatCurrency(trip.budget, trip.currency)}
          </Text>
        </View>

        <View style={styles.arrowIcon}>
          <ArrowRight color={COLORS.primary} size={16} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 7,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  countdownText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  budgetBox: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  budgetLabel: {
    fontSize: 10,
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  arrowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
