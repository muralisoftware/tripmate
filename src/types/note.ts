export interface TravelNote {
  id: string;
  tripId: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface AppSettings {
  defaultCurrency: string;
  enableNotifications: boolean;
  travelerName: string;
}
