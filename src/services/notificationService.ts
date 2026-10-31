import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Notification permission error:', error);
    return false;
  }
}

export async function scheduleTripReminder(
  tripId: string,
  tripTitle: string,
  destination: string,
  startDateStr: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Schedule 1 day before trip at 9:00 AM
    const tripDate = new Date(startDateStr);
    tripDate.setDate(tripDate.getDate() - 1);
    tripDate.setHours(9, 0, 0, 0);

    const now = new Date();
    if (tripDate.getTime() <= now.getTime()) {
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `TripMate: ${tripTitle} starts tomorrow! 🎒`,
        body: `Get ready for your adventure to ${destination}. Don't forget your packing checklist!`,
        data: { tripId },
      },
      trigger: {
        date: tripDate,
      } as any,
    });

    return id;
  } catch (error) {
    console.warn('Failed to schedule trip reminder:', error);
    return null;
  }
}

export async function sendInstantTestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'TripMate Ready! ✈️',
        body: 'Your trip notifications and activity reminders are active.',
      },
      trigger: null, // deliver immediately
    });
  } catch (error) {
    console.warn('Failed to send test notification:', error);
  }
}
