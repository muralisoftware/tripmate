import React, { useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  ListTodo,
  X,
  Check,
  RotateCcw,
} from 'lucide-react-native';

import { COLORS } from '../../src/constants/colors';
import { PACKING_CATEGORIES } from '../../src/constants/config';
import { Header } from '../../src/components/common/Header';
import { AppInput } from '../../src/components/common/AppInput';
import { AppButton } from '../../src/components/common/AppButton';
import { EmptyState } from '../../src/components/common/EmptyState';
import { getTripById } from '../../src/services/tripService';
import {
  getPackingItemsByTrip,
  addPackingItem,
  togglePackingItem,
  deletePackingItem,
  seedDefaultPackingList,
} from '../../src/services/packingService';
import { Trip } from '../../src/types/trip';
import { PackingItem } from '../../src/types/itinerary';

type FilterType = 'all' | 'unpacked' | 'packed';

export default function PackingScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<string>(
    PACKING_CATEGORIES[0]
  );
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!tripId) return;
    try {
      const [tripData, packData] = await Promise.all([
        getTripById(tripId),
        getPackingItemsByTrip(tripId),
      ]);
      setTrip(tripData || null);
      setItems(packData);
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

  const packedCount = useMemo(
    () => items.filter((i) => i.packed).length,
    [items]
  );
  const percent =
    items.length > 0 ? Math.round((packedCount / items.length) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (filter === 'packed') return items.filter((i) => i.packed);
    if (filter === 'unpacked') return items.filter((i) => !i.packed);
    return items;
  }, [items, filter]);

  const handleToggle = async (id: string) => {
    await togglePackingItem(id);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await deletePackingItem(id);
    loadData();
  };

  const handleSeedDefaults = async () => {
    if (!tripId) return;
    await seedDefaultPackingList(tripId);
    loadData();
  };

  const handleSaveItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Validation', 'Please enter an item name.');
      return;
    }

    setSaving(true);
    try {
      const item: PackingItem = {
        id: `pack_${Date.now()}`,
        tripId: tripId!,
        name: newItemName.trim(),
        category: newItemCategory,
        packed: false,
      };

      await addPackingItem(item);
      setNewItemName('');
      setModalVisible(false);
      loadData();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add item.');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Packing Checklist"
        subtitle={trip?.title}
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Plus color={COLORS.white} size={18} />
            <Text style={styles.addBtnText}>Item</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Packing Readiness</Text>
              <Text style={styles.progressStats}>
                {packedCount} of {items.length} items packed
              </Text>
            </View>
            <Text style={styles.percentText}>{percent}%</Text>
          </View>

          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'unpacked', 'packed'] as FilterType[]).map((f) => {
            const isSelected = filter === f;
            const count =
              f === 'all'
                ? items.length
                : f === 'packed'
                ? packedCount
                : items.length - packedCount;

            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Items List */}
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={<ListTodo color={COLORS.primary} size={32} />}
            title={items.length === 0 ? 'Packing list is empty' : 'No items in this filter'}
            description={
              items.length === 0
                ? 'Generate standard travel essentials or add custom items for your trip.'
                : 'Switch filters or add new items to your checklist.'
            }
            actionTitle={items.length === 0 ? 'Load Recommended Items' : 'Add Item'}
            onAction={items.length === 0 ? handleSeedDefaults : () => setModalVisible(true)}
          />
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => handleToggle(item.id)}
                activeOpacity={0.7}
              >
                {item.packed ? (
                  <CheckCircle2 color={COLORS.primary} size={22} />
                ) : (
                  <Circle color={COLORS.secondaryText} size={22} />
                )}
                <View style={styles.itemTextContainer}>
                  <Text
                    style={[
                      styles.itemName,
                      item.packed && styles.itemNameDone,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.category ? (
                    <Text style={styles.itemCategory}>{item.category}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 color={COLORS.secondaryText} size={16} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Item Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Packing Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={COLORS.secondaryText} size={22} />
              </TouchableOpacity>
            </View>

            <AppInput
              label="Item Name *"
              placeholder="e.g. Passport, Camera, Sunscreen"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <Text style={styles.catLabel}>Category</Text>
            <View style={styles.catChipsRow}>
              {PACKING_CATEGORIES.map((cat) => {
                const isSelected = newItemCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catChip,
                      isSelected && styles.catChipActive,
                    ]}
                    onPress={() => setNewItemCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        isSelected && styles.catChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <AppButton
              title="Add to Packing List"
              onPress={handleSaveItem}
              loading={saving}
              icon={<Check color={COLORS.white} size={18} />}
              style={{ marginTop: 16, marginBottom: 20 }}
            />
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
  progressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressStats: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  percentText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  filterChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemNameDone: {
    textDecorationLine: 'line-through',
    color: COLORS.secondaryText,
  },
  itemCategory: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
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
  catLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  catChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 12,
    color: COLORS.secondaryText,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
});
