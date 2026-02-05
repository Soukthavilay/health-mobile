import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import {
  getWaterIntake,
  getWaterIntakeWeekly,
  addWaterIntake,
  deleteWaterIntake,
} from '../services/api.js';

const WaterIntakeScreen = () => {
  const [todayData, setTodayData] = useState({ entries: [], total_ml: 0, goal_ml: 2000 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [todayResult, weeklyResult] = await Promise.all([
        getWaterIntake(today),
        getWaterIntakeWeekly(),
      ]);
      
      setTodayData({
        entries: todayResult.entries || [],
        total_ml: todayResult.total_ml || 0,
        goal_ml: todayResult.goal_ml || 2000,
      });
      
      // Format weekly data for chart with short date format
      const formattedWeekly = weeklyResult.map((item) => {
        const dateObj = new Date(item.logged_date || item.date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        return {
          date: `${day}/${month}`,
          total_ml: item.total_ml || 0,
        };
      });
      setWeeklyData(formattedWeekly);
    } catch (error) {
      console.log('Error fetching water data:', error);
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

  const progress = Math.min((todayData.total_ml / todayData.goal_ml) * 100, 100);

  const handleAddWater = async (amount) => {
    try {
      const result = await addWaterIntake({ amount_ml: amount });
      
      // Optimistically update UI
      const newEntry = {
        id: result.id || Date.now(),
        amount_ml: amount,
        logged_at: result.logged_at || new Date().toISOString(),
      };
      
      setTodayData((prev) => ({
        ...prev,
        entries: [newEntry, ...prev.entries],
        total_ml: prev.total_ml + amount,
      }));
      
      // Update weekly chart
      setWeeklyData((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          total_ml: (updated[updated.length - 1].total_ml || 0) + amount,
        };
        return updated;
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm nước. Vui lòng thử lại.');
    }
  };

  const handleQuickAdd = (amount) => {
    handleAddWater(amount);
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0 || amount > 5000) {
      Alert.alert('Lỗi', 'Vui lòng nhập số ml hợp lệ (1-5000)');
      return;
    }
    handleAddWater(amount);
    setCustomAmount('');
    setCustomModalVisible(false);
  };

  const handleDeleteEntry = async (id, amount) => {
    Alert.alert('Xác nhận', `Xóa ${amount}ml?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWaterIntake(id);
            setTodayData((prev) => ({
              ...prev,
              entries: prev.entries.filter((e) => e.id !== id),
              total_ml: Math.max(0, prev.total_ml - amount),
            }));
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const chartData = {
    labels: weeklyData.map((d) => d.date),
    datasets: [{ data: weeklyData.length > 0 ? weeklyData.map((d) => d.total_ml) : [0] }],
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0b3d91" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0b3d91']} />}
      >
        <View style={styles.titleRow}>
          <Ionicons name="water" size={28} color="#0b3d91" />
          <Text style={styles.title}>Uống nước</Text>
        </View>
        <Text style={styles.subtitle}>Theo dõi lượng nước hàng ngày</Text>

        {/* Circular Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <View style={[styles.progressFill, { height: `${progress}%` }]} />
            <View style={styles.progressContent}>
              <Text style={styles.progressValue}>{todayData.total_ml}</Text>
              <Text style={styles.progressUnit}>/ {todayData.goal_ml} ml</Text>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            </View>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.quickAddContainer}>
          <TouchableOpacity style={styles.quickButton} onPress={() => handleQuickAdd(100)}>
            <Text style={styles.quickButtonText}>+100ml</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => handleQuickAdd(250)}>
            <Text style={styles.quickButtonText}>+250ml</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickButton} onPress={() => handleQuickAdd(500)}>
            <Text style={styles.quickButtonText}>+500ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickButton, styles.customButton]}
            onPress={() => setCustomModalVisible(true)}
          >
            <Text style={styles.quickButtonText}>+ Tùy chỉnh</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Chart */}
        {weeklyData.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="bar-chart" size={18} color="#0b3d91" />
              <Text style={styles.cardTitle}>7 ngày gần nhất</Text>
            </View>
            <BarChart
              data={chartData}
              width={Dimensions.get('window').width - 64}
              height={200}
              yAxisSuffix="ml"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(11, 61, 145, ${opacity})`,
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
            <View style={styles.goalLine}>
              <Text style={styles.goalLineText}>Mục tiêu: {todayData.goal_ml}ml/ngày</Text>
            </View>
          </View>
        )}

        {/* Today's Entries */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="list" size={18} color="#0b3d91" />
            <Text style={styles.cardTitle}>Hôm nay</Text>
          </View>
          {todayData.entries.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có dữ liệu. Hãy uống nước nào!</Text>
          ) : (
            todayData.entries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryRow}
                onLongPress={() => handleDeleteEntry(entry.id, entry.amount_ml)}
              >
                <Text style={styles.entryTime}>{formatTime(entry.logged_at)}</Text>
                <Text style={styles.entryAmount}>+{entry.amount_ml}ml</Text>
              </TouchableOpacity>
            ))
          )}
          {todayData.entries.length > 0 && (
            <Text style={styles.hintText}>Nhấn giữ để xóa</Text>
          )}
        </View>

        {/* Custom Amount Modal */}
        <Modal
          visible={customModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCustomModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Nhập lượng nước (ml)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="VD: 350"
                placeholderTextColor="#999"
                autoFocus
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setCustomModalVisible(false)}
                >
                  <Text style={styles.secondaryButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleCustomAdd}>
                  <Text style={styles.primaryButtonText}>Thêm</Text>
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
    backgroundColor: '#f0f8ff',
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
    color: '#0b3d91',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 4,
    borderColor: '#0b3d91',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4da6ff',
  },
  progressContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0b3d91',
  },
  progressUnit: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b3d91',
    marginTop: 4,
  },
  quickAddContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0b3d91',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  customButton: {
    backgroundColor: '#2e7d32',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0b3d91',
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
    color: '#0b3d91',
  },
  goalLine: {
    marginTop: 8,
    alignItems: 'center',
  },
  goalLineText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  entryTime: {
    fontSize: 16,
    color: '#333',
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b3d91',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0b3d91',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#0b3d91',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0b3d91',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#0b3d91',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0b3d91',
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

export default WaterIntakeScreen;
