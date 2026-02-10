import axios from 'axios';
import { loadToken } from '../storage/authStorage.js';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error?.message;
    console.log('API error', { baseURL: API_BASE_URL, status, message });
    return Promise.reject(error);
  }
);

api.interceptors.request.use(async (config) => {
  const token = await loadToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async ({ username, password }) => {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
};

export const register = async ({ username, email, password }) => {
  const { data } = await api.post('/auth/register', { username, email, password });
  return data;
};

export const getHealthStats = async () => {
  const { data } = await api.get('/health-stats');
  return data;
};

export const saveHealthStat = async ({ height, weight }) => {
  const { data } = await api.post('/health-stats', { height, weight });
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/profile');
  return data;
};

export const upsertProfile = async ({ full_name, birthdate, age, height_cm, weight_kg }) => {
  const { data } = await api.put('/profile', { full_name, birthdate, age, height_cm, weight_kg });
  return data;
};

export const registerExpoPushToken = async ({ expo_push_token, enabled }) => {
  const { data } = await api.post('/notifications/token', { expo_push_token, enabled });
  return data;
};

export const getReminders = async () => {
  const { data } = await api.get('/reminders');
  return data;
};

export const createReminder = async ({ type, title, message, time_of_day, days_of_week, timezone, enabled }) => {
  const { data } = await api.post('/reminders', {
    type,
    title,
    message,
    time_of_day,
    days_of_week,
    timezone,
    enabled,
  });
  return data;
};

export const updateReminder = async (id, patch) => {
  const { data } = await api.put(`/reminders/${id}`, patch);
  return data;
};

export const deleteReminder = async (id) => {
  await api.delete(`/reminders/${id}`);
};

// ============================================
// WATER INTAKE APIs
// ============================================
export const getWaterIntake = async (date) => {
  const { data } = await api.get(`/water-intake?date=${date}`);
  return data;
};

export const getWaterIntakeWeekly = async () => {
  const { data } = await api.get('/water-intake/weekly');
  return data;
};

export const addWaterIntake = async ({ amount_ml, logged_at }) => {
  const { data } = await api.post('/water-intake', { amount_ml, logged_at });
  return data;
};

export const deleteWaterIntake = async (id) => {
  await api.delete(`/water-intake/${id}`);
};

// ============================================
// EXERCISE APIs
// ============================================
export const logExercise = async (exerciseData) => {
  const { data } = await api.post('/exercises', exerciseData);
  return data;
};

export const getExercises = async (from, to) => {
  const { data } = await api.get(`/exercises?from=${from}&to=${to}`);
  return data;
};

export const getExerciseStreak = async () => {
  const { data } = await api.get('/exercises/streak');
  return data;
};

export const getExerciseStats = async (from, to) => {
  const { data } = await api.get(`/exercises/stats?from=${from}&to=${to}`);
  return data;
};

export const deleteExercise = async (id) => {
  await api.delete(`/exercises/${id}`);
};

// ============================================
// SLEEP APIs
// ============================================
export const logSleep = async (sleepData) => {
  const { data } = await api.post('/sleep-logs', sleepData);
  return data;
};

export const getSleepLogs = async (from, to) => {
  const { data } = await api.get(`/sleep-logs?from=${from}&to=${to}`);
  return data;
};

export const getSleepAverage = async () => {
  const { data } = await api.get('/sleep-logs/average');
  return data;
};

export const deleteSleepLog = async (id) => {
  await api.delete(`/sleep-logs/${id}`);
};

// ============================================
// MEDICATION COMPLIANCE APIs
// ============================================
export const markReminderDone = async (id, done_at) => {
  const { data } = await api.post(`/reminders/${id}/done`, { done_at });
  return data;
};

export const getReminderHistory = async (id, from, to) => {
  const { data } = await api.get(`/reminders/${id}/history?from=${from}&to=${to}`);
  return data;
};

export const getReminderCompliance = async (from, to) => {
  const { data } = await api.get(`/reminders/compliance?from=${from}&to=${to}`);
  return data;
};

// ============================================
// GROUP 2: NUTRITION/MEAL APIs
// ============================================
export const searchFoods = async (search, limit = 20) => {
  const { data } = await api.get(`/foods?search=${encodeURIComponent(search)}&limit=${limit}`);
  return data;
};

export const createFood = async (foodData) => {
  const { data } = await api.post('/foods', foodData);
  return data;
};

export const logMeal = async (mealData) => {
  const { data } = await api.post('/meal-logs', mealData);
  return data;
};

export const getMealLogs = async (date) => {
  const { data } = await api.get(`/meal-logs?date=${date}`);
  return data;
};

export const deleteMealLog = async (id) => {
  await api.delete(`/meal-logs/${id}`);
};

export const getNutritionSummary = async (date) => {
  const params = date ? `?date=${date}` : '';
  const { data } = await api.get(`/nutrition/daily-summary${params}`);
  return data;
};

// ============================================
// GROUP 2: GOALS APIs
// ============================================
export const createGoal = async (goalData) => {
  const { data } = await api.post('/goals', goalData);
  return data;
};

export const getGoals = async (status = 'active') => {
  const { data } = await api.get(`/goals?status=${status}`);
  return data;
};

export const getGoalDetail = async (id) => {
  const { data } = await api.get(`/goals/${id}`);
  return data;
};

export const updateGoal = async (id, updates) => {
  const { data } = await api.put(`/goals/${id}`, updates);
  return data;
};

export const deleteGoal = async (id) => {
  await api.delete(`/goals/${id}`);
};

// ============================================
// GROUP 2: VITALS APIs
// ============================================
export const logVital = async (vitalData) => {
  const { data } = await api.post('/vitals', vitalData);
  return data;
};

export const getVitals = async (type, from, to) => {
  let params = [];
  if (type) params.push(`type=${type}`);
  if (from) params.push(`from=${from}`);
  if (to) params.push(`to=${to}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  const { data } = await api.get(`/vitals${query}`);
  return data;
};

export const getLatestVitals = async () => {
  const { data } = await api.get('/vitals/latest');
  return data;
};

// ============================================
// GROUP 2: REPORTS APIs
// ============================================
export const getWeeklyReport = async (weekStart) => {
  const params = weekStart ? `?week_start=${weekStart}` : '';
  const { data } = await api.get(`/reports/weekly${params}`);
  return data;
};

export const getMonthlyReport = async (month) => {
  const params = month ? `?month=${month}` : '';
  const { data } = await api.get(`/reports/monthly${params}`);
  return data;
};

// ============================================
// GROUP 3: ACHIEVEMENTS APIs
// ============================================
export const getAchievements = async () => {
  const { data } = await api.get('/achievements');
  return data;
};

export const getRecentAchievements = async (limit = 10) => {
  const { data } = await api.get(`/achievements/recent?limit=${limit}`);
  return data;
};

export const getUserLevel = async () => {
  const { data } = await api.get('/achievements/level');
  return data;
};

// ============================================
// GROUP 3: PERIOD TRACKER APIs
// ============================================
export const logPeriod = async (periodData) => {
  const { data } = await api.post('/period-logs', periodData);
  return data;
};

export const getPeriodLogs = async () => {
  const { data } = await api.get('/period-logs');
  return data;
};

export const getPeriodPredictions = async () => {
  const { data } = await api.get('/period/predictions');
  return data;
};

// ============================================
// GROUP 3: SYMPTOM CHECKER APIs
// ============================================
export const getBodyParts = async () => {
  const { data } = await api.get('/symptoms/body-parts');
  return data;
};

export const checkSymptoms = async (symptomData) => {
  const { data } = await api.post('/symptoms/check', symptomData);
  return data;
};

// ============================================
// GROUP 3: SOCIAL/FRIENDS APIs
// ============================================
export const getFriends = async () => {
  const { data } = await api.get('/friends');
  return data;
};

export const sendFriendRequest = async (userId) => {
  const { data } = await api.post('/friends/request', { user_id: userId });
  return data;
};

export const respondFriendRequest = async (requestId, action) => {
  const { data } = await api.put(`/friends/request/${requestId}`, { action });
  return data;
};

export const getPendingRequests = async () => {
  const { data } = await api.get('/friends/requests/pending');
  return data;
};

// ============================================
// GROUP 3: CHALLENGES APIs
// ============================================
export const createChallenge = async (challengeData) => {
  const { data } = await api.post('/challenges', challengeData);
  return data;
};

export const getChallenges = async (status = 'active') => {
  const { data } = await api.get(`/challenges?status=${status}`);
  return data;
};

export const joinChallenge = async (challengeId) => {
  const { data } = await api.post(`/challenges/${challengeId}/join`);
  return data;
};

export const getLeaderboard = async (challengeId) => {
  const { data } = await api.get(`/challenges/${challengeId}/leaderboard`);
  return data;
};

// ============================================
// GROUP 3: AI CHAT APIs
// ============================================
export const sendAIChat = async (message) => {
  const { data } = await api.post('/ai/chat', { message });
  return {
    ...data,
    reply: data?.reply || data?.response || data?.message,
  };
};

export const getAISuggestions = async () => {
  const { data } = await api.get('/ai/suggestions');
  return data;
};

export default api;
