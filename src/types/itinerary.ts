export interface Itinerary {
  id: string;
  tripId: string;
  dayNumber: number;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  completed: boolean;
}

export interface PackingItem {
  id: string;
  tripId: string;
  name: string;
  packed: boolean;
  category?: string;
}
