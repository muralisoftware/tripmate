import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MapPin, Plus, Trash2, Compass } from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { AppInput } from '../../src/components/common/AppInput';
import { AppButton } from '../../src/components/common/AppButton';
import { EmptyState } from '../../src/components/common/EmptyState';
import { getTripById, updateTrip } from '../../src/services/tripService';
import { Trip } from '../../src/types/trip';

export default function DestinationsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [newStop, setNewStop] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const data = await getTripById(tripId);
      if (data) {
        setTrip(data);
        setStops(data.destinations || [data.destination]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadTrip();
    }, [loadTrip])
  );

  const handleAddStop = async () => {
    const trimmed = newStop.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Please enter a destination name.');
      return;
    }
    if (stops.includes(trimmed)) {
      Alert.alert('Duplicate', 'This destination is already in your stops list.');
      return;
    }

    const updatedStops = [...stops, trimmed];
    setStops(updatedStops);
    setNewStop('');

    if (trip) {
      const updatedTrip: Trip = {
        ...trip,
        destinations: updatedStops,
      };
      await updateTrip(updatedTrip);
      setTrip(updatedTrip);
    }
  };

  const handleRemoveStop = async (index: number) => {
    if (stops.length <= 1) {
      Alert.alert('Cannot Remove', 'A trip must have at least one destination.');
      return;
    }

    const updatedStops = stops.filter((_, i) => i !== index);
    setStops(updatedStops);

    if (trip) {
      const updatedTrip: Trip = {
        ...trip,
        destinations: updatedStops,
        destination: updatedStops[0], // update primary if needed
      };
      await updateTrip(updatedTrip);
      setTrip(updatedTrip);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Destinations & Stops"
        subtitle={trip?.title}
        onBack={() => router.back()}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Destination Card */}
        <View style={styles.addCard}>
          <Text style={styles.cardTitle}>Add Next Stop</Text>
          <View style={styles.inputRow}>
            <AppInput
              placeholder="e.g. Venice, Santorini, Zurich"
              value={newStop}
              onChangeText={setNewStop}
              containerStyle={{ flex: 1, marginBottom: 0 }}
              onSubmitEditing={handleAddStop}
              leftIcon={<MapPin color={COLORS.primary} size={18} />}
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddStop}
              activeOpacity={0.8}
            >
              <Plus color={COLORS.white} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Route & Stops ({stops.length})
        </Text>

        {stops.map((stop, index) => {
          const isPrimary = index === 0;
          return (
            <View key={index} style={styles.stopCard}>
              <View style={styles.stopNumberCircle}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>

              <View style={styles.stopInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.stopName}>{stop}</Text>
                  {isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.stopSub}>
                  {isPrimary ? 'Starting Destination' : `Stop #${index + 1}`}
                </Text>
              </View>

              {stops.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveStop(index)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 color={COLORS.secondaryText} size={16} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  addCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stopNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopNumberText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  stopInfo: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  primaryBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  primaryBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  stopSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
});
