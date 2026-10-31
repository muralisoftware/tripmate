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
  SafeAreaView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Trash2,
  X,
  Check,
  Calendar,
} from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { Header } from '../../src/components/common/Header';
import { AppInput } from '../../src/components/common/AppInput';
import { AppButton } from '../../src/components/common/AppButton';
import { EmptyState } from '../../src/components/common/EmptyState';
import { getTripById } from '../../src/services/tripService';
import {
  getItinerariesByTrip,
  addItinerary,
  toggleItineraryComplete,
  deleteItinerary,
} from '../../src/services/itineraryService';
import { Trip } from '../../src/types/trip';
import { Itinerary } from '../../src/types/itinerary';
import { calculateDurationDays } from '../../src/utils/date';

export default function ItineraryScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  // Add Activity Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [activityDay, setActivityDay] = useState('1');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityLocation, setActivityLocation] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [activityDesc, setActivityDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const itinScrollRef = useRef<any>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!tripId) return;
    try {
      const [tripData, itinData] = await Promise.all([
        getTripById(tripId),
        getItinerariesByTrip(tripId),
      ]);
      setTrip(tripData || null);
      setItineraries(itinData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const totalDays = trip ? calculateDurationDays(trip.startDate, trip.endDate) : 1;

  const filteredItineraries = useMemo(() => {
    if (selectedDay === 'all') return itineraries;
    return itineraries.filter((i) => i.dayNumber === selectedDay);
  }, [itineraries, selectedDay]);

  const handleToggle = async (id: string) => {
    await toggleItineraryComplete(id);
    loadData();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Activity', 'Remove this activity from your itinerary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItinerary(id);
          loadData();
        },
      },
    ]);
  };

  const handleOpenAddModal = (day?: number) => {
    setActivityDay(day ? String(day) : selectedDay === 'all' ? '1' : String(selectedDay));
    setActivityTitle('');
    setActivityLocation(trip?.destination || '');
    setStartTime('10:00 AM');
    setEndTime('12:00 PM');
    setActivityDesc('');
    setModalVisible(true);
  };

  const handleSaveActivity = async () => {
    if (!activityTitle.trim()) {
      Alert.alert('Validation', 'Please enter an activity title.');
      return;
    }
    const dayNum = parseInt(activityDay, 10);
    if (isNaN(dayNum) || dayNum < 1) {
      Alert.alert('Validation', 'Please enter a valid day number (1 or greater).');
      return;
    }

    setSaving(true);
    try {
      const newItem: Itinerary = {
        id: `itin_${Date.now()}`,
        tripId: tripId!,
        dayNumber: dayNum,
        title: activityTitle.trim(),
        location: activityLocation.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        description: activityDesc.trim(),
        completed: false,
      };

      await addItinerary(newItem);
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save activity.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const daysList: (number | 'all')[] = ['all'];
  for (let d = 1; d <= totalDays; d++) {
    daysList.push(d);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Day-wise Itinerary"
        subtitle={trip?.title}
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleOpenAddModal()}
            activeOpacity={0.8}
          >
            <Plus color={COLORS.white} size={18} />
            <Text style={styles.addBtnText}>Activity</Text>
          </TouchableOpacity>
        }
      />

      {/* Days Horizontal Picker */}
      <View style={styles.daysBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScroll}
        >
          {daysList.map((d) => {
            const isSelected = selectedDay === d;
            return (
              <TouchableOpacity
                key={String(d)}
                style={[styles.dayChip, isSelected && styles.dayChipActive]}
                onPress={() => setSelectedDay(d)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextActive,
                  ]}
                >
                  {d === 'all' ? 'All Days' : `Day ${d}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredItineraries.length === 0 ? (
          <EmptyState
            icon={<Calendar color={COLORS.primary} size={32} />}
            title="No activities planned yet"
            description={
              selectedDay === 'all'
                ? 'Add morning walks, sightseeing, dinners, and museum visits to your itinerary.'
                : `No activities scheduled for Day ${selectedDay}. Tap below to add one.`
            }
            actionTitle="Add Activity"
            onAction={() => handleOpenAddModal(selectedDay === 'all' ? 1 : selectedDay)}
          />
        ) : (
          filteredItineraries.map((item) => (
            <View key={item.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={styles.dayTag}>
                  <Text style={styles.dayTagText}>Day {item.dayNumber}</Text>
                </View>

                <View style={styles.timeTag}>
                  <Clock color={COLORS.secondaryText} size={14} />
                  <Text style={styles.timeTagText}>
                    {item.startTime} – {item.endTime}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.trashBtn}
                  onPress={() => handleDelete(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 color={COLORS.secondaryText} size={16} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.activityBody}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.checkboxWrapper}>
                  {item.completed ? (
                    <CheckCircle2 color={COLORS.success} size={24} />
                  ) : (
                    <Circle color={COLORS.secondaryText} size={24} />
                  )}
                </View>

                <View style={styles.activityDetails}>
                  <Text
                    style={[
                      styles.activityTitle,
                      item.completed && styles.completedText,
                    ]}
                  >
                    {item.title}
                  </Text>

                  {item.location ? (
                    <View style={styles.locationRow}>
                      <MapPin color={COLORS.primary} size={14} />
                      <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                  ) : null}

                  {item.description ? (
                    <Text style={styles.descText}>{item.description}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Activity Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setModalVisible(false);
        }}
      >
        <View style={[styles.modalOverlay, { paddingBottom: keyboardHeight }]}>
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setModalVisible(false);
            }}
          >
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.modalContent,
              {
                maxHeight:
                  keyboardHeight > 0
                    ? Math.max(300, screenHeight - keyboardHeight - (Platform.OS === 'android' ? 50 : 70))
                    : '88%',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Itinerary Activity</Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setModalVisible(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X color={COLORS.secondaryText} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={itinScrollRef}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <AppInput
                label="Day Number *"
                placeholder="e.g. 1"
                value={activityDay}
                onChangeText={setActivityDay}
                keyboardType="numeric"
              />

              <AppInput
                label="Activity Title *"
                placeholder="e.g. Sunrise boat tour, Museum visit"
                value={activityTitle}
                onChangeText={setActivityTitle}
              />

              <AppInput
                label="Location / Meeting Point"
                placeholder="e.g. South Pier Gate 4"
                value={activityLocation}
                onChangeText={setActivityLocation}
                leftIcon={<MapPin color={COLORS.primary} size={18} />}
              />

              <View style={styles.timeRow}>
                <View style={{ flex: 1 }}>
                  <AppInput
                    label="Start Time"
                    placeholder="09:00 AM"
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <AppInput
                    label="End Time"
                    placeholder="11:30 AM"
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                </View>
              </View>

              <AppInput
                label="Notes / Tips"
                placeholder="e.g. Pre-booked tickets on phone, remember sunscreen"
                value={activityDesc}
                onChangeText={setActivityDesc}
                multiline
                onFocus={() => {
                  setTimeout(() => {
                    itinScrollRef.current?.scrollToEnd({ animated: true });
                  }, 120);
                }}
              />

              <AppButton
                title="Save Activity"
                onPress={handleSaveActivity}
                loading={saving}
                icon={<Check color={COLORS.white} size={18} />}
                style={{ marginTop: 10, marginBottom: 10 }}
              />
            </ScrollView>
          </View>
        </View>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  daysBar: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  daysScroll: {
    paddingHorizontal: 18,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  dayChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginLeft: 10,
  },
  timeTagText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  trashBtn: {
    padding: 4,
  },
  activityBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxWrapper: {
    marginTop: 2,
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: COLORS.secondaryText,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
  descText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    lineHeight: 18,
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeRow: {
    flexDirection: 'row',
  },
});
