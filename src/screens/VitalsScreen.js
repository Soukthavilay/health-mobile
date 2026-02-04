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
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import {
  logVital,
  getVitals,
  getLatestVitals,
} from '../services/api.js';

const VITAL_TYPES = [
  { id: 'heart_rate', label: '❤️ Nhịp tim', unit: 'bpm', normalRange: '60-100' },
  { id: 'blood_pressure', label: '🩸 Huyết áp', unit: 'mmHg', normalRange: '90/60 - 120/80' },
  { id: 'spo2', label: '🫁 SpO2', unit: '%', normalRange: '95-100' },
  { id: 'temperature', label: '🌡️ Thân nhiệt', unit: '°C', normalRange: '36.1-37.2' },
];

const VitalsScreen = () => {
  const [vitals, setVitals] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(VITAL_TYPES[0]);
  const [inputValue, setInputValue] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const fromStr = weekAgo.toISOString().split('T')[0];
      const toStr = today.toISOString().split('T')[0];

      const [latestResult, heartRateHistory, spo2History] = await Promise.all([
        getLatestVitals(),
        getVitals('heart_rate', fromStr, toStr),
        getVitals('spo2', fromStr, toStr),
      ]);

      // Process latest vitals
      const latest = {
        heart_rate: latestResult.heart_rate || null,
        blood_pressure: latestResult.blood_pressure || null,
        spo2: latestResult.spo2 || null,
        temperature: latestResult.temperature || null,
      };

      // Process history for charts
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(`${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      const heartRateData = dates.map(() => 0);
      const spo2Data = dates.map(() => 0);

      (Array.isArray(heartRateHistory) ? heartRateHistory : []).forEach((v) => {
        const d = new Date(v.recorded_at);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = dates.indexOf(label);
        if (idx !== -1) heartRateData[idx] = v.value || 0;
      });

      (Array.isArray(spo2History) ? spo2History : []).forEach((v) => {
        const d = new Date(v.recorded_at);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const idx = dates.indexOf(label);
        if (idx !== -1) spo2Data[idx] = v.value || 0;
      });

      setVitals({
        latest,
        history: {
          heart_rate: heartRateData.some((v) => v > 0) ? heartRateData : null,
          spo2: spo2Data.some((v) => v > 0) ? spo2Data : null,
        },
        dates,
      });
    } catch (error) {
      console.log('Error fetching vitals:', error);
      setVitals({ latest: {}, history: {}, dates: [] });
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

  const handleAddVital = async () => {
    try {
      if (selectedType.id === 'blood_pressure') {
        const sys = parseInt(systolic, 10);
        const dia = parseInt(diastolic, 10);
        if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) {
          Alert.alert('Lỗi', 'Vui lòng nhập huyết áp hợp lệ');
          return;
        }
        await logVital({ type: 'blood_pressure', value: sys, value2: dia });
        setVitals((prev) => ({
          ...prev,
          latest: {
            ...prev.latest,
            blood_pressure: { systolic: sys, diastolic: dia, value: sys, value2: dia, recorded_at: new Date().toISOString() },
          },
        }));
      } else {
        const value = parseFloat(inputValue);
        if (isNaN(value) || value <= 0) {
          Alert.alert('Lỗi', 'Vui lòng nhập giá trị hợp lệ');
          return;
        }
        await logVital({ type: selectedType.id, value });
        setVitals((prev) => ({
          ...prev,
          latest: {
            ...prev.latest,
            [selectedType.id]: { value, recorded_at: new Date().toISOString() },
          },
        }));
      }

      setInputValue('');
      setSystolic('');
      setDiastolic('');
      setModalVisible(false);
      Alert.alert('Thành công', 'Đã lưu chỉ số sinh tồn');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu. Vui lòng thử lại.');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVitalStatus = (type, value) => {
    if (type === 'heart_rate') {
      if (value < 60) return { label: 'Thấp', color: '#1976d2' };
      if (value > 100) return { label: 'Cao', color: '#e53935' };
      return { label: 'Bình thường', color: '#43a047' };
    }
    if (type === 'temperature') {
      if (value < 36.1) return { label: 'Thấp', color: '#1976d2' };
      if (value > 37.2) return { label: 'Sốt nhẹ', color: '#fb8c00' };
      if (value > 38) return { label: 'Sốt', color: '#e53935' };
      return { label: 'Bình thường', color: '#43a047' };
    }
    return { label: '', color: '#333' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#c62828" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vitals) return null;

  const chartWidth = Dimensions.get('window').width - 64;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#c62828']} />}
      >
        <Text style={styles.title}>❤️ Chỉ số sinh tồn</Text>
        <Text style={styles.subtitle}>Theo dõi sức khỏe chi tiết</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.primaryButtonText}>+ Ghi nhận chỉ số mới</Text>
        </TouchableOpacity>

        {/* Vital Cards */}
        <View style={styles.vitalsGrid}>
          {/* Heart Rate */}
          <View style={styles.vitalCard}>
            <Text style={styles.vitalIcon}>❤️</Text>
            <Text style={styles.vitalLabel}>Nhịp tim</Text>
            <Text style={styles.vitalValue}>
              {vitals.latest.heart_rate?.value || '--'} <Text style={styles.vitalUnit}>bpm</Text>
            </Text>
            {vitals.latest.heart_rate && (
              <Text style={[styles.vitalStatus, { color: getVitalStatus('heart_rate', vitals.latest.heart_rate.value).color }]}>
                {getVitalStatus('heart_rate', vitals.latest.heart_rate.value).label}
              </Text>
            )}
            <Text style={styles.vitalTime}>{formatTime(vitals.latest.heart_rate?.recorded_at)}</Text>
          </View>

          {/* Blood Pressure */}
          <View style={styles.vitalCard}>
            <Text style={styles.vitalIcon}>🩸</Text>
            <Text style={styles.vitalLabel}>Huyết áp</Text>
            <Text style={styles.vitalValue}>
              {vitals.latest.blood_pressure?.systolic || '--'}/{vitals.latest.blood_pressure?.diastolic || '--'}
              <Text style={styles.vitalUnit}> mmHg</Text>
            </Text>
            <Text style={styles.vitalNormal}>Bình thường: 90/60 - 120/80</Text>
            <Text style={styles.vitalTime}>{formatTime(vitals.latest.blood_pressure?.recorded_at)}</Text>
          </View>

          {/* SpO2 */}
          <View style={styles.vitalCard}>
            <Text style={styles.vitalIcon}>🫁</Text>
            <Text style={styles.vitalLabel}>SpO2</Text>
            <Text style={styles.vitalValue}>
              {vitals.latest.spo2?.value || '--'} <Text style={styles.vitalUnit}>%</Text>
            </Text>
            <Text style={styles.vitalTime}>{formatTime(vitals.latest.spo2?.recorded_at)}</Text>
          </View>

          {/* Temperature */}
          <View style={styles.vitalCard}>
            <Text style={styles.vitalIcon}>🌡️</Text>
            <Text style={styles.vitalLabel}>Thân nhiệt</Text>
            <Text style={styles.vitalValue}>
              {vitals.latest.temperature?.value || '--'} <Text style={styles.vitalUnit}>°C</Text>
            </Text>
            {vitals.latest.temperature && (
              <Text style={[styles.vitalStatus, { color: getVitalStatus('temperature', vitals.latest.temperature.value).color }]}>
                {getVitalStatus('temperature', vitals.latest.temperature.value).label}
              </Text>
            )}
            <Text style={styles.vitalTime}>{formatTime(vitals.latest.temperature?.recorded_at)}</Text>
          </View>
        </View>

        {/* Heart Rate Trend */}
        {vitals.history.heart_rate && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>❤️ Xu hướng nhịp tim (7 ngày)</Text>
            <LineChart
              data={{
                labels: vitals.dates,
                datasets: [{ data: vitals.history.heart_rate }],
              }}
              width={chartWidth}
              height={160}
              yAxisSuffix="bpm"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(229, 57, 53, ${opacity})`,
                labelColor: () => '#666',
              }}
              bezier
              style={{ marginTop: 8, borderRadius: 8 }}
            />
          </View>
        )}

        {/* SpO2 Trend */}
        {vitals.history.spo2 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>🫁 Xu hướng SpO2 (7 ngày)</Text>
            <LineChart
              data={{
                labels: vitals.dates,
                datasets: [{ data: vitals.history.spo2 }],
              }}
              width={chartWidth}
              height={160}
              yAxisSuffix="%"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
                labelColor: () => '#666',
              }}
              bezier
              style={{ marginTop: 8, borderRadius: 8 }}
            />
          </View>
        )}

        {/* Add Vital Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Ghi nhận chỉ số</Text>

              <Text style={styles.label}>Loại chỉ số</Text>
              <View style={styles.typeGrid}>
                {VITAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeButton, selectedType.id === type.id && styles.typeButtonSelected]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Text style={[styles.typeButtonText, selectedType.id === type.id && styles.typeButtonTextSelected]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedType.id === 'blood_pressure' ? (
                <>
                  <Text style={styles.label}>Tâm thu (Systolic)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={systolic}
                    onChangeText={setSystolic}
                    placeholder="VD: 120"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.label}>Tâm trương (Diastolic)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={diastolic}
                    onChangeText={setDiastolic}
                    placeholder="VD: 80"
                    placeholderTextColor="#999"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Giá trị ({selectedType.unit})</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder={`VD: ${selectedType.id === 'heart_rate' ? '72' : selectedType.id === 'spo2' ? '98' : '36.5'}`}
                    placeholderTextColor="#999"
                  />
                </>
              )}

              {selectedType.normalRange && (
                <Text style={styles.normalRangeText}>
                  Bình thường: {selectedType.normalRange}
                </Text>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddVital}>
                  <Text style={styles.saveButtonText}>Lưu</Text>
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
    backgroundColor: '#ffebee',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#c62828',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#c62828',
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
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  vitalCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e57373',
  },
  vitalIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  vitalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
  },
  vitalUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  vitalStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  vitalNormal: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  vitalTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e57373',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c62828',
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
    color: '#c62828',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
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
    borderColor: '#c62828',
  },
  typeButtonSelected: {
    backgroundColor: '#c62828',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c62828',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 2,
    borderColor: '#c62828',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  normalRangeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#c62828',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#c62828',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#c62828',
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

export default VitalsScreen;
