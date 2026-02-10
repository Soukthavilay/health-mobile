import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clearToken, clearUser } from '../storage/authStorage.js';
import { 
  getHealthStats, 
  getProfile, 
  getWaterIntake, 
  getExerciseStats, 
  getExerciseStreak,
  getSleepAverage,
  getSleepLogs,
  getNutritionSummary,
  getLatestVitals,
  getReminders,
  getReminderHistory
} from '../services/api.js';
import GreetingHeader from '../components/GreetingHeader.js';
import WidgetCard from '../components/WidgetCard.js';

const SummaryScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock widget data
  const [waterData, setWaterData] = useState({ current: 0, goal: 2000 });
  const [exerciseData, setExerciseData] = useState({ streak: 0, todayMinutes: 0 });
  const [sleepData, setSleepData] = useState({ lastNight: 0, average: 0 });
  const [nutritionData, setNutritionData] = useState({ calories: 0, goal: 2000 });
  const [vitalsData, setVitalsData] = useState({ heart_rate: null, blood_pressure: null, spo2: null, temperature: null });
  const [remindersToday, setRemindersToday] = useState({ done: 0, total: 0 });

  const current = useMemo(() => stats?.[0] || null, [stats]);

  const toLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchAll = async () => {
    try {
      const today = toLocalDateString(new Date());
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterday = toLocalDateString(y);
      
      const [p, s, water, exerciseStreak, exerciseStats, sleepAvg, sleepLogs, nutritionSummary, latestVitals, reminders] = await Promise.all([
        getProfile(),
        getHealthStats(),
        getWaterIntake(today).catch(() => ({ total_ml: 0, goal_ml: 2000 })),
        getExerciseStreak().catch(() => ({ current_streak: 0 })),
        getExerciseStats(today, today).catch(() => ({ total_minutes: 0 })),
        getSleepAverage().catch(() => ({ avg_duration_hours: 0 })),
        getSleepLogs(yesterday, today).catch(() => []),
        getNutritionSummary(today).catch(() => ({ calories: 0, goal_calories: 2000 })),
        getLatestVitals().catch(() => ({})),
        getReminders().catch(() => []),
      ]);
      
      setProfile(p);
      setStats(Array.isArray(s) ? s : []);
      
      // Load real widget data from APIs
      setWaterData({ current: water.total_ml || 0, goal: water.goal_ml || 2000 });
      setExerciseData({ streak: exerciseStreak.current_streak || 0, todayMinutes: exerciseStats.total_minutes || 0 });
      const lastNight = Array.isArray(sleepLogs) && sleepLogs.length > 0 ? Number(sleepLogs[0].duration_hours || 0) : 0;
      setSleepData({ lastNight, average: sleepAvg.avg_duration_hours || 0 });

      setNutritionData({ calories: nutritionSummary.calories || nutritionSummary.total_calories || 0, goal: nutritionSummary.goal_calories || 2000 });

      setVitalsData({
        heart_rate: latestVitals.heart_rate || null,
        blood_pressure: latestVitals.blood_pressure || null,
        spo2: latestVitals.spo2 || null,
        temperature: latestVitals.temperature || null,
      });

      // Compute reminders completion today (sync with backend)
      const reminderList = Array.isArray(reminders) ? reminders : [];
      const doneSet = new Set();
      await Promise.all(
        reminderList.map(async (r) => {
          try {
            const history = await getReminderHistory(r.id, today, today);
            if (Array.isArray(history) && history.length > 0) doneSet.add(r.id);
          } catch {
            // ignore
          }
        })
      );
      setRemindersToday({ done: doneSet.size, total: reminderList.length });
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleLogout = async () => {
    await clearToken();
    await clearUser();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const getBmiCategory = (bmi) => {
    if (!bmi) return { label: '--', color: '#666' };
    if (bmi < 18.5) return { label: 'Thiếu cân', color: '#fb8c00' };
    if (bmi < 25) return { label: 'Bình thường', color: '#43a047' };
    if (bmi < 30) return { label: 'Thừa cân', color: '#fb8c00' };
    return { label: 'Béo phì', color: '#e53935' };
  };

  const bmiValue = current?.bmi ? Number(current.bmi).toFixed(1) : '--';
  const bmiCategory = getBmiCategory(current?.bmi);
  const waterProgress = (waterData.current / waterData.goal) * 100;
  const nutritionProgress = (nutritionData.calories / nutritionData.goal) * 100;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Greeting Header */}
        <GreetingHeader name={profile?.full_name} />

        {/* Quick Actions Row */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => navigation.navigate('WaterTab')}
          >
            <Ionicons name="water" size={18} color="#fff" style={styles.quickButtonIcon} />
            <Text style={styles.quickButtonText}>+Nước</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => navigation.navigate('ExerciseTab')}
          >
            <Ionicons name="fitness" size={18} color="#fff" style={styles.quickButtonIcon} />
            <Text style={styles.quickButtonText}>+Tập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => navigation.navigate('SleepTab')}
          >
            <Ionicons name="moon" size={18} color="#fff" style={styles.quickButtonIcon} />
            <Text style={styles.quickButtonText}>+Ngủ</Text>
          </TouchableOpacity>
        </View>

        {/* Widgets Grid */}
        <View style={styles.sectionTitleRow}>
          <Ionicons name="stats-chart" size={20} color="#333" />
          <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
        </View>

        <View style={styles.widgetRow}>
          {/* BMI Widget */}
          <WidgetCard
            icon="scale"
            title="BMI"
            value={bmiValue}
            subtitle={bmiCategory.label}
            backgroundColor="#e3f2fd"
            onPress={() => navigation.navigate('DashboardScreen')}
          />

          {/* Water Widget */}
          <WidgetCard
            icon="water"
            title="Nước"
            value={waterData.current}
            unit={`/${waterData.goal}ml`}
            progress={waterProgress}
            progressColor="#4da6ff"
            backgroundColor="#e0f7fa"
            onPress={() => navigation.navigate('WaterTab')}
          />
        </View>

        <View style={styles.widgetRow}>
          {/* Exercise Widget */}
          <WidgetCard
            icon="fitness"
            title="Tập luyện"
            value={exerciseData.todayMinutes}
            unit="phút"
            subtitle={`${exerciseData.streak} ngày streak`}
            subtitleIcon="flame"
            backgroundColor="#f1f8e9"
            onPress={() => navigation.navigate('ExerciseTab')}
          />

          {/* Sleep Widget */}
          <WidgetCard
            icon="moon"
            title="Giấc ngủ"
            value={sleepData.lastNight}
            unit="tiếng"
            subtitle={`TB: ${sleepData.average}h/đêm`}
            backgroundColor="#f3e5f5"
            onPress={() => navigation.navigate('SleepTab')}
          />
        </View>

        <View style={styles.widgetRow}>
          {/* Nutrition Widget */}
          <WidgetCard
            icon="restaurant"
            title="Dinh dưỡng"
            value={nutritionData.calories}
            unit={`/${nutritionData.goal} cal`}
            progress={nutritionProgress}
            progressColor="#fb8c00"
            backgroundColor="#fff3e0"
            onPress={() => navigation.navigate('Nutrition')}
          />

          {/* Reminders Widget */}
          <WidgetCard
            icon="calendar"
            title="Nhắc nhở"
            value={remindersToday.done}
            unit={`/${remindersToday.total}`}
            subtitle="Hôm nay"
            subtitleIcon="checkmark-circle"
            backgroundColor="#e3f2fd"
            onPress={() => navigation.navigate('ScheduleTab')}
          />
        </View>

        {/* Vitals Quick Overview */}
        <TouchableOpacity style={styles.vitalsCard} onPress={() => navigation.navigate('Vitals')} activeOpacity={0.85}>
          <View style={styles.vitalsTitleRow}>
            <Ionicons name="pulse" size={18} color="#c62828" />
            <Text style={styles.vitalsTitle}>Chỉ số sinh tồn (mới nhất)</Text>
            <Text style={styles.vitalsArrow}>›</Text>
          </View>
          <View style={styles.vitalsRow}>
            <View style={styles.vitalsItem}>
              <Text style={styles.vitalsLabel}>Nhịp tim</Text>
              <Text style={styles.vitalsValue}>{vitalsData.heart_rate?.value ?? '--'} bpm</Text>
            </View>
            <View style={styles.vitalsItem}>
              <Text style={styles.vitalsLabel}>Huyết áp</Text>
              <Text style={styles.vitalsValue}>
                {vitalsData.blood_pressure ? `${vitalsData.blood_pressure.value}/${vitalsData.blood_pressure.value2}` : '--/--'}
              </Text>
            </View>
          </View>
          <View style={styles.vitalsRow}>
            <View style={styles.vitalsItem}>
              <Text style={styles.vitalsLabel}>SpO2</Text>
              <Text style={styles.vitalsValue}>{vitalsData.spo2?.value ?? '--'}%</Text>
            </View>
            <View style={styles.vitalsItem}>
              <Text style={styles.vitalsLabel}>Nhiệt độ</Text>
              <Text style={styles.vitalsValue}>{vitalsData.temperature?.value ?? '--'}°C</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Health Insights */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsTitleRow}>
            <Ionicons name="bulb" size={18} color="#f57f17" />
            <Text style={styles.insightsTitle}>Gợi ý hôm nay</Text>
          </View>
          {waterProgress < 50 && (
            <Text style={styles.insightText}>• Bạn mới uống {Math.round(waterProgress)}% lượng nước. Hãy uống thêm!</Text>
          )}
          {exerciseData.todayMinutes === 0 && (
            <Text style={styles.insightText}>• Hôm nay bạn chưa tập thể dục. Hãy vận động 30 phút nhé!</Text>
          )}
          {sleepData.lastNight < 7 && sleepData.lastNight > 0 && (
            <Text style={styles.insightText}>• Đêm qua bạn ngủ chưa đủ giấc. Cố gắng ngủ 7-8 tiếng tối nay.</Text>
          )}
          {waterProgress >= 80 && exerciseData.todayMinutes >= 30 && sleepData.lastNight >= 7 && (
            <Text style={styles.insightText}>• Tuyệt vời! Bạn đang chăm sóc sức khỏe rất tốt!</Text>
          )}
        </View>

        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} onPress={() => setProfileModalOpen(true)}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || 'Người dùng'}</Text>
            <Text style={styles.profileMeta}>
              {profile?.age ? `${profile.age} tuổi` : ''} 
              {profile?.height_cm ? ` • ${profile.height_cm}cm` : ''}
              {profile?.weight_kg ? ` • ${profile.weight_kg}kg` : ''}
            </Text>
          </View>
          <Text style={styles.profileArrow}>›</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Profile Modal */}
        <Modal
          visible={profileModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setProfileModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Thông tin người dùng</Text>
              <Text style={styles.modalLine}>Tên: {profile?.full_name || '--'}</Text>
              <Text style={styles.modalLine}>Tuổi: {profile?.age ?? '--'}</Text>
              <Text style={styles.modalLine}>Chiều cao: {profile?.height_cm ?? '--'} cm</Text>
              <Text style={styles.modalLine}>Cân nặng: {profile?.weight_kg ?? '--'} kg</Text>
              <Text style={styles.modalLine}>Sinh nhật: {profile?.birthdate || '--'}</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setProfileModalOpen(false);
                    navigation.navigate('ProfileSetup');
                  }}
                >
                  <Text style={styles.secondaryButtonText}>Chỉnh sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setProfileModalOpen(false)}
                >
                  <Text style={styles.primaryButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#0b3d91',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  quickButtonIcon: {
    marginRight: 2,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
  },
  widgetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ef9a9a',
    marginBottom: 16,
  },
  vitalsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vitalsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#c62828',
  },
  vitalsArrow: {
    fontSize: 24,
    color: '#999',
    marginLeft: 8,
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  vitalsItem: {
    flex: 1,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  vitalsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7f0000',
    marginBottom: 4,
  },
  vitalsValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#222',
  },
  insightsCard: {
    backgroundColor: '#fff9c4',
    borderRadius: 14,
    padding: 16,
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f9a825',
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f57f17',
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b3d91',
  },
  profileMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  profileArrow: {
    fontSize: 24,
    color: '#999',
  },
  logoutButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#e53935',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0b3d91',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0b3d91',
    marginBottom: 10,
  },
  modalLine: {
    fontSize: 16,
    color: '#000',
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0b3d91',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#0b3d91',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0b3d91',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default SummaryScreen;
