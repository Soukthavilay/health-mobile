import AsyncStorage from '@react-native-async-storage/async-storage';

const notifKey = (userId) => `@smart_health_notif_done_${userId}`;

export const getNotifOnboardingDone = async (userId) => {
  if (!userId) return false;
  const v = await AsyncStorage.getItem(notifKey(userId));
  return v === '1';
};

export const setNotifOnboardingDone = async (userId, done) => {
  if (!userId) return;
  if (done) {
    await AsyncStorage.setItem(notifKey(userId), '1');
  } else {
    await AsyncStorage.removeItem(notifKey(userId));
  }
};
