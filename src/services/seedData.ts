import { Trip } from '../types/trip';
import { Expense } from '../types/expense';
import { Itinerary, PackingItem } from '../types/itinerary';
import { TravelNote } from '../types/note';
import {
  TripMember,
  FoodExpenseEntry,
  GroupExpense,
  AdvancePayment,
} from '../types/groupExpense';
import { saveData, STORAGE_KEYS } from './storage';
import { addDays, getTodayDateString } from '../utils/date';

export async function seedSampleData(): Promise<void> {
  const today = getTodayDateString();
  const trip1Start = addDays(today, 3);
  const trip1End = addDays(today, 8);

  const trip2Start = addDays(today, -2);
  const trip2End = addDays(today, 4);

  const trip3Start = addDays(today, -20);
  const trip3End = addDays(today, -14);

  const sampleTrips: Trip[] = [
    {
      id: 'trip_kyoto_2026',
      title: 'Kyoto Cultural Discovery',
      destination: 'Kyoto, Japan',
      startDate: trip1Start,
      endDate: trip1End,
      budget: 150000,
      currency: 'INR',
      description: 'Exploring ancient temples, bamboo forests, authentic tea houses, and traditional ryokans in Kyoto.',
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      destinations: ['Arashiyama', 'Gion District', 'Fushimi Inari', 'Kinkaku-ji'],
    },
    {
      id: 'trip_bali_2026',
      title: 'Bali Island Getaway',
      destination: 'Bali, Indonesia',
      startDate: trip2Start,
      endDate: trip2End,
      budget: 85000,
      currency: 'INR',
      description: 'Tropical beaches, Ubud rice terraces, waterfall hikes, and sunset beach clubs.',
      status: 'ongoing',
      createdAt: new Date().toISOString(),
      destinations: ['Seminyak', 'Ubud', 'Canggu', 'Nusa Penida'],
    },
    {
      id: 'trip_swiss_2026',
      title: 'Swiss Alps Expedition',
      destination: 'Interlaken & Zermatt, Switzerland',
      startDate: trip3Start,
      endDate: trip3End,
      budget: 240000,
      currency: 'INR',
      description: 'Mountain hiking, panoramic train rides, Matterhorn viewing, and glacier walking.',
      status: 'completed',
      createdAt: new Date().toISOString(),
      destinations: ['Zurich', 'Interlaken', 'Grindelwald', 'Zermatt'],
    },
  ];

  const sampleExpenses: Expense[] = [
    {
      id: 'exp_1',
      tripId: 'trip_bali_2026',
      title: 'Villa Stay in Ubud (3 nights)',
      category: 'Hotel',
      amount: 28500,
      date: trip2Start,
      notes: 'Included private pool and floating breakfast',
    },
    {
      id: 'exp_2',
      tripId: 'trip_bali_2026',
      title: 'Scooter Rental & Fuel',
      category: 'Transport',
      amount: 3200,
      date: trip2Start,
      notes: 'For exploring northern waterfalls',
    },
    {
      id: 'exp_3',
      tripId: 'trip_bali_2026',
      title: 'Bebek Bengil Dinner',
      category: 'Food',
      amount: 2400,
      date: addDays(trip2Start, 1),
      notes: 'Crispy duck dinner with family',
    },
    {
      id: 'exp_4',
      tripId: 'trip_bali_2026',
      title: 'Snorkeling Trip to Nusa Penida',
      category: 'Activities',
      amount: 6500,
      date: addDays(trip2Start, 2),
      notes: 'Manta ray point and boat transfer',
    },
    {
      id: 'exp_5',
      tripId: 'trip_kyoto_2026',
      title: 'Shinkansen Bullet Train Passes',
      category: 'Transport',
      amount: 22000,
      date: trip1Start,
      notes: 'JR West Kansai Pass',
    },
    {
      id: 'exp_6',
      tripId: 'trip_kyoto_2026',
      title: 'Ryokan Gion Booking',
      category: 'Hotel',
      amount: 45000,
      date: trip1Start,
      notes: 'Traditional onsen ryokan with Kaiseki dinner',
    },
  ];

  const sampleItineraries: Itinerary[] = [
    {
      id: 'itn_1',
      tripId: 'trip_kyoto_2026',
      dayNumber: 1,
      title: 'Arrival & Gion Evening Walk',
      location: 'Kyoto Station & Gion',
      startTime: '14:00',
      endTime: '20:30',
      description: 'Check in at Ryokan, stroll through historic Hanamikoji street and dinner.',
      completed: false,
    },
    {
      id: 'itn_2',
      tripId: 'trip_kyoto_2026',
      dayNumber: 2,
      title: 'Fushimi Inari Torii Gates & Kiyomizu-dera',
      location: 'Southern Kyoto',
      startTime: '07:30',
      endTime: '16:00',
      description: 'Early morning climb up Mt. Inari through thousand torii gates, followed by wooden temple overlooking city.',
      completed: false,
    },
    {
      id: 'itn_3',
      tripId: 'trip_kyoto_2026',
      dayNumber: 3,
      title: 'Arashiyama Bamboo Grove & Monkey Park',
      location: 'Arashiyama',
      startTime: '08:30',
      endTime: '17:00',
      description: 'Walk through Sagano bamboo path, visit Tenryu-ji zen garden and cross Togetsukyo bridge.',
      completed: false,
    },
    {
      id: 'itn_4',
      tripId: 'trip_bali_2026',
      dayNumber: 1,
      title: 'Airport Transfer & Check-in',
      location: 'Ngurah Rai Airport -> Ubud',
      startTime: '11:00',
      endTime: '15:00',
      description: 'Driver pickup at Denpasar airport, welcome coconuts and check into villa.',
      completed: true,
    },
    {
      id: 'itn_5',
      tripId: 'trip_bali_2026',
      dayNumber: 2,
      title: 'Campuhan Ridge Walk & Tegalalang Rice Terrace',
      location: 'Ubud Center',
      startTime: '06:30',
      endTime: '13:00',
      description: 'Sunrise trek on Campuhan ridge, artisan coffee tasting at terrace cafe.',
      completed: true,
    },
  ];

  const samplePacking: PackingItem[] = [
    { id: 'p_1', tripId: 'trip_kyoto_2026', name: 'Passport & Japan Rail Voucher', packed: true, category: 'Documents & Money' },
    { id: 'p_2', tripId: 'trip_kyoto_2026', name: 'Comfortable Slip-on Walking Shoes', packed: true, category: 'Clothing' },
    { id: 'p_3', tripId: 'trip_kyoto_2026', name: 'Universal Plug Adapter (Type A)', packed: false, category: 'Electronics' },
    { id: 'p_4', tripId: 'trip_kyoto_2026', name: 'Suica IC Card (Digital or Physical)', packed: false, category: 'Documents & Money' },
    { id: 'p_5', tripId: 'trip_kyoto_2026', name: 'Light Rain Jacket & Umbrella', packed: false, category: 'Clothing' },
    { id: 'p_6', tripId: 'trip_bali_2026', name: 'Sunscreen SPF 50+', packed: true, category: 'Toiletries' },
    { id: 'p_7', tripId: 'trip_bali_2026', name: 'Swimwear & Beach Towel', packed: true, category: 'Clothing' },
    { id: 'p_8', tripId: 'trip_bali_2026', name: 'Waterproof Phone Pouch', packed: true, category: 'Electronics' },
    { id: 'p_9', tripId: 'trip_bali_2026', name: 'International Driving Permit', packed: true, category: 'Documents & Money' },
  ];

  const sampleNotes: TravelNote[] = [
    {
      id: 'note_1',
      tripId: 'trip_kyoto_2026',
      title: 'Emergency Contacts & Ryokan Address',
      content: 'Ryokan Gion: 123 Yamatooji-dori, Higashiyama-ku\nHost Tel: +81 75 555 0199\nLocal Tourist Helpline: 050-3816-2787',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note_2',
      tripId: 'trip_kyoto_2026',
      title: 'Must-Try Kyoto Delicacies',
      content: '1. Matcha parfait in Uji\n2. Kaiseki seasonal dinner\n3. Yudofu (soft tofu hotpot) at Nanzenji\n4. Nishiki Market grilled skewers',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note_3',
      tripId: 'trip_bali_2026',
      title: 'Local SIM & Money Exchange Tips',
      content: 'Bought Telkomsel eSIM at airport counter. Always use official BMC or Central Kuta money changers with zero commission.',
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleMembers: TripMember[] = [
    { id: 'mem_1', tripId: 'trip_bali_2026', name: 'Murali', phone: '+91 98765 43210', createdAt: new Date().toISOString() },
    { id: 'mem_2', tripId: 'trip_bali_2026', name: 'Arun', phone: '+91 98765 12345', createdAt: new Date().toISOString() },
    { id: 'mem_3', tripId: 'trip_bali_2026', name: 'Praveen', phone: '+91 97890 54321', createdAt: new Date().toISOString() },
    { id: 'mem_4', tripId: 'trip_bali_2026', name: 'Kumar', phone: '+91 91234 56789', createdAt: new Date().toISOString() },
    // Also for Kyoto trip
    { id: 'mem_k1', tripId: 'trip_kyoto_2026', name: 'Murali', phone: '+91 98765 43210', createdAt: new Date().toISOString() },
    { id: 'mem_k2', tripId: 'trip_kyoto_2026', name: 'Praveen', phone: '+91 97890 54321', createdAt: new Date().toISOString() },
  ];

  const sampleFoodExpenses: FoodExpenseEntry[] = [
    {
      id: 'food_1',
      tripId: 'trip_bali_2026',
      memberId: 'mem_1',
      memberName: 'Murali',
      mealType: 'Breakfast',
      amount: 250,
      date: today,
      description: 'Cafe Avocado Toast & Coffee',
      notes: 'Near hotel cafe',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'food_2',
      tripId: 'trip_bali_2026',
      memberId: 'mem_2',
      memberName: 'Arun',
      mealType: 'Lunch',
      amount: 180,
      date: today,
      description: 'Nasi Goreng Rice Bowl',
      notes: 'Local Warung',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'food_3',
      tripId: 'trip_bali_2026',
      memberId: 'mem_3',
      memberName: 'Praveen',
      mealType: 'Dinner',
      amount: 350,
      date: today,
      description: 'Grilled Jimbaran Seafood',
      notes: 'Beachside restaurant',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'food_4',
      tripId: 'trip_bali_2026',
      memberId: 'mem_4',
      memberName: 'Kumar',
      mealType: 'Snacks',
      amount: 200,
      date: today,
      description: 'Fresh Juice & Banana Fritters',
      notes: 'Afternoon break',
      createdAt: new Date().toISOString(),
    },
  ];

  const sampleGroupExpenses: GroupExpense[] = [
    {
      id: 'gexp_1',
      tripId: 'trip_bali_2026',
      title: 'Ubud Private Pool Villa (2 Nights)',
      category: 'Hotel',
      amount: 6000,
      paidByMemberId: 'mem_3',
      paidByMemberName: 'Praveen',
      date: today,
      splitType: 'equal',
      splits: [
        { memberId: 'mem_1', memberName: 'Murali', amount: 1500 },
        { memberId: 'mem_2', memberName: 'Arun', amount: 1500 },
        { memberId: 'mem_3', memberName: 'Praveen', amount: 1500 },
        { memberId: 'mem_4', memberName: 'Kumar', amount: 1500 },
      ],
      notes: 'AirBnB luxury villa with 4 bedrooms',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gexp_2',
      tripId: 'trip_bali_2026',
      title: '4x Scooters & Full Tank Fuel',
      category: 'Transport',
      amount: 1600,
      paidByMemberId: 'mem_1',
      paidByMemberName: 'Murali',
      date: today,
      splitType: 'equal',
      splits: [
        { memberId: 'mem_1', memberName: 'Murali', amount: 400 },
        { memberId: 'mem_2', memberName: 'Arun', amount: 400 },
        { memberId: 'mem_3', memberName: 'Praveen', amount: 400 },
        { memberId: 'mem_4', memberName: 'Kumar', amount: 400 },
      ],
      notes: 'Scooters rented for 2 days exploration',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gexp_3',
      tripId: 'trip_bali_2026',
      title: 'Temple Entrance Passes & Sarongs',
      category: 'Tickets',
      amount: 920,
      paidByMemberId: 'mem_2',
      paidByMemberName: 'Arun',
      date: today,
      splitType: 'custom',
      splits: [
        { memberId: 'mem_1', memberName: 'Murali', amount: 350 },
        { memberId: 'mem_2', memberName: 'Arun', amount: 120 },
        { memberId: 'mem_3', memberName: 'Praveen', amount: 250 },
        { memberId: 'mem_4', memberName: 'Kumar', amount: 200 },
      ],
      notes: 'Custom split based on rental sarong selection',
      createdAt: new Date().toISOString(),
    },
  ];

  const sampleAdvances: AdvancePayment[] = [
    {
      id: 'adv_1',
      tripId: 'trip_bali_2026',
      memberId: 'mem_1',
      memberName: 'Murali',
      amount: 1000,
      date: today,
      paymentMethod: 'UPI',
      notes: 'Advance transfer via GPay',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'adv_2',
      tripId: 'trip_bali_2026',
      memberId: 'mem_2',
      memberName: 'Arun',
      amount: 500,
      date: today,
      paymentMethod: 'UPI',
      notes: 'Initial advance',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'adv_3',
      tripId: 'trip_bali_2026',
      memberId: 'mem_3',
      memberName: 'Praveen',
      amount: 1000,
      date: today,
      paymentMethod: 'Bank Transfer',
      notes: 'Initial advance deposit',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'adv_4',
      tripId: 'trip_bali_2026',
      memberId: 'mem_4',
      memberName: 'Kumar',
      amount: 500,
      date: today,
      paymentMethod: 'Cash',
      notes: 'Cash handed at airport',
      createdAt: new Date().toISOString(),
    },
  ];

  await saveData(STORAGE_KEYS.TRIPS, sampleTrips);
  await saveData(STORAGE_KEYS.EXPENSES, sampleExpenses);
  await saveData(STORAGE_KEYS.ITINERARIES, sampleItineraries);
  await saveData(STORAGE_KEYS.PACKING, samplePacking);
  await saveData(STORAGE_KEYS.NOTES, sampleNotes);
  await saveData(STORAGE_KEYS.MEMBERS, sampleMembers);
  await saveData(STORAGE_KEYS.FOOD_EXPENSES, sampleFoodExpenses);
  await saveData(STORAGE_KEYS.GROUP_EXPENSES, sampleGroupExpenses);
  await saveData(STORAGE_KEYS.ADVANCES, sampleAdvances);
}
