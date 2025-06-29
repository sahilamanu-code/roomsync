import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return null;
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
};

export const scheduleChoreReminder = async (choreTitle: string, dueDate: Date): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Chore Reminder',
      body: `Don't forget: ${choreTitle} is due today!`,
      data: { type: 'chore_reminder' },
    },
    trigger: {
      date: dueDate,
    },
  });
  
  return identifier;
};

export const scheduleExpenseReminder = async (expenseTitle: string, amount: number): Promise<string> => {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Expense Added',
      body: `New expense: ${expenseTitle} - $${amount.toFixed(2)}`,
      data: { type: 'expense_added' },
    },
    trigger: null, // Send immediately
  });
  
  return identifier;
};

export const cancelNotification = async (identifier: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(identifier);
};