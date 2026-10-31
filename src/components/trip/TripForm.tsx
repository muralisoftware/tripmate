import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Compass,
  MapPin,
  Calendar,
  IndianRupee,
  FileText,
  Plus,
  X,
  Check,
} from 'lucide-react-native';
import { Trip } from '../../types/trip';
import { COLORS } from '../../constants/colors';
import { CURRENCIES, DEFAULT_CURRENCY } from '../../constants/config';
import { AppInput } from '../common/AppInput';
import { AppButton } from '../common/AppButton';
import { getTodayDateString, addDays, getTripStatus } from '../../utils/date';

interface TripFormProps {
  initialTrip?: Trip;
  onSubmit: (trip: Trip) => Promise<void>;
  onCancel?: () => void;
  submitButtonTitle?: string;
}

export function TripForm({
  initialTrip,
  onSubmit,
  onCancel,
  submitButtonTitle = 'Save Trip',
}: TripFormProps) {
  const today = getTodayDateString();
  const defaultEnd = addDays(today, 5);

  const [title, setTitle] = useState(initialTrip?.title || '');
  const [destination, setDestination] = useState(initialTrip?.destination || '');
  const [additionalStops, setAdditionalStops] = useState<string[]>(
    initialTrip?.destinations || []
  );
  const [newStopInput, setNewStopInput] = useState('');
  const [startDate, setStartDate] = useState(initialTrip?.startDate || today);
  const [endDate, setEndDate] = useState(initialTrip?.endDate || defaultEnd);
  const [budget, setBudget] = useState(
    initialTrip?.budget ? String(initialTrip.budget) : '50000'
  );
  const [currency, setCurrency] = useState(
    initialTrip?.currency || DEFAULT_CURRENCY
  );
  const [description, setDescription] = useState(
    initialTrip?.description || ''
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleAddStop = () => {
    const trimmed = newStopInput.trim();
    if (trimmed && !additionalStops.includes(trimmed)) {
      setAdditionalStops([...additionalStops, trimmed]);
      setNewStopInput('');
    }
  };

  const handleRemoveStop = (index: number) => {
    setAdditionalStops(additionalStops.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) {
      nextErrors.title = 'Trip title is required';
    }

    if (!destination.trim()) {
      nextErrors.destination = 'Destination is required';
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !dateRegex.test(startDate)) {
      nextErrors.startDate = 'Please enter valid date in YYYY-MM-DD';
    }

    if (!endDate || !dateRegex.test(endDate)) {
      nextErrors.endDate = 'Please enter valid date in YYYY-MM-DD';
    } else if (startDate && endDate < startDate) {
      nextErrors.endDate = 'End date cannot be earlier than start date';
    }

    const numBudget = Number(budget);
    if (isNaN(numBudget) || numBudget < 0) {
      nextErrors.budget = 'Please enter a valid budget amount';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields before saving.');
      return;
    }

    setLoading(true);
    try {
      const tripData: Trip = {
        id: initialTrip?.id || `trip_${Date.now()}`,
        title: title.trim(),
        destination: destination.trim(),
        destinations: additionalStops.length > 0 ? additionalStops : [destination.trim()],
        startDate,
        endDate,
        budget: Number(budget) || 0,
        currency,
        description: description.trim(),
        status: getTripStatus(startDate, endDate),
        createdAt: initialTrip?.createdAt || new Date().toISOString(),
      };

      await onSubmit(tripData);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Trip Basics</Text>

        <AppInput
          label="Trip Name *"
          placeholder="e.g. Summer in Switzerland, Goa Weekend"
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            if (errors.title) setErrors({ ...errors, title: '' });
          }}
          error={errors.title}
          leftIcon={<Compass color={COLORS.primary} size={20} />}
        />

        <AppInput
          label="Primary Destination *"
          placeholder="e.g. Kyoto, Japan or Manali, India"
          value={destination}
          onChangeText={(val) => {
            setDestination(val);
            if (errors.destination) setErrors({ ...errors, destination: '' });
          }}
          error={errors.destination}
          leftIcon={<MapPin color={COLORS.primary} size={20} />}
        />

        {/* Additional Destinations / Stops */}
        <View style={styles.stopsContainer}>
          <Text style={styles.fieldLabel}>Additional Stops (Optional)</Text>
          <View style={styles.addStopRow}>
            <AppInput
              placeholder="Add stop or city (e.g. Venice)"
              value={newStopInput}
              onChangeText={setNewStopInput}
              containerStyle={styles.stopInput}
              onSubmitEditing={handleAddStop}
            />
            <TouchableOpacity
              style={styles.addStopBtn}
              onPress={handleAddStop}
              activeOpacity={0.7}
            >
              <Plus color={COLORS.white} size={20} />
            </TouchableOpacity>
          </View>

          {additionalStops.length > 0 && (
            <View style={styles.tagsWrapper}>
              {additionalStops.map((stop, index) => (
                <View key={index} style={styles.stopTag}>
                  <Text style={styles.stopTagText}>{stop}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveStop(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X color={COLORS.primaryDark} size={14} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Dates & Duration</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateCol}>
            <AppInput
              label="Start Date *"
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={(val) => {
                setStartDate(val);
                if (errors.startDate) setErrors({ ...errors, startDate: '' });
              }}
              error={errors.startDate}
              leftIcon={<Calendar color={COLORS.primary} size={18} />}
            />
          </View>
          <View style={styles.dateCol}>
            <AppInput
              label="End Date *"
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={(val) => {
                setEndDate(val);
                if (errors.endDate) setErrors({ ...errors, endDate: '' });
              }}
              error={errors.endDate}
              leftIcon={<Calendar color={COLORS.primary} size={18} />}
            />
          </View>
        </View>

        {/* Quick Date Presets */}
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => {
              const start = addDays(today, 1);
              const end = addDays(today, 3);
              setStartDate(start);
              setEndDate(end);
            }}
          >
            <Text style={styles.presetChipText}>Weekend (2d)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => {
              const start = addDays(today, 7);
              const end = addDays(today, 14);
              setStartDate(start);
              setEndDate(end);
            }}
          >
            <Text style={styles.presetChipText}>Next Week (7d)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => {
              const start = addDays(today, 30);
              const end = addDays(today, 45);
              setStartDate(start);
              setEndDate(end);
            }}
          >
            <Text style={styles.presetChipText}>Next Month (15d)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Budget & Currency</Text>

        {/* Currency selection */}
        <Text style={styles.fieldLabel}>Currency</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.currencyScroll}
        >
          {CURRENCIES.map((c) => {
            const isSelected = currency === c.code;
            return (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.currencyPill,
                  isSelected && styles.currencyPillSelected,
                ]}
                onPress={() => setCurrency(c.code)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencySymbol,
                    isSelected && styles.currencySymbolSelected,
                  ]}
                >
                  {c.symbol}
                </Text>
                <Text
                  style={[
                    styles.currencyCode,
                    isSelected && styles.currencyCodeSelected,
                  ]}
                >
                  {c.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <AppInput
          label="Estimated Budget *"
          placeholder="e.g. 50000"
          value={budget}
          onChangeText={(val) => {
            setBudget(val);
            if (errors.budget) setErrors({ ...errors, budget: '' });
          }}
          keyboardType="numeric"
          error={errors.budget}
          leftIcon={<IndianRupee color={COLORS.primary} size={18} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Notes & Description</Text>
        <AppInput
          label="Trip Description / Notes"
          placeholder="What are the main goals or highlights for this journey?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          leftIcon={<FileText color={COLORS.primary} size={20} />}
        />
      </View>

      <View style={styles.actionButtons}>
        <AppButton
          title={submitButtonTitle}
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          icon={<Check color={COLORS.white} size={20} />}
        />

        {onCancel && (
          <AppButton
            title="Cancel"
            onPress={onCancel}
            variant="ghost"
            size="md"
            style={styles.cancelBtn}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  stopsContainer: {
    marginTop: 4,
  },
  addStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopInput: {
    flex: 1,
    marginBottom: 0,
  },
  addStopBtn: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  stopTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  stopTagText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -4,
  },
  presetChip: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  presetChipText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
  currencyScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyPillSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondaryText,
  },
  currencySymbolSelected: {
    color: COLORS.primaryDark,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  currencyCodeSelected: {
    color: COLORS.primaryDark,
  },
  actionButtons: {
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    marginTop: 4,
  },
});
