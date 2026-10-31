export type TripStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  budget: number;
  currency: string;
  description: string;
  status: TripStatus;
  createdAt: string;
  destinations?: string[];
  coverImage?: string;
}
