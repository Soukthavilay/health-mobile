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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  searchFoods,
  logMeal,
  getMealLogs,
  deleteMealLog,
  getNutritionSummary,
} from '../services/api.js';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Sáng', icon: 'sunny' },
  { id: 'lunch', label: 'Trưa', icon: 'sunny-outline' },
  { id: 'dinner', label: 'Tối', icon: 'moon' },
  { id: 'snack', label: 'Snack', icon: 'nutrition' },
];

const NutritionScreen = () => {
  const [meals, setMeals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(MEAL_TYPES[0]);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [summary, setSummary] = useState({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commonFoods, setCommonFoods] = useState([]);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [mealsResult, summaryResult] = await Promise.all([
        getMealLogs(today),
        getNutritionSummary(today),
      ]);

      // Try to get popular foods, handle error gracefully
      let foodsResult = [];
      try {
        foodsResult = await searchFoods('phở', 8); // Get a common food as default
      } catch (e) {
        console.log('Could not load suggestions:', e);
      }

      // Transform meal logs to display format
      const formattedMeals = (Array.isArray(mealsResult) ? mealsResult : []).map((meal) => ({
        id: meal.id,
        type: meal.meal_type,
        name: meal.food_name || meal.name,
        calories: meal.calories || 0,
        time: new Date(meal.logged_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }));
      setMeals(formattedMeals);

      setSummary(summaryResult || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
      setCalorieGoal(summaryResult?.goal_calories || 2000);
      setCommonFoods(Array.isArray(foodsResult) ? foodsResult : []);
    } catch (error) {
      console.log('Error fetching nutrition data:', error);
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

  const totalCalories = summary.calories || meals.reduce((sum, m) => sum + m.calories, 0);
  const remaining = calorieGoal - totalCalories;
  const progress = Math.min((totalCalories / calorieGoal) * 100, 100);

  const getMealsByType = (type) => meals.filter((m) => m.type === type);

  const handleAddMeal = async () => {
    if (!foodName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên món ăn');
      return;
    }
    const cals = parseInt(calories, 10);
    if (isNaN(cals) || cals <= 0 || cals > 5000) {
      Alert.alert('Lỗi', 'Vui lòng nhập số calo hợp lệ (1-5000)');
      return;
    }

    try {
      const result = await logMeal({
        meal_type: selectedMealType.id,
        food_name: foodName.trim(),
        calories: cals,
      });

      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newMeal = {
        id: result.id || Date.now(),
        type: selectedMealType.id,
        name: foodName.trim(),
        calories: cals,
        time,
      };

      setMeals((prev) => [...prev, newMeal]);
      setSummary((prev) => ({ ...prev, calories: (prev.calories || 0) + cals }));
      setFoodName('');
      setCalories('');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm. Vui lòng thử lại.');
    }
  };

  const handleQuickAdd = async (food) => {
    try {
      const result = await logMeal({
        food_id: food.id,
        meal_type: selectedMealType.id,
        grams: 100,
      });

      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newMeal = {
        id: result.id || Date.now(),
        type: selectedMealType.id,
        name: food.name,
        calories: food.calories_per_100g || food.calories || 0,
        time,
      };

      setMeals((prev) => [...prev, newMeal]);
      setSummary((prev) => ({ ...prev, calories: (prev.calories || 0) + newMeal.calories }));
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm. Vui lòng thử lại.');
    }
  };

  const handleDeleteMeal = (id, mealCalories) => {
    Alert.alert('Xác nhận', 'Xóa món ăn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMealLog(id);
            setMeals((prev) => prev.filter((m) => m.id !== id));
            setSummary((prev) => ({ ...prev, calories: Math.max(0, (prev.calories || 0) - mealCalories) }));
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa. Vui lòng thử lại.');
          }
        },
      },
    ]);
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
          <Ionicons name="restaurant" size={28} color="#e65100" />
          <Text style={styles.title}>Dinh dưỡng</Text>
        </View>
        <Text style={styles.subtitle}>Theo dõi calo và bữa ăn</Text>

        {/* Calorie Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalCalories}</Text>
              <Text style={styles.summaryLabel}>Đã ăn</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: remaining >= 0 ? '#43a047' : '#e53935' }]}>
                {Math.abs(remaining)}
              </Text>
              <Text style={styles.summaryLabel}>{remaining >= 0 ? 'Còn lại' : 'Vượt quá'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{calorieGoal}</Text>
              <Text style={styles.summaryLabel}>Mục tiêu</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: progress > 100 ? '#e53935' : '#43a047',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}% mục tiêu ngày</Text>
        </View>

        {/* Add Meal Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" style={styles.primaryButtonIcon} />
          <Text style={styles.primaryButtonText}>Thêm bữa ăn</Text>
        </TouchableOpacity>

        {/* Meals by Type */}
        {MEAL_TYPES.map((type) => {
          const typeMeals = getMealsByType(type.id);
          const typeCalories = typeMeals.reduce((sum, m) => sum + m.calories, 0);

          return (
            <View key={type.id} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTypeRow}>
                  <Ionicons name={type.icon} size={18} color="#e65100" />
                  <Text style={styles.mealTypeTitle}>{type.label}</Text>
                </View>
                <Text style={styles.mealTypeCalories}>{typeCalories} cal</Text>
              </View>

              {typeMeals.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có món nào</Text>
              ) : (
                typeMeals.map((meal) => (
                  <TouchableOpacity
                    key={meal.id}
                    style={styles.mealRow}
                    onLongPress={() => handleDeleteMeal(meal.id, meal.calories)}
                  >
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealTime}>{meal.time}</Text>
                    </View>
                    <Text style={styles.mealCalories}>{meal.calories} cal</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          );
        })}

        <Text style={styles.hintText}>Nhấn giữ món ăn để xóa</Text>

        {/* Add Meal Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Thêm bữa ăn</Text>

                {/* Meal Type Selection */}
                <Text style={styles.label}>Bữa ăn</Text>
                <View style={styles.typeRow}>
                  {MEAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        selectedMealType.id === type.id && styles.typeButtonSelected,
                      ]}
                      onPress={() => setSelectedMealType(type)}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          selectedMealType.id === type.id && styles.typeButtonTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Quick Add */}
                <View style={styles.labelRow}>
                  <Ionicons name="flash" size={16} color="#333" />
                  <Text style={styles.label}>Chọn nhanh</Text>
                </View>
                <View style={styles.quickGrid}>
                  {commonFoods.slice(0, 6).map((food, index) => (
                    <TouchableOpacity
                      key={food.id || index}
                      style={styles.quickButton}
                      onPress={() => handleQuickAdd(food)}
                    >
                      <Text style={styles.quickName}>{food.name}</Text>
                      <Text style={styles.quickCalories}>{food.calories_per_100g || food.calories || 0} cal</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.orText}>— hoặc nhập tùy chỉnh —</Text>

                {/* Custom Input */}
                <Text style={styles.label}>Tên món ăn</Text>
                <TextInput
                  style={styles.input}
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="VD: Cơm sườn nướng"
                  placeholderTextColor="#999"
                />

                <Text style={styles.label}>Calo</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="VD: 500"
                  placeholderTextColor="#999"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAddMeal}>
                    <Text style={styles.saveButtonText}>Thêm</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    backgroundColor: '#fff3e0',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e65100',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e65100',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#ddd',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#e65100',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  mealSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e65100',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e65100',
  },
  mealTypeCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  mealTime: {
    fontSize: 12,
    color: '#888',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e65100',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e65100',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e65100',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#e65100',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e65100',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButton: {
    width: '48%',
    backgroundColor: '#fff3e0',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e65100',
  },
  quickName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  quickCalories: {
    fontSize: 11,
    color: '#e65100',
    marginTop: 2,
  },
  orText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 14,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e65100',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e65100',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e65100',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#e65100',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
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

export default NutritionScreen;
