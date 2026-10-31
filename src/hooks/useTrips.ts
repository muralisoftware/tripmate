import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { Trip } from '../types/trip';
import { getTrips } from '../services/tripService';
import { getExpenses } from '../services/expenseService';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

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
      console.error('Failed to load trips hook data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const upcomingTrips = trips.filter((t) => t.status === 'upcoming');
  const ongoingTrips = trips.filter((t) => t.status === 'ongoing');
  const completedTrips = trips.filter((t) => t.status === 'completed');

  return {
    trips,
    upcomingTrips,
    ongoingTrips,
    completedTrips,
    loading,
    totalSpent,
    reload: loadData,
  };
}
