import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Utensils,
  Hotel,
  Car,
  ShoppingBag,
  Ticket,
  CircleDollarSign,
  Trash2,
} from 'lucide-react-native';
import { Expense, ExpenseCategory } from '../../types/expense';
import { COLORS } from '../../constants/colors';
import { formatDate } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';

interface ExpenseCardProps {
  expense: Expense;
  currency?: string;
  onDelete?: (id: string) => void;
  onPress?: () => void;
}

export function ExpenseCard({
  expense,
  currency = 'INR',
  onDelete,
  onPress,
}: ExpenseCardProps) {
  const getCategoryConfig = (category: ExpenseCategory) => {
    switch (category) {
      case 'Food':
        return {
          icon: <Utensils color="#EA580C" size={18} />,
          bg: '#FFEDD5',
        };
      case 'Hotel':
        return {
          icon: <Hotel color="#7C3AED" size={18} />,
          bg: '#EDE9FE',
        };
      case 'Transport':
        return {
          icon: <Car color="#0284C7" size={18} />,
          bg: '#E0F2FE',
        };
      case 'Shopping':
        return {
          icon: <ShoppingBag color="#DB2777" size={18} />,
          bg: '#FCE7F3',
        };
      case 'Activities':
        return {
          icon: <Ticket color="#16A34A" size={18} />,
          bg: '#DCFCE7',
        };
      default:
        return {
          icon: <CircleDollarSign color="#6B7280" size={18} />,
          bg: '#F3F4F6',
        };
    }
  };

  const config = getCategoryConfig(expense.category);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
        {config.icon}
      </View>

      <View style={styles.centerInfo}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.categoryBadge}>{expense.category}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{formatDate(expense.date)}</Text>
        </View>
        {expense.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {expense.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightInfo}>
        <Text style={styles.amount}>
          {formatCurrency(expense.amount, currency)}
        </Text>
        {onDelete && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(expense.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 color={COLORS.secondaryText} size={15} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  dot: {
    color: COLORS.secondaryText,
    fontSize: 10,
  },
  date: {
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  notes: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 2,
    fontStyle: 'italic',
  },
  rightInfo: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 4,
  },
});
