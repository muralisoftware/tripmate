import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { TripForm } from '../../src/components/trip/TripForm';
import { addTrip } from '../../src/services/tripService';
import { seedDefaultPackingList } from '../../src/services/packingService';
import { scheduleTripReminder } from '../../src/services/notificationService';
import { Trip } from '../../src/types/trip';

export default function CreateTripScreen() {
  const router = useRouter();

  const handleCreateTrip = async (trip: Trip) => {
    await addTrip(trip);
    // Seed default packing checklist for this trip
    await seedDefaultPackingList(trip.id);
    // Schedule reminder
    await scheduleTripReminder(
      trip.id,
      trip.title,
      trip.destination,
      trip.startDate
    );
    // Navigate to Trip Details
    router.replace({
      pathname: '/trip/[id]',
      params: { id: trip.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Create New Trip"
        subtitle="Plan dates, budget & stops"
        onBack={() => router.back()}
      />
      <View style={styles.formContainer}>
        <TripForm
          onSubmit={handleCreateTrip}
          onCancel={() => router.back()}
          submitButtonTitle="Create Trip"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
