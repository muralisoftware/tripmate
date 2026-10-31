export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const DEFAULT_CURRENCY = 'INR';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Hotel',
  'Transport',
  'Shopping',
  'Activities',
  'Other',
] as const;

export const PACKING_CATEGORIES = [
  'Documents & Money',
  'Clothing',
  'Electronics',
  'Toiletries',
  'Medical & Health',
  'Miscellaneous',
] as const;

export const DEFAULT_PACKING_ITEMS = [
  { name: 'Passport / National ID', category: 'Documents & Money' },
  { name: 'Flight & Hotel Bookings', category: 'Documents & Money' },
  { name: 'Credit / Debit Cards & Cash', category: 'Documents & Money' },
  { name: 'Smartphone & Charger', category: 'Electronics' },
  { name: 'Power Bank', category: 'Electronics' },
  { name: 'Universal Travel Adapter', category: 'Electronics' },
  { name: 'Comfortable Walking Shoes', category: 'Clothing' },
  { name: 'Weather-appropriate Clothes', category: 'Clothing' },
  { name: 'Toothbrush & Toothpaste', category: 'Toiletries' },
  { name: 'Sunscreen & Lip Balm', category: 'Toiletries' },
  { name: 'Personal First Aid & Meds', category: 'Medical & Health' },
  { name: 'Reusable Water Bottle', category: 'Miscellaneous' },
];
