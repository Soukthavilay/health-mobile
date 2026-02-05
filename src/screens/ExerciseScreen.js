import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import {
  logExercise,
  getExercises,
  getExerciseStreak,
  getExerciseStats,
  deleteExercise as deleteExerciseApi,
} from '../services/api.js';

const EXERCISE_TYPES = [
  { id: 'running', label: 'Chạy bộ', icon: 'walk', caloriesPerMin: 10 },
  { id: 'walking', label: 'Đi bộ', icon: 'walk-outline', caloriesPerMin: 5 },
  { id: 'gym', label: 'Gym', icon: 'barbell', caloriesPerMin: 8 },
  { id: 'yoga', label: 'Yoga', icon: 'body', caloriesPerMin: 4 },
  { id: 'swimming', label: 'Bơi', icon: 'water', caloriesPerMin: 9 },
  { id: 'cycling', label: 'Đạp xe', icon: 'bicycle', caloriesPerMin: 7 },
  { id: 'other', label: 'Khác', icon: 'fitness', caloriesPerMin: 6 },
];

const ExerciseScreen = () => {
  const [exercises, setExercises] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [stats, setStats] = useState({ total_sessions: 0, total_minutes: 0, total_calories: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [selectedType, setSelectedType] = useState(EXERCISE_TYPES[0]);
  const [duration, setDuration] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = today.toISOString().split('T')[0];
      
      const [exercisesResult, streakResult, statsResult] = await Promise.all([
        getExercises(fromStr, toStr),
        getExerciseStreak(),
        getExerciseStats(fromStr, toStr),
      ]);
      
      setExercises(exercisesResult || []);
      setStreak(streakResult || { current_streak: 0, longest_streak: 0 });
      setStats(statsResult || { total_sessions: 0, total_minutes: 0, total_calories: 0 });
      
      // Calculate weekly data from exercises
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayExercises = exercisesResult?.filter((e) => 
          e.exercised_at?.startsWith(dateStr)
        ) || [];
        const totalMins = dayExercises.reduce((sum, e) => sum + (e.duration_min || 0), 0);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        last7Days.push({
          date: `${day}/${month}`,
          minutes: totalMins,
        });
      }
      setWeeklyData(last7Days);
    } catch (error) {
      console.log('Error fetching exercise data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDurationChange = (value) => {
    setDuration(value);
    const mins = parseInt(value, 10);
    if (!isNaN(mins) && mins > 0) {
      setCalories(String(Math.round(mins * selectedType.caloriesPerMin)));
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    const mins = parseInt(duration, 10);
    if (!isNaN(mins) && mins > 0) {
      setCalories(String(Math.round(mins * type.caloriesPerMin)));
    }
  };

  const handleSubmit = async () => {
    const mins = parseInt(duration, 10);
    
    if (isNaN(mins) || mins <= 0 || mins > 600) {
      Alert.alert('Lỗi', 'Vui lòng nhập thời gian tập hợp lệ (1-600 phút)');
      return;
    }

    try {
      const result = await logExercise({
        type: selectedType.id,
        duration_min: mins,
        notes: notes || undefined,
      });
      
      // Optimistically update UI
      const newExercise = {
        id: result.id || Date.now(),
        type: selectedType.id,
        duration_min: mins,
        calories: result.calories || Math.round(mins * selectedType.caloriesPerMin),
        exercised_at: result.exercised_at || new Date().toISOString(),
        notes,
      };

      setExercises((prev) => [newExercise, ...prev]);
      setStats((prev) => ({
        total_sessions: prev.total_sessions + 1,
        total_minutes: prev.total_minutes + mins,
        total_calories: prev.total_calories + newExercise.calories,
      }));
      
      // Refresh streak
      const newStreak = await getExerciseStreak();
      setStreak(newStreak);

      // Reset form
      setDuration('');
      setCalories('');
      setNotes('');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu bài tập. Vui lòng thử lại.');
    }
  };

  const handleDeleteExercise = (id) => {
    const exercise = exercises.find((e) => e.id === id);
    if (!exercise) return;
    
    Alert.alert('Xác nhận', 'Xóa buổi tập này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExerciseApi(id);
            setExercises((prev) => prev.filter((e) => e.id !== id));
            setStats((prev) => ({
              total_sessions: Math.max(0, prev.total_sessions - 1),
              total_minutes: Math.max(0, prev.total_minutes - exercise.duration_min),
              total_calories: Math.max(0, prev.total_calories - exercise.calories),
            }));
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getTypeLabel = (typeId) => {
    return EXERCISE_TYPES.find((t) => t.id === typeId)?.label || typeId;
  };

  const getTypeIcon = (typeId) => {
    return EXERCISE_TYPES.find((t) => t.id === typeId)?.icon || 'fitness';
  };

  const chartData = {
    labels: weeklyData.map((d) => d.date),
    datasets: [{ data: weeklyData.length > 0 ? weeklyData.map((d) => d.minutes || 0) : [0] }],
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e65100" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e65100']} />}
      >
        <View style={styles.titleRow}>
          <Ionicons name="fitness" size={28} color="#2e7d32" />
          <Text style={styles.title}>Tập thể dục</Text>
        </View>
        <Text style={styles.subtitle}>Theo dõi vận động hằng ngày</Text>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakMain}>
            <Ionicons name="flame" size={28} color="#e65100" style={styles.streakIcon} />
            <Text style={styles.streakNumber}>{streak.current_streak}</Text>
            <Text style={styles.streakLabel}>ngày liên tục</Text>
          </View>
          <Text style={styles.streakRecord}>Kỷ lục: {streak.longest_streak} ngày</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.total_sessions}</Text>
            <Text style={styles.statLabel}>Buổi tập</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.total_minutes}</Text>
            <Text style={styles.statLabel}>Phút</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.total_calories}</Text>
            <Text style={styles.statLabel}>Calo</Text>
          </View>
        </View>

        {/* Add Exercise Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" style={styles.primaryButtonIcon} />
          <Text style={styles.primaryButtonText}>Ghi nhận buổi tập</Text>
        </TouchableOpacity>

        {/* Weekly Chart */}
        {weeklyData.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="bar-chart" size={18} color="#2e7d32" />
              <Text style={styles.cardTitle}>Tuần này (phút)</Text>
            </View>
            <BarChart
              data={chartData}
              width={Dimensions.get('window').width - 64}
              height={190}
              yAxisSuffix="m"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                labelColor: () => '#333',
                barPercentage: 0.5,
                propsForLabels: {
                  fontSize: 11,
                },
              }}
              style={{ marginTop: 8, borderRadius: 12 }}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
        )}

        {/* Exercise History */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="list" size={18} color="#2e7d32" />
            <Text style={styles.cardTitle}>Lịch sử gần đây</Text>
          </View>
          {exercises.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có buổi tập nào</Text>
          ) : (
            exercises.slice(0, 5).map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseRow}
                onLongPress={() => handleDeleteExercise(exercise.id)}
              >
                <View style={styles.exerciseInfo}>
                  <View style={styles.exerciseTypeRow}>
                    <Ionicons name={getTypeIcon(exercise.type)} size={16} color="#2e7d32" />
                    <Text style={styles.exerciseType}>{getTypeLabel(exercise.type)}</Text>
                  </View>
                  <Text style={styles.exerciseDate}>{formatDate(exercise.exercised_at)}</Text>
                </View>
                <View style={styles.exerciseStats}>
                  <Text style={styles.exerciseDuration}>{exercise.duration_min} phút</Text>
                  <Text style={styles.exerciseCalories}>{exercise.calories} calo</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          {exercises.length > 0 && (
            <Text style={styles.hintText}>Nhấn giữ để xóa</Text>
          )}
        </View>

        {/* Add Exercise Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Ghi nhận buổi tập</Text>

              {/* Exercise Type Selection */}
              <Text style={styles.fieldLabel}>Loại bài tập</Text>
              <View style={styles.typeGrid}>
                {EXERCISE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeButton,
                      selectedType.id === type.id && styles.typeButtonSelected,
                    ]}
                    onPress={() => handleTypeSelect(type)}
                  >
                    <View style={styles.typeButtonContent}>
                      <Ionicons
                        name={type.icon}
                        size={16}
                        color={selectedType.id === type.id ? '#fff' : '#2e7d32'}
                      />
                      <Text
                        style={[
                          styles.typeButtonText,
                          selectedType.id === type.id && styles.typeButtonTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration */}
              <Text style={styles.fieldLabel}>Thời gian (phút)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={duration}
                onChangeText={handleDurationChange}
                placeholder="VD: 30"
                placeholderTextColor="#999"
              />

              {/* Calories */}
              <Text style={styles.fieldLabel}>Calo đốt (tự động tính hoặc nhập)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
                placeholder="Tự động tính"
                placeholderTextColor="#999"
              />

              {/* Notes */}
              <Text style={styles.fieldLabel}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="VD: Morning workout"
                placeholderTextColor="#999"
                multiline
              />

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.secondaryButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                  <Text style={styles.submitButtonText}>Lưu</Text>
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
    backgroundColor: '#f5fff5',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2e7d32',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  streakIcon: {
    marginRight: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#e65100',
  },
  streakLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e65100',
    marginLeft: 8,
  },
  streakRecord: {
    fontSize: 14,
    color: '#bf360c',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2e7d32',
  },
  statLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  primaryButtonIcon: {
    marginRight: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2e7d32',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exerciseType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  exerciseDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  exerciseStats: {
    alignItems: 'flex-end',
  },
  exerciseDuration: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  exerciseCalories: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2e7d32',
    backgroundColor: '#fff',
  },
  typeButtonSelected: {
    backgroundColor: '#2e7d32',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default ExerciseScreen;
