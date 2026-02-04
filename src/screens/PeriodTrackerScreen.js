import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getPeriodLogs, getPeriodPredictions, logPeriod } from '../services/api.js';

const SYMPTOMS = [
  { id: 'cramps', label: '😣 Đau bụng' },
  { id: 'headache', label: '🤕 Đau đầu' },
  { id: 'bloating', label: '🫃 Đầy hơi' },
  { id: 'fatigue', label: '😴 Mệt mỏi' },
  { id: 'mood', label: '😤 Thay đổi tâm trạng' },
  { id: 'acne', label: '😔 Mụn' },
];

const MOODS = [
  { id: 'happy', label: '😊 Vui vẻ' },
  { id: 'calm', label: '😌 Bình tĩnh' },
  { id: 'sad', label: '😢 Buồn' },
  { id: 'anxious', label: '😰 Lo lắng' },
  { id: 'irritable', label: '😤 Cáu gắt' },
  { id: 'sensitive', label: '🥺 Nhạy cảm' },
];

const PeriodTrackerScreen = () => {
  const [cycleData, setCycleData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [flowLevel, setFlowLevel] = useState(2); // 1-3
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [logsResult, predictionsResult] = await Promise.all([
        getPeriodLogs(),
        getPeriodPredictions(),
      ]);
      
      // Transform logs to cycle data
      const cycles = (logsResult || []).map((log) => ({
        start: log.start_date,
        end: log.end_date,
        length: log.cycle_length || 28,
      }));
      
      const lastPeriod = cycles.length > 0 ? cycles[0] : null;
      
      setCycleData({
        lastPeriodStart: lastPeriod?.start || null,
        cycleLength: predictionsResult?.avg_cycle_length || 28,
        periodLength: 5,
        cycles,
      });
      
      setPredictions(predictionsResult);
    } catch (error) {
      console.log('Error fetching period data:', error);
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

  const calculateNextPeriod = () => {
    // Use predictions if available
    if (predictions?.next_period) {
      return new Date(predictions.next_period);
    }
    // Fallback to calculation
    if (!cycleData?.lastPeriodStart) return null;
    const lastStart = new Date(cycleData.lastPeriodStart);
    const nextStart = new Date(lastStart);
    nextStart.setDate(nextStart.getDate() + (cycleData.cycleLength || 28));
    return nextStart;
  };

  const getDaysUntilPeriod = () => {
    const next = calculateNextPeriod();
    if (!next) return null;
    const today = new Date();
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCurrentPhase = () => {
    const daysUntil = getDaysUntilPeriod();
    if (daysUntil === null) return null;
    
    if (daysUntil <= 0 && daysUntil > -(cycleData?.periodLength || 5)) {
      return { phase: 'Kinh nguyệt', color: '#e91e63', icon: '🩸' };
    }
    if (daysUntil > 0 && daysUntil <= 7) {
      return { phase: 'Trước kỳ kinh (PMS)', color: '#ff9800', icon: '⚠️' };
    }
    if (daysUntil > 7 && daysUntil <= 14) {
      return { phase: 'Giai đoạn nang trứng', color: '#4caf50', icon: '🌱' };
    }
    return { phase: 'Giai đoạn rụng trứng', color: '#9c27b0', icon: '✨' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId) ? prev.filter((s) => s !== symptomId) : [...prev, symptomId]
    );
  };

  const handleLog = async () => {
    Alert.alert('Đã lưu', 'Thông tin đã được ghi nhận');
    setLogModalVisible(false);
    setSelectedSymptoms([]);
    setSelectedMood(null);
  };

  const handleStartPeriod = async () => {
    Alert.alert('Bắt đầu kỳ kinh', 'Đã ghi nhận ngày bắt đầu kỳ kinh mới', [
      {
        text: 'OK',
        onPress: async () => {
          try {
            const today = new Date().toISOString().split('T')[0];
            const flowLevelText = flowLevel === 1 ? 'light' : flowLevel === 2 ? 'medium' : 'heavy';
            await logPeriod({
              start_date: today,
              flow_level: flowLevelText,
              symptoms: selectedSymptoms.join(','),
            });
            fetchData(); // Refresh data
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể lưu. Vui lòng thử lại.');
          }
        },
      },
    ]);
  };

  const phase = getCurrentPhase();
  const daysUntil = getDaysUntilPeriod();
  const nextPeriod = calculateNextPeriod();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ad1457" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ad1457']} />}
      >
        <Text style={styles.title}>🌸 Theo dõi kinh nguyệt</Text>
        <Text style={styles.subtitle}>Dự đoán và ghi nhận chu kỳ</Text>

        {/* Current Phase Card */}
        {phase && (
          <View style={[styles.phaseCard, { borderColor: phase.color }]}>
            <Text style={styles.phaseIcon}>{phase.icon}</Text>
            <Text style={[styles.phaseName, { color: phase.color }]}>{phase.phase}</Text>
            
            {daysUntil !== null && daysUntil > 0 && (
              <View style={styles.countdown}>
                <Text style={styles.countdownNumber}>{daysUntil}</Text>
                <Text style={styles.countdownLabel}>ngày đến kỳ kinh</Text>
              </View>
            )}
            
            {daysUntil !== null && daysUntil <= 0 && (
              <Text style={styles.inPeriodText}>Đang trong kỳ kinh</Text>
            )}
          </View>
        )}

        {/* Next Period Prediction */}
        {nextPeriod && (
          <View style={styles.predictionCard}>
            <Text style={styles.predictionLabel}>📅 Dự đoán kỳ kinh tiếp theo</Text>
            <Text style={styles.predictionDate}>
              {nextPeriod.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <Text style={styles.predictionNote}>
              Dựa trên chu kỳ trung bình {cycleData.cycleLength} ngày
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleStartPeriod}>
            <Text style={styles.actionIcon}>🩸</Text>
            <Text style={styles.actionText}>Bắt đầu{'\n'}kỳ kinh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => setLogModalVisible(true)}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Ghi{'\n'}triệu chứng</Text>
          </TouchableOpacity>
        </View>

        {/* Cycle Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📊 Thống kê chu kỳ</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{cycleData.cycleLength}</Text>
              <Text style={styles.infoLabel}>ngày/chu kỳ</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{cycleData.periodLength}</Text>
              <Text style={styles.infoLabel}>ngày kỳ kinh</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{cycleData.cycles.length}</Text>
              <Text style={styles.infoLabel}>chu kỳ đã ghi</Text>
            </View>
          </View>
        </View>

        {/* Cycle History */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>📜 Lịch sử chu kỳ</Text>
          {cycleData.cycles.map((cycle, index) => (
            <View key={index} style={styles.historyRow}>
              <Text style={styles.historyDate}>{formatDate(cycle.start)} - {formatDate(cycle.end)}</Text>
              <Text style={styles.historyLength}>{cycle.length} ngày</Text>
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Mẹo theo giai đoạn</Text>
          {phase?.phase === 'Kinh nguyệt' && (
            <Text style={styles.tipText}>
              • Nghỉ ngơi nhiều hơn{'\n'}
              • Chườm nóng giảm đau bụng{'\n'}
              • Uống nhiều nước ấm{'\n'}
              • Tránh đồ lạnh, cay
            </Text>
          )}
          {phase?.phase === 'Trước kỳ kinh (PMS)' && (
            <Text style={styles.tipText}>
              • Giảm caffeine và muối{'\n'}
              • Tập thể dục nhẹ{'\n'}
              • Ăn nhiều chất xơ{'\n'}
              • Ngủ đủ giấc
            </Text>
          )}
          {phase?.phase.includes('nang trứng') && (
            <Text style={styles.tipText}>
              • Năng lượng đang tốt{'\n'}
              • Tập luyện cường độ cao{'\n'}
              • Ăn nhiều protein{'\n'}
              • Thời điểm tốt để sáng tạo
            </Text>
          )}
          {phase?.phase.includes('rụng trứng') && (
            <Text style={styles.tipText}>
              • Thời kỳ dễ thụ thai nhất{'\n'}
              • Năng lượng và libido cao{'\n'}
              • Tập cardio hiệu quả{'\n'}
              • Da khỏe mạnh nhất
            </Text>
          )}
        </View>

        {/* Log Modal */}
        <Modal
          visible={logModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setLogModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Ghi nhận hôm nay</Text>

                {/* Flow Level */}
                <Text style={styles.label}>Mức độ dòng chảy</Text>
                <View style={styles.flowRow}>
                  {[1, 2, 3].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.flowButton, flowLevel === level && styles.flowButtonSelected]}
                      onPress={() => setFlowLevel(level)}
                    >
                      <Text style={styles.flowText}>
                        {'💧'.repeat(level)}
                      </Text>
                      <Text style={[styles.flowLabel, flowLevel === level && styles.flowLabelSelected]}>
                        {level === 1 ? 'Nhẹ' : level === 2 ? 'TB' : 'Nhiều'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Symptoms */}
                <Text style={styles.label}>Triệu chứng</Text>
                <View style={styles.optionsGrid}>
                  {SYMPTOMS.map((symptom) => (
                    <TouchableOpacity
                      key={symptom.id}
                      style={[styles.optionButton, selectedSymptoms.includes(symptom.id) && styles.optionSelected]}
                      onPress={() => toggleSymptom(symptom.id)}
                    >
                      <Text style={styles.optionText}>{symptom.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Mood */}
                <Text style={styles.label}>Tâm trạng</Text>
                <View style={styles.optionsGrid}>
                  {MOODS.map((mood) => (
                    <TouchableOpacity
                      key={mood.id}
                      style={[styles.optionButton, selectedMood === mood.id && styles.optionSelected]}
                      onPress={() => setSelectedMood(mood.id)}
                    >
                      <Text style={styles.optionText}>{mood.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setLogModalVisible(false)}>
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleLog}>
                    <Text style={styles.saveButtonText}>Lưu</Text>
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
    backgroundColor: '#fce4ec',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ad1457',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  phaseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  phaseIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  phaseName: {
    fontSize: 20,
    fontWeight: '800',
  },
  countdown: {
    marginTop: 12,
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ad1457',
  },
  countdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  inPeriodText: {
    fontSize: 16,
    color: '#e91e63',
    fontWeight: '700',
    marginTop: 10,
  },
  predictionCard: {
    backgroundColor: '#f8bbd9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  predictionDate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ad1457',
  },
  predictionNote: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ad1457',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ad1457',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f48fb1',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ad1457',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f48fb1',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ad1457',
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDate: {
    fontSize: 14,
    color: '#333',
  },
  historyLength: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ad1457',
  },
  tipsCard: {
    backgroundColor: '#fff9c4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f9a825',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f57f17',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
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
    color: '#ad1457',
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
  flowRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flowButton: {
    flex: 1,
    backgroundColor: '#fce4ec',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f48fb1',
  },
  flowButtonSelected: {
    backgroundColor: '#ad1457',
    borderColor: '#ad1457',
  },
  flowText: {
    fontSize: 18,
  },
  flowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ad1457',
    marginTop: 4,
  },
  flowLabelSelected: {
    color: '#fff',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f48fb1',
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: '#ad1457',
    borderColor: '#ad1457',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ad1457',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ad1457',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ad1457',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#ad1457',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
});

export default PeriodTrackerScreen;
