import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@smart_health_token';
const USER_KEY = '@smart_health_user';

export const saveToken = async (token) => AsyncStorage.setItem(TOKEN_KEY, token);
export const loadToken = async () => AsyncStorage.getItem(TOKEN_KEY);
export const clearToken = async () => AsyncStorage.removeItem(TOKEN_KEY);

export const saveUser = async (user) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
export const loadUser = async () => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearUser = async () => AsyncStorage.removeItem(USER_KEY);

export const getCurrentUserId = async () => {
  const user = await loadUser();
  if (user?.id) return user.id;
  return null;
};
