import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  UserRound,
  Settings,
  Download,
  Upload,
  Sparkles,
  Trash2,
  Bell,
  ShieldCheck,
  ChevronRight,
  Plane,
  MapPin,
  Calendar,
  Wallet,
} from 'lucide-react-native';
import { COLORS } from '../../src/constants/colors';
import { getTrips } from '../../src/services/tripService';
import { getExpenses } from '../../src/services/expenseService';
import {
  exportAllData,
  importAllData,
  clearAllAppData,
} from '../../src/services/storage';
import { seedSampleData } from '../../src/services/seedData';
import { sendInstantTestNotification } from '../../src/services/notificationService';
import { Trip } from '../../src/types/trip';
import { calculateDurationDays } from '../../src/utils/date';
import { formatCurrency } from '../../src/utils/currency';

export default function ProfileScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  const loadProfileData = useCallback(async () => {
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
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const totalDays = trips.reduce(
    (sum, t) => sum + calculateDurationDays(t.startDate, t.endDate),
    0
  );

  // Unique destinations visited or planned
  const uniqueDestinations = new Set(
    trips.flatMap((t) => [t.destination, ...(t.destinations || [])])
  ).size;

  const handleExportBackup = async () => {
    try {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);

      if (Platform.OS === 'web') {
        // Web download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tripmate_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Backup Exported', 'Backup file downloaded successfully.');
      } else {
        await Share.share({
          message: jsonString,
          title: 'TripMate Backup JSON',
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to export backup.');
    }
  };

  const handleSeedSamples = () => {
    Alert.alert(
      'Load Sample Trips',
      'This will populate your app with sample trips (Kyoto, Bali, Swiss Alps) with itineraries, packing lists, and expenses.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Demo Data',
          onPress: async () => {
            await seedSampleData();
            await loadProfileData();
            Alert.alert('Success', 'Sample trip data loaded!');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete ALL trips, expenses, itineraries, and checklists? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllAppData();
            await loadProfileData();
            Alert.alert('Data Cleared', 'All local data has been reset.');
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    await sendInstantTestNotification();
    Alert.alert(
      'Notification Triggered',
      'A local notification has been dispatched to your device status bar.'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Profile Info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <UserRound color={COLORS.primary} size={40} />
        </View>
        <Text style={styles.userName}>Travel Explorer</Text>
        <Text style={styles.userBio}>Offline-First Wanderer · TripMate</Text>
      </View>

      {/* Travel Stats Grid */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Travel Passport</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Plane color={COLORS.primary} size={22} />
            <Text style={styles.statVal}>{trips.length}</Text>
            <Text style={styles.statName}>Total Trips</Text>
          </View>

          <View style={styles.statBox}>
            <MapPin color="#0284C7" size={22} />
            <Text style={styles.statVal}>{uniqueDestinations}</Text>
            <Text style={styles.statName}>Places</Text>
          </View>

          <View style={styles.statBox}>
            <Calendar color="#7C3AED" size={22} />
            <Text style={styles.statVal}>{totalDays}</Text>
            <Text style={styles.statName}>Days Planned</Text>
          </View>

          <View style={styles.statBox}>
            <Wallet color="#D97706" size={22} />
            <Text style={styles.statValSmall} numberOfLines={1}>
              {formatCurrency(totalSpent)}
            </Text>
            <Text style={styles.statName}>Spent</Text>
          </View>
        </View>
      </View>

      {/* Settings & Preferences */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>Preferences</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#E6F5EC' }]}>
            <Settings color={COLORS.primary} size={20} />
          </View>
          <View style={styles.menuCenter}>
            <Text style={styles.menuTitle}>App Settings</Text>
            <Text style={styles.menuSub}>Currencies, notifications & defaults</Text>
          </View>
          <ChevronRight color={COLORS.secondaryText} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleTestNotification}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#EDE9FE' }]}>
            <Bell color="#7C3AED" size={20} />
          </View>
          <View style={styles.menuCenter}>
            <Text style={styles.menuTitle}>Test Notification</Text>
            <Text style={styles.menuSub}>Trigger local push reminder</Text>
          </View>
          <ChevronRight color={COLORS.secondaryText} size={18} />
        </TouchableOpacity>
      </View>

      {/* Data Management */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionLabel}>Data & Storage</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleSeedSamples}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Sparkles color="#D97706" size={20} />
          </View>
          <View style={styles.menuCenter}>
            <Text style={styles.menuTitle}>Load Sample Trips</Text>
            <Text style={styles.menuSub}>Demo Kyoto, Bali & Swiss journeys</Text>
          </View>
          <ChevronRight color={COLORS.secondaryText} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleExportBackup}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
            <Download color="#0284C7" size={20} />
          </View>
          <View style={styles.menuCenter}>
            <Text style={styles.menuTitle}>Backup & Export (JSON)</Text>
            <Text style={styles.menuSub}>Save your trips offline to file</Text>
          </View>
          <ChevronRight color={COLORS.secondaryText} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleClearData}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
            <Trash2 color={COLORS.danger} size={20} />
          </View>
          <View style={styles.menuCenter}>
            <Text style={[styles.menuTitle, { color: COLORS.danger }]}>
              Clear All Data
            </Text>
            <Text style={styles.menuSub}>Reset local AsyncStorage</Text>
          </View>
          <ChevronRight color={COLORS.secondaryText} size={18} />
        </TouchableOpacity>
      </View>

      {/* App Info Footer */}
      <View style={styles.appInfoBox}>
        <ShieldCheck color={COLORS.primary} size={18} />
        <Text style={styles.appInfoText}>
          TripMate v1.0.0 · 100% Offline & Private
        </Text>
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
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  userBio: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
  },
  statValSmall: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
  },
  statName: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
    fontWeight: '500',
  },
  menuSection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCenter: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuSub: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  appInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  appInfoText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '500',
  },
});
