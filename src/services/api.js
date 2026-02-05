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
// WATER INTAKE APIs (Mock data until backend ready)
// ============================================
const MOCK_WATER_DATA = {
  entries: [],
  total_ml: 0,
  goal_ml: 2000,
};

export const getWaterIntake = async (date) => {
  try {
    const { data } = await api.get(`/water-intake?date=${date}`);
    return data;
  } catch {
    // Return mock data if API not ready
    return { ...MOCK_WATER_DATA };
  }
};

export const getWaterIntakeWeekly = async () => {
  try {
    const { data } = await api.get('/water-intake/weekly');
    return data;
  } catch {
    // Return mock weekly data
    return [
      { date: 'Mon', total_ml: 1800 },
      { date: 'Tue', total_ml: 2100 },
      { date: 'Wed', total_ml: 1500 },
      { date: 'Thu', total_ml: 2000 },
      { date: 'Fri', total_ml: 1700 },
      { date: 'Sat', total_ml: 2200 },
      { date: 'Sun', total_ml: 1000 },
    ];
  }
};

export const addWaterIntake = async ({ amount_ml, logged_at }) => {
  try {
    const { data } = await api.post('/water-intake', { amount_ml, logged_at });
    return data;
  } catch {
    // Return mock response
    return { id: Date.now(), amount_ml, logged_at: logged_at || new Date().toISOString() };
  }
};

export const deleteWaterIntake = async (id) => {
  try {
    await api.delete(`/water-intake/${id}`);
  } catch {
    // Silently fail for mock
  }
};

// ============================================
// EXERCISE APIs (Mock data until backend ready)
// ============================================
export const logExercise = async (exerciseData) => {
  try {
    const { data } = await api.post('/exercises', exerciseData);
    return data;
  } catch {
    return { id: Date.now(), ...exerciseData, exercised_at: exerciseData.exercised_at || new Date().toISOString() };
  }
};

export const getExercises = async (from, to) => {
  try {
    const { data } = await api.get(`/exercises?from=${from}&to=${to}`);
    return data;
  } catch {
    return [];
  }
};

export const getExerciseStreak = async () => {
  try {
    const { data } = await api.get('/exercises/streak');
    return data;
  } catch {
    return { current_streak: 0, longest_streak: 0, last_exercise_date: null };
  }
};

export const getExerciseStats = async (from, to) => {
  try {
    const { data } = await api.get(`/exercises/stats?from=${from}&to=${to}`);
    return data;
  } catch {
    return { total_sessions: 0, total_minutes: 0, total_calories: 0, by_type: {} };
  }
};

export const deleteExercise = async (id) => {
  try {
    await api.delete(`/exercises/${id}`);
  } catch {
    // Silently fail for mock
  }
};

// ============================================
// SLEEP APIs (Mock data until backend ready)
// ============================================
export const logSleep = async (sleepData) => {
  try {
    const { data } = await api.post('/sleep-logs', sleepData);
    return data;
  } catch {
    const sleepTime = new Date(sleepData.sleep_time);
    const wakeTime = new Date(sleepData.wake_time);
    const durationHours = (wakeTime - sleepTime) / (1000 * 60 * 60);
    return { id: Date.now(), ...sleepData, duration_hours: durationHours };
  }
};

export const getSleepLogs = async (from, to) => {
  try {
    const { data } = await api.get(`/sleep-logs?from=${from}&to=${to}`);
    return data;
  } catch {
    return [];
  }
};

export const getSleepAverage = async () => {
  try {
    const { data } = await api.get('/sleep-logs/average');
    return data;
  } catch {
    return { avg_duration_hours: 0, avg_sleep_time: null, avg_wake_time: null, quality_distribution: {} };
  }
};

export const deleteSleepLog = async (id) => {
  try {
    await api.delete(`/sleep-logs/${id}`);
  } catch {
    // Silently fail for mock
  }
};

// ============================================
// MEDICATION COMPLIANCE APIs
// ============================================
export const markReminderDone = async (id, done_at) => {
  try {
    const { data } = await api.post(`/reminders/${id}/done`, { done_at });
    return data;
  } catch {
    return { id: Date.now(), reminder_id: id, done_at: done_at || new Date().toISOString() };
  }
};

export const getReminderHistory = async (id, from, to) => {
  try {
    const { data } = await api.get(`/reminders/${id}/history?from=${from}&to=${to}`);
    return data;
  } catch {
    return [];
  }
};

export const getReminderCompliance = async (from, to) => {
  try {
    const { data } = await api.get(`/reminders/compliance?from=${from}&to=${to}`);
    return data;
  } catch {
    return { total_expected: 0, total_done: 0, percentage: 0 };
  }
};

// ============================================
// GROUP 2: NUTRITION/MEAL APIs
// ============================================
export const searchFoods = async (search, limit = 20) => {
  try {
    const { data } = await api.get(`/foods?search=${encodeURIComponent(search)}&limit=${limit}`);
    return data;
  } catch {
    return [];
  }
};

export const createFood = async (foodData) => {
  try {
    const { data } = await api.post('/foods', foodData);
    return data;
  } catch {
    return { id: Date.now(), ...foodData, is_custom: true };
  }
};

export const logMeal = async (mealData) => {
  try {
    const { data } = await api.post('/meal-logs', mealData);
    return data;
  } catch {
    return { id: Date.now(), ...mealData, logged_at: new Date().toISOString() };
  }
};

export const getMealLogs = async (date) => {
  try {
    const { data } = await api.get(`/meal-logs?date=${date}`);
    return data;
  } catch {
    return [];
  }
};

export const deleteMealLog = async (id) => {
  try {
    await api.delete(`/meal-logs/${id}`);
  } catch {
    // Silently fail
  }
};

export const getNutritionSummary = async (date) => {
  try {
    const params = date ? `?date=${date}` : '';
    const { data } = await api.get(`/nutrition/daily-summary${params}`);
    return data;
  } catch {
    return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, goal_calories: 2000 };
  }
};

// ============================================
// GROUP 2: GOALS APIs
// ============================================
export const createGoal = async (goalData) => {
  try {
    const { data } = await api.post('/goals', goalData);
    return data;
  } catch {
    return { id: Date.now(), ...goalData, progress: 0, status: 'active' };
  }
};

export const getGoals = async (status = 'active') => {
  try {
    const { data } = await api.get(`/goals?status=${status}`);
    return data;
  } catch {
    return [];
  }
};

export const getGoalDetail = async (id) => {
  try {
    const { data } = await api.get(`/goals/${id}`);
    return data;
  } catch {
    return null;
  }
};

export const updateGoal = async (id, updates) => {
  try {
    const { data } = await api.put(`/goals/${id}`, updates);
    return data;
  } catch {
    return { id, ...updates };
  }
};

export const deleteGoal = async (id) => {
  try {
    await api.delete(`/goals/${id}`);
  } catch {
    // Silently fail
  }
};

// ============================================
// GROUP 2: VITALS APIs
// ============================================
export const logVital = async (vitalData) => {
  try {
    const { data } = await api.post('/vitals', vitalData);
    return data;
  } catch {
    return { id: Date.now(), ...vitalData, recorded_at: new Date().toISOString() };
  }
};

export const getVitals = async (type, from, to) => {
  try {
    let params = [];
    if (type) params.push(`type=${type}`);
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    const { data } = await api.get(`/vitals${query}`);
    return data;
  } catch {
    return [];
  }
};

export const getLatestVitals = async () => {
  try {
    const { data } = await api.get('/vitals/latest');
    return data;
  } catch {
    return {};
  }
};

// ============================================
// GROUP 2: REPORTS APIs
// ============================================
export const getWeeklyReport = async (weekStart) => {
  try {
    const params = weekStart ? `?week_start=${weekStart}` : '';
    const { data } = await api.get(`/reports/weekly${params}`);
    return data;
  } catch {
    return { exercise: {}, sleep: {}, water: {}, nutrition: {}, insights: [] };
  }
};

export const getMonthlyReport = async (month) => {
  try {
    const params = month ? `?month=${month}` : '';
    const { data } = await api.get(`/reports/monthly${params}`);
    return data;
  } catch {
    return { exercise: {}, sleep: {}, water: {}, nutrition: {}, insights: [], month_over_month: {} };
  }
};

// ============================================
// GROUP 3: ACHIEVEMENTS APIs
// ============================================
export const getAchievements = async () => {
  try {
    const { data } = await api.get('/achievements');
    return data;
  } catch {
    return [];
  }
};

export const getRecentAchievements = async (limit = 10) => {
  try {
    const { data } = await api.get(`/achievements/recent?limit=${limit}`);
    return data;
  } catch {
    return [];
  }
};

export const getUserLevel = async () => {
  try {
    const { data } = await api.get('/achievements/level');
    return data;
  } catch {
    return { level: 1, points: 0, next_level_points: 100 };
  }
};

// ============================================
// GROUP 3: PERIOD TRACKER APIs
// ============================================
export const logPeriod = async (periodData) => {
  try {
    const { data } = await api.post('/period-logs', periodData);
    return data;
  } catch {
    return { id: Date.now(), ...periodData };
  }
};

export const getPeriodLogs = async () => {
  try {
    const { data } = await api.get('/period-logs');
    return data;
  } catch {
    return [];
  }
};

export const getPeriodPredictions = async () => {
  try {
    const { data } = await api.get('/period/predictions');
    return data;
  } catch {
    return { next_period: null, fertile_window: null, avg_cycle_length: null };
  }
};

// ============================================
// GROUP 3: SYMPTOM CHECKER APIs
// ============================================
export const getBodyParts = async () => {
  try {
    const { data } = await api.get('/symptoms/body-parts');
    return data;
  } catch {
    return [];
  }
};

export const checkSymptoms = async (symptomData) => {
  try {
    const { data } = await api.post('/symptoms/check', symptomData);
    return data;
  } catch {
    return { conditions: [], advice: '', disclaimer: 'Vui lòng tham khảo ý kiến bác sĩ.' };
  }
};

// ============================================
// GROUP 3: SOCIAL/FRIENDS APIs
// ============================================
export const getFriends = async () => {
  try {
    const { data } = await api.get('/friends');
    return data;
  } catch {
    return [];
  }
};

export const sendFriendRequest = async (userId) => {
  try {
    const { data } = await api.post('/friends/request', { user_id: userId });
    return data;
  } catch {
    return null;
  }
};

export const respondFriendRequest = async (requestId, action) => {
  try {
    const { data } = await api.put(`/friends/request/${requestId}`, { action });
    return data;
  } catch {
    return null;
  }
};

export const getPendingRequests = async () => {
  try {
    const { data } = await api.get('/friends/requests/pending');
    return data;
  } catch {
    return [];
  }
};

// ============================================
// GROUP 3: CHALLENGES APIs
// ============================================
export const createChallenge = async (challengeData) => {
  try {
    const { data } = await api.post('/challenges', challengeData);
    return data;
  } catch {
    return { id: Date.now(), ...challengeData };
  }
};

export const getChallenges = async (status = 'active') => {
  try {
    const { data } = await api.get(`/challenges?status=${status}`);
    return data;
  } catch {
    return [];
  }
};

export const joinChallenge = async (challengeId) => {
  try {
    const { data } = await api.post(`/challenges/${challengeId}/join`);
    return data;
  } catch {
    return null;
  }
};

export const getLeaderboard = async (challengeId) => {
  try {
    const { data } = await api.get(`/challenges/${challengeId}/leaderboard`);
    return data;
  } catch {
    return [];
  }
};

// ============================================
// GROUP 3: AI CHAT APIs
// ============================================
export const sendAIChat = async (message) => {
  try {
    const { data } = await api.post('/ai/chat', { message });
    return {
      ...data,
      reply: data?.reply || data?.response || data?.message,
    };
  } catch (error) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;
    console.log('sendAIChat error', { status, serverMessage });
    return { reply: 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.' };
  }
};

export const getAISuggestions = async () => {
  try {
    const { data } = await api.get('/ai/suggestions');
    return data;
  } catch {
    return [
      'Làm sao để giảm cân hiệu quả?',
      'Tôi nên tập thể dục bao lâu mỗi ngày?',
      'Chế độ ăn uống lành mạnh là gì?',
    ];
  }
};

export default api;
