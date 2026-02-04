import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import {
  logSleep,
  getSleepLogs,
  getSleepAverage,
  deleteSleepLog as deleteSleepLogApi,
} from '../services/api.js';

const QUALITY_OPTIONS = [
  { id: 'poor', label: '😴 Kém', color: '#e53935' },
  { id: 'fair', label: '😐 Tạm', color: '#fb8c00' },
  { id: 'good', label: '😊 Tốt', color: '#43a047' },
  { id: 'excellent', label: '🌟 Tuyệt', color: '#1e88e5' },
];

const SleepScreen = () => {
  const [sleepLogs, setSleepLogs] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [average, setAverage] = useState({ avg_duration_hours: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [sleepHour, setSleepHour] = useState(23);
  const [sleepMinute, setSleepMinute] = useState(0);
  const [wakeHour, setWakeHour] = useState(7);
  const [wakeMinute, setWakeMinute] = useState(0);
  const [quality, setQuality] = useState('good');

  const fetchData = async () => {
    try {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = today.toISOString().split('T')[0];

      const [logsResult, avgResult] = await Promise.all([
        getSleepLogs(fromStr, toStr),
        getSleepAverage(),
      ]);

      setSleepLogs(logsResult || []);
      setAverage(avgResult || { avg_duration_hours: 0, quality_distribution: {} });

      // Calculate weekly data from logs
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLog = logsResult?.find((log) =>
          log.wake_time?.startsWith(dateStr)
        );
        last7Days.push({
          date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          hours: dayLog?.duration_hours || 0,
        });
      }
      setWeeklyData(last7Days);
    } catch (error) {
      console.log('Error fetching sleep data:', error);
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

  const calculateDuration = () => {
    let sleepMins = sleepHour * 60 + sleepMinute;
    let wakeMins = wakeHour * 60 + wakeMinute;
    if (wakeMins <= sleepMins) {
      wakeMins += 24 * 60;
    }
    return (wakeMins - sleepMins) / 60;
  };

  const handleSubmit = async () => {
    const duration = calculateDuration();
    
    if (duration <= 0 || duration > 24) {
      Alert.alert('Lỗi', 'Thời gian ngủ không hợp lệ');
      return;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sleepTime = new Date(yesterday);
    sleepTime.setHours(sleepHour, sleepMinute, 0);
    
    const wakeTime = new Date(today);
    wakeTime.setHours(wakeHour, wakeMinute, 0);

    try {
      const result = await logSleep({
        sleep_time: sleepTime.toISOString(),
        wake_time: wakeTime.toISOString(),
        quality,
      });

      const newLog = {
        id: result.id || Date.now(),
        sleep_time: sleepTime.toISOString(),
        wake_time: wakeTime.toISOString(),
        duration_hours: result.duration_hours || Math.round(duration * 10) / 10,
        quality,
      };

      setSleepLogs((prev) => [newLog, ...prev]);
      setWeeklyData((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          hours: newLog.duration_hours,
        };
        return updated;
      });

      // Refresh average
      const newAvg = await getSleepAverage();
      setAverage(newAvg);

      setModalVisible(false);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu giấc ngủ. Vui lòng thử lại.');
    }
  };

  const handleDeleteSleepLog = (id) => {
    Alert.alert('Xác nhận', 'Xóa bản ghi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSleepLogApi(id);
            setSleepLogs((prev) => prev.filter((s) => s.id !== id));
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

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const getQualityLabel = (q) => QUALITY_OPTIONS.find((opt) => opt.id === q)?.label || q;

  const getSleepAdvice = (hours) => {
    if (hours >= 7 && hours <= 9) return { text: 'Thời gian ngủ lý tưởng! 👍', color: '#43a047' };
    if (hours >= 6 && hours < 7) return { text: 'Nên ngủ thêm 1 tiếng', color: '#fb8c00' };
    if (hours < 6) return { text: 'Thiếu ngủ! Cần ngủ đủ 7-8 tiếng', color: '#e53935' };
    return { text: 'Ngủ hơi nhiều, 7-9 tiếng là đủ', color: '#1e88e5' };
  };

  const advice = getSleepAdvice(average.avg_duration_hours);

  const chartData = {
    labels: weeklyData.map((d) => d.date),
    datasets: [{ data: weeklyData.length > 0 ? weeklyData.map((d) => d.hours || 0) : [0] }],
  };

  const TimeSelector = ({ label, hour, setHour, minute, setMinute }) => (
    <View style={styles.timeSelector}>
      <Text style={styles.timeSelectorLabel}>{label}</Text>
      <View style={styles.timeInputRow}>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setHour((h) => (h > 0 ? h - 1 : 23))}
        >
          <Text style={styles.timeButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.timeValue}>{String(hour).padStart(2, '0')}</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setHour((h) => (h < 23 ? h + 1 : 0))}
        >
          <Text style={styles.timeButtonText}>+</Text>
        </TouchableOpacity>
        <Text style={styles.timeColon}>:</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setMinute((m) => (m >= 15 ? m - 15 : 45))}
        >
          <Text style={styles.timeButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.timeValue}>{String(minute).padStart(2, '0')}</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setMinute((m) => (m < 45 ? m + 15 : 0))}
        >
          <Text style={styles.timeButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#673ab7" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#673ab7']} />}
      >
        <Text style={styles.title}>😴 Giấc ngủ</Text>
        <Text style={styles.subtitle}>Theo dõi chất lượng giấc ngủ</Text>

        {/* Average Card */}
        <View style={styles.avgCard}>
          <Text style={styles.avgLabel}>Trung bình 7 ngày</Text>
          <Text style={styles.avgValue}>{average.avg_duration_hours.toFixed(1)} tiếng</Text>
          <Text style={[styles.avgAdvice, { color: advice.color }]}>{advice.text}</Text>
        </View>

        {/* Log Sleep Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.primaryButtonText}>+ Ghi nhận giấc ngủ đêm qua</Text>
        </TouchableOpacity>

        {/* Weekly Chart */}
        {weeklyData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 7 ngày gần nhất (giờ)</Text>
            <BarChart
              data={chartData}
              width={Dimensions.get('window').width - 64}
              height={160}
              yAxisSuffix="h"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(103, 58, 183, ${opacity})`,
                labelColor: () => '#333',
                barPercentage: 0.6,
              }}
              style={{ marginTop: 8, borderRadius: 12 }}
              showValuesOnTopOfBars
            />
            <View style={styles.goalLine}>
              <Text style={styles.goalLineText}>Mục tiêu: 7-8 tiếng/đêm</Text>
            </View>
          </View>
        )}

        {/* Sleep Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardTitle}>💡 Mẹo ngủ ngon</Text>
          <Text style={styles.tipText}>• Đi ngủ và thức dậy cùng giờ mỗi ngày</Text>
          <Text style={styles.tipText}>• Tránh caffeine sau 2 giờ chiều</Text>
          <Text style={styles.tipText}>• Tắt màn hình 30 phút trước khi ngủ</Text>
          <Text style={styles.tipText}>• Giữ phòng ngủ mát và tối</Text>
        </View>

        {/* Sleep History */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Lịch sử giấc ngủ</Text>
          {sleepLogs.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có dữ liệu</Text>
          ) : (
            sleepLogs.slice(0, 5).map((log) => (
              <TouchableOpacity
                key={log.id}
                style={styles.logRow}
                onLongPress={() => handleDeleteSleepLog(log.id)}
              >
                <View style={styles.logInfo}>
                  <Text style={styles.logDate}>{formatDate(log.wake_time)}</Text>
                  <Text style={styles.logTime}>
                    {formatTime(log.sleep_time)} → {formatTime(log.wake_time)}
                  </Text>
                </View>
                <View style={styles.logStats}>
                  <Text style={styles.logDuration}>{log.duration_hours}h</Text>
                  <Text style={styles.logQuality}>{getQualityLabel(log.quality)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
          {sleepLogs.length > 0 && <Text style={styles.hintText}>Nhấn giữ để xóa</Text>}
        </View>

        {/* Log Sleep Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Ghi nhận giấc ngủ đêm qua</Text>

              <TimeSelector
                label="Giờ đi ngủ (tối qua)"
                hour={sleepHour}
                setHour={setSleepHour}
                minute={sleepMinute}
                setMinute={setSleepMinute}
              />

              <TimeSelector
                label="Giờ thức dậy (sáng nay)"
                hour={wakeHour}
                setHour={setWakeHour}
                minute={wakeMinute}
                setMinute={setWakeMinute}
              />

              <Text style={styles.durationPreview}>
                ⏱ Tổng: {calculateDuration().toFixed(1)} tiếng
              </Text>

              <Text style={styles.fieldLabel}>Chất lượng giấc ngủ</Text>
              <View style={styles.qualityRow}>
                {QUALITY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.qualityButton,
                      quality === opt.id && { backgroundColor: opt.color, borderColor: opt.color },
                    ]}
                    onPress={() => setQuality(opt.id)}
                  >
                    <Text
                      style={[styles.qualityButtonText, quality === opt.id && { color: '#fff' }]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
    backgroundColor: '#f3e5f5',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#673ab7',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  avgCard: {
    backgroundColor: '#ede7f6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#673ab7',
  },
  avgLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  avgValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#673ab7',
  },
  avgAdvice: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#673ab7',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#673ab7',
  },
  tipsCard: {
    backgroundColor: '#fff9c4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f9a825',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#673ab7',
    marginBottom: 12,
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
  tipText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logInfo: {
    flex: 1,
  },
  logDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  logTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  logStats: {
    alignItems: 'flex-end',
  },
  logDuration: {
    fontSize: 18,
    fontWeight: '800',
    color: '#673ab7',
  },
  logQuality: {
    fontSize: 12,
    color: '#666',
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
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#673ab7',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeSelector: {
    marginBottom: 16,
  },
  timeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#673ab7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  timeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginHorizontal: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginHorizontal: 8,
  },
  durationPreview: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#673ab7',
    marginBottom: 16,
    backgroundColor: '#ede7f6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  qualityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  qualityButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#673ab7',
    alignItems: 'center',
  },
  qualityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#673ab7',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#673ab7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#673ab7',
    fontSize: 16,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#673ab7',
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

export default SleepScreen;
