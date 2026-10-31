import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Share,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Download,
  Upload,
  Trash2,
  Bell,
  Coins,
  ShieldCheck,
  Check,
} from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { CURRENCIES, DEFAULT_CURRENCY } from '../../src/constants/config';
import { Header } from '../../src/components/common/Header';
import {
  getData,
  saveData,
  STORAGE_KEYS,
  clearAllAppData,
  exportAllData,
  importAllData,
} from '../../src/services/storage';
import { AppSettings } from '../../src/types/note';
import { requestNotificationPermissions } from '../../src/services/notificationService';

export default function SettingsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<AppSettings>({
    defaultCurrency: DEFAULT_CURRENCY,
    enableNotifications: true,
    travelerName: 'Explorer',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      const saved = await getData<AppSettings>(STORAGE_KEYS.SETTINGS, {
        defaultCurrency: DEFAULT_CURRENCY,
        enableNotifications: true,
        travelerName: 'Explorer',
      });
      setSettings(saved);
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleCurrencySelect = async (code: string) => {
    const updated = { ...settings, defaultCurrency: code };
    setSettings(updated);
    await saveData(STORAGE_KEYS.SETTINGS, updated);
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      await requestNotificationPermissions();
    }
    const updated = { ...settings, enableNotifications: value };
    setSettings(updated);
    await saveData(STORAGE_KEYS.SETTINGS, updated);
  };

  const handleExportBackup = async () => {
    try {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tripmate_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Backup file downloaded.');
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

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all saved trips, expenses, itineraries, and checklists? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllAppData();
            Alert.alert('Reset Complete', 'All application data has been wiped.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Settings" onBack={() => router.back()} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Currency Preference */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Coins color={COLORS.primary} size={20} />
            <Text style={styles.sectionTitle}>Default Currency</Text>
          </View>

          <Text style={styles.sectionSubtitle}>
            Select the currency used for new trips and general budgets:
          </Text>

          <View style={styles.currenciesGrid}>
            {CURRENCIES.map((c) => {
              const isSelected = settings.defaultCurrency === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.currencyCard,
                    isSelected && styles.currencyCardSelected,
                  ]}
                  onPress={() => handleCurrencySelect(c.code)}
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
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check color={COLORS.white} size={12} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notifications Preference */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Bell color={COLORS.primary} size={20} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.toggleTitle}>Trip Reminders</Text>
              <Text style={styles.toggleDesc}>
                Receive alerts 24 hours before your trip starts and for scheduled activities
              </Text>
            </View>
            <Switch
              value={settings.enableNotifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Data & Backup */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Download color={COLORS.primary} size={20} />
            <Text style={styles.sectionTitle}>Backup & Migration</Text>
          </View>

          <Text style={styles.sectionSubtitle}>
            TripMate stores all data on your device. Export a backup to safeguard your plans.
          </Text>

          <TouchableOpacity
            style={styles.actionRowBtn}
            onPress={handleExportBackup}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Download color="#0284C7" size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionRowTitle}>Export Backup (JSON)</Text>
              <Text style={styles.actionRowDesc}>
                Save complete offline JSON file
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Reset Danger Zone */}
        <View style={[styles.sectionCard, { borderColor: '#FCA5A5' }]}>
          <View style={styles.sectionHeaderRow}>
            <Trash2 color={COLORS.danger} size={20} />
            <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>
              Danger Zone
            </Text>
          </View>

          <TouchableOpacity
            style={styles.actionRowBtn}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Trash2 color={COLORS.danger} size={18} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.actionRowTitle, { color: COLORS.danger }]}>
                Clear All Data
              </Text>
              <Text style={styles.actionRowDesc}>
                Wipe all trips, itineraries, packing items & expenses
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <ShieldCheck color={COLORS.primary} size={18} />
          <Text style={styles.privacyText}>
            TripMate does not collect or track your personal travel data.
          </Text>
        </View>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.secondaryText,
    marginBottom: 14,
    lineHeight: 18,
  },
  currenciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: '22%',
    justifyContent: 'center',
    gap: 6,
  },
  currencyCardSelected: {
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
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleDesc: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
    lineHeight: 17,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionRowDesc: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    textAlign: 'center',
  },
});
