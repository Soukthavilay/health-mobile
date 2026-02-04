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
import { useFocusEffect } from '@react-navigation/native';
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal as deleteGoalApi,
} from '../services/api.js';

const GOAL_TYPES = [
  { id: 'weight_loss', label: '⚖️ Giảm cân', unit: 'kg', defaultTarget: 5 },
  { id: 'weight_gain', label: '💪 Tăng cân', unit: 'kg', defaultTarget: 3 },
  { id: 'exercise_days', label: '🏃 Tập luyện', unit: 'ngày/tuần', defaultTarget: 5 },
  { id: 'water_intake', label: '💧 Uống nước', unit: 'ml/ngày', defaultTarget: 2000 },
  { id: 'sleep_hours', label: '😴 Giấc ngủ', unit: 'tiếng/đêm', defaultTarget: 8 },
  { id: 'steps', label: '👟 Bước chân', unit: 'bước/ngày', defaultTarget: 10000 },
];

const PRESET_GOALS = [
  { type: 'weight_loss', target: 5, description: 'Giảm 5kg trong 3 tháng' },
  { type: 'exercise_days', target: 5, description: 'Tập 5 ngày/tuần' },
  { type: 'water_intake', target: 2000, description: 'Uống 2L nước mỗi ngày' },
  { type: 'sleep_hours', target: 8, description: 'Ngủ đủ 8 tiếng' },
];

const GoalsScreen = () => {
  const [goals, setGoals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(GOAL_TYPES[0]);
  const [targetValue, setTargetValue] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [activeResult, completedResult] = await Promise.all([
        getGoals('active'),
        getGoals('completed'),
      ]);
      setGoals([...(activeResult || []), ...(completedResult || [])]);
    } catch (error) {
      console.log('Error fetching goals:', error);
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

  const getProgress = (goal) => {
    if (goal.target_value === 0) return 0;
    return Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100);
  };

  const getTypeInfo = (typeId) => GOAL_TYPES.find((t) => t.id === typeId) || GOAL_TYPES[0];

  const handleAddGoal = async () => {
    const target = parseInt(targetValue, 10);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập mục tiêu hợp lệ');
      return;
    }

    try {
      const result = await createGoal({
        type: selectedType.id,
        target_value: target,
        unit: selectedType.unit,
        description: description.trim() || undefined,
      });

      const newGoal = {
        id: result.id || Date.now(),
        type: selectedType.id,
        target_value: target,
        current_value: 0,
        unit: selectedType.unit,
        description: description.trim() || `${selectedType.label} - ${target} ${selectedType.unit}`,
        status: 'active',
      };

      setGoals((prev) => [newGoal, ...prev]);
      setTargetValue('');
      setDescription('');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo mục tiêu. Vui lòng thử lại.');
    }
  };

  const handlePresetSelect = async (preset) => {
    try {
      const typeInfo = getTypeInfo(preset.type);
      const result = await createGoal({
        type: preset.type,
        target_value: preset.target,
        unit: typeInfo.unit,
        description: preset.description,
      });

      const newGoal = {
        id: result.id || Date.now(),
        type: preset.type,
        target_value: preset.target,
        current_value: 0,
        unit: typeInfo.unit,
        description: preset.description,
        status: 'active',
      };
      setGoals((prev) => [newGoal, ...prev]);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tạo mục tiêu. Vui lòng thử lại.');
    }
  };

  const handleDeleteGoal = (id) => {
    Alert.alert('Xác nhận', 'Xóa mục tiêu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGoalApi(id);
            setGoals((prev) => prev.filter((g) => g.id !== id));
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  const handleUpdateProgress = (goal) => {
    Alert.prompt(
      'Cập nhật tiến độ',
      `Nhập giá trị hiện tại (${goal.unit}):`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Lưu',
          onPress: async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              try {
                const newStatus = numValue >= goal.target_value ? 'completed' : 'active';
                await updateGoal(goal.id, { current_value: numValue, status: newStatus });
                setGoals((prev) =>
                  prev.map((g) => {
                    if (g.id === goal.id) {
                      return { ...g, current_value: numValue, status: newStatus };
                    }
                    return g;
                  })
                );
              } catch (error) {
                Alert.alert('Lỗi', 'Không thể cập nhật. Vui lòng thử lại.');
              }
            }
          },
        },
      ],
      'plain-text',
      String(goal.current_value || '')
    );
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6f00" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6f00']} />}
      >
        <Text style={styles.title}>🎯 Mục tiêu</Text>
        <Text style={styles.subtitle}>Đặt mục tiêu và theo dõi tiến độ</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.primaryButtonText}>+ Tạo mục tiêu mới</Text>
        </TouchableOpacity>

        {/* Active Goals */}
        <Text style={styles.sectionTitle}>📈 Đang thực hiện ({activeGoals.length})</Text>
        {activeGoals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Chưa có mục tiêu nào</Text>
          </View>
        ) : (
          activeGoals.map((goal) => {
            const typeInfo = getTypeInfo(goal.type);
            const progress = getProgress(goal);
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalIcon}>{typeInfo.label.split(' ')[0]}</Text>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>{goal.description}</Text>
                    <Text style={styles.goalMeta}>
                      {goal.current_value} / {goal.target_value} {goal.unit}
                    </Text>
                  </View>
                  <Text style={styles.goalPercent}>{Math.round(progress)}%</Text>
                </View>

                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>

                <View style={styles.goalActions}>
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => handleUpdateProgress(goal)}
                  >
                    <Text style={styles.updateButtonText}>Cập nhật</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteGoal(goal.id)}
                  >
                    <Text style={styles.deleteButtonText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✅ Đã hoàn thành ({completedGoals.length})</Text>
            {completedGoals.map((goal) => {
              const typeInfo = getTypeInfo(goal.type);
              return (
                <View key={goal.id} style={[styles.goalCard, styles.completedCard]}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalIcon}>{typeInfo.label.split(' ')[0]}</Text>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalTitle, styles.completedTitle]}>
                        {goal.description}
                      </Text>
                      <Text style={styles.goalMeta}>🎉 Hoàn thành!</Text>
                    </View>
                    <Text style={styles.completedCheck}>✓</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Add Goal Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Tạo mục tiêu mới</Text>

                {/* Presets */}
                <Text style={styles.label}>⚡ Chọn nhanh</Text>
                <View style={styles.presetsGrid}>
                  {PRESET_GOALS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.presetButton}
                      onPress={() => handlePresetSelect(preset)}
                    >
                      <Text style={styles.presetText}>{preset.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.orText}>— hoặc tạo tùy chỉnh —</Text>

                {/* Type Selection */}
                <Text style={styles.label}>Loại mục tiêu</Text>
                <View style={styles.typeGrid}>
                  {GOAL_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeButton,
                        selectedType.id === type.id && styles.typeButtonSelected,
                      ]}
                      onPress={() => {
                        setSelectedType(type);
                        setTargetValue(String(type.defaultTarget));
                      }}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          selectedType.id === type.id && styles.typeButtonTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Target Value */}
                <Text style={styles.label}>Mục tiêu ({selectedType.unit})</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={targetValue}
                  onChangeText={setTargetValue}
                  placeholder={`VD: ${selectedType.defaultTarget}`}
                  placeholderTextColor="#999"
                />

                {/* Description */}
                <Text style={styles.label}>Mô tả (tùy chọn)</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="VD: Giảm cân để khỏe mạnh hơn"
                  placeholderTextColor="#999"
                />

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal}>
                    <Text style={styles.saveButtonText}>Tạo</Text>
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
    backgroundColor: '#fff8e1',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff6f00',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#ff6f00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ff6f00',
  },
  completedCard: {
    borderColor: '#43a047',
    backgroundColor: '#e8f5e9',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#43a047',
  },
  goalMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  goalPercent: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ff6f00',
  },
  completedCheck: {
    fontSize: 24,
    fontWeight: '900',
    color: '#43a047',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6f00',
    borderRadius: 4,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  updateButton: {
    backgroundColor: '#ff6f00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: '#e53935',
    fontSize: 14,
    fontWeight: '700',
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
    color: '#ff6f00',
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
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#fff3e0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff6f00',
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff6f00',
  },
  orText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ff6f00',
  },
  typeButtonSelected: {
    backgroundColor: '#ff6f00',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff6f00',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 2,
    borderColor: '#ff6f00',
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
    borderColor: '#ff6f00',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ff6f00',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#ff6f00',
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

export default GoalsScreen;
