import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const getMockData = () => ({
  bloodPressure: {
    latest: { systolic: 118, diastolic: 76, pulse: 72, recordedAt: '2026-02-01T08:00:00' },
    history: [
      { systolic: 120, diastolic: 78, pulse: 70, recordedAt: '2026-01-31T08:00:00' },
      { systolic: 115, diastolic: 75, pulse: 68, recordedAt: '2026-01-30T08:00:00' },
      { systolic: 122, diastolic: 80, pulse: 74, recordedAt: '2026-01-29T08:00:00' },
    ],
    systolicTrend: [120, 118, 122, 115, 120, 118, 118],
    diastolicTrend: [78, 76, 80, 75, 78, 76, 76],
  },
  bloodSugar: {
    latest: { value: 95, type: 'fasting', recordedAt: '2026-02-01T07:00:00' },
    history: [
      { value: 98, type: 'fasting', recordedAt: '2026-01-31T07:00:00' },
      { value: 140, type: 'after_meal', recordedAt: '2026-01-30T13:00:00' },
      { value: 92, type: 'fasting', recordedAt: '2026-01-30T07:00:00' },
    ],
    trend: [95, 98, 92, 105, 94, 96, 95],
  },
  dates: ['26/01', '27/01', '28/01', '29/01', '30/01', '31/01', '01/02'],
});

const SUGAR_TYPES = [
  { id: 'fasting', label: 'Đói (sáng)' },
  { id: 'before_meal', label: 'Trước ăn' },
  { id: 'after_meal', label: 'Sau ăn 2h' },
  { id: 'random', label: 'Bất kỳ' },
];

const BloodSugarScreen = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('bp'); // bp or sugar
  const [bpModalVisible, setBpModalVisible] = useState(false);
  const [sugarModalVisible, setSugarModalVisible] = useState(false);
  
  // BP form
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  
  // Sugar form
  const [sugarValue, setSugarValue] = useState('');
  const [sugarType, setSugarType] = useState('fasting');

  useEffect(() => {
    setData(getMockData());
  }, []);

  const getBPStatus = (sys, dia) => {
    if (sys < 90 || dia < 60) return { label: 'Thấp', color: '#1976d2' };
    if (sys < 120 && dia < 80) return { label: 'Bình thường', color: '#43a047' };
    if (sys < 130 && dia < 85) return { label: 'Tiền cao huyết áp', color: '#fb8c00' };
    return { label: 'Cao huyết áp', color: '#e53935' };
  };

  const getSugarStatus = (value, type) => {
    if (type === 'fasting') {
      if (value < 70) return { label: 'Thấp', color: '#1976d2' };
      if (value < 100) return { label: 'Bình thường', color: '#43a047' };
      if (value < 126) return { label: 'Tiền tiểu đường', color: '#fb8c00' };
      return { label: 'Tiểu đường', color: '#e53935' };
    }
    // After meal
    if (value < 140) return { label: 'Bình thường', color: '#43a047' };
    if (value < 200) return { label: 'Cần theo dõi', color: '#fb8c00' };
    return { label: 'Cao', color: '#e53935' };
  };

  const handleSaveBP = () => {
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const pul = parseInt(pulse, 10) || null;

    if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập huyết áp hợp lệ');
      return;
    }

    const newRecord = { systolic: sys, diastolic: dia, pulse: pul, recordedAt: new Date().toISOString() };
    setData((prev) => ({
      ...prev,
      bloodPressure: {
        ...prev.bloodPressure,
        latest: newRecord,
        history: [newRecord, ...prev.bloodPressure.history.slice(0, 9)],
      },
    }));

    setSystolic('');
    setDiastolic('');
    setPulse('');
    setBpModalVisible(false);
    Alert.alert('Đã lưu', 'Huyết áp đã được ghi nhận');
  };

  const handleSaveSugar = () => {
    const value = parseInt(sugarValue, 10);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập đường huyết hợp lệ');
      return;
    }

    const newRecord = { value, type: sugarType, recordedAt: new Date().toISOString() };
    setData((prev) => ({
      ...prev,
      bloodSugar: {
        ...prev.bloodSugar,
        latest: newRecord,
        history: [newRecord, ...prev.bloodSugar.history.slice(0, 9)],
      },
    }));

    setSugarValue('');
    setSugarModalVisible(false);
    Alert.alert('Đã lưu', 'Đường huyết đã được ghi nhận');
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (!data) return null;

  const chartWidth = Dimensions.get('window').width - 64;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.titleRow}>
          <Ionicons name="pulse" size={28} color="#1565c0" />
          <Text style={styles.title}>Huyết áp & Đường huyết</Text>
        </View>
        <Text style={styles.subtitle}>Theo dõi chỉ số quan trọng</Text>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bp' && styles.tabActive]}
            onPress={() => setActiveTab('bp')}
          >
            <View style={styles.tabContent}>
              <Ionicons name="water" size={16} color={activeTab === 'bp' ? '#fff' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'bp' && styles.tabTextActive]}>Huyết áp</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sugar' && styles.tabActive]}
            onPress={() => setActiveTab('sugar')}
          >
            <View style={styles.tabContent}>
              <Ionicons name="nutrition" size={16} color={activeTab === 'sugar' ? '#fff' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'sugar' && styles.tabTextActive]}>Đường huyết</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Blood Pressure Tab */}
        {activeTab === 'bp' && (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setBpModalVisible(true)}>
              <Text style={styles.primaryButtonText}>+ Ghi nhận huyết áp</Text>
            </TouchableOpacity>

            {/* Latest Reading */}
            {data.bloodPressure.latest && (
              <View style={[styles.latestCard, { borderColor: getBPStatus(data.bloodPressure.latest.systolic, data.bloodPressure.latest.diastolic).color }]}>
                <Text style={styles.latestLabel}>Mới nhất</Text>
                <Text style={styles.latestValue}>
                  {data.bloodPressure.latest.systolic}/{data.bloodPressure.latest.diastolic}
                  <Text style={styles.latestUnit}> mmHg</Text>
                </Text>
                {data.bloodPressure.latest.pulse && (
                  <Text style={styles.pulseText}>Mạch: {data.bloodPressure.latest.pulse} bpm</Text>
                )}
                <Text style={[styles.statusText, { color: getBPStatus(data.bloodPressure.latest.systolic, data.bloodPressure.latest.diastolic).color }]}>
                  {getBPStatus(data.bloodPressure.latest.systolic, data.bloodPressure.latest.diastolic).label}
                </Text>
                <Text style={styles.recordTime}>{formatTime(data.bloodPressure.latest.recordedAt)}</Text>
              </View>
            )}

            {/* Chart */}
            <View style={styles.chartCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="analytics" size={16} color="#1565c0" />
                <Text style={styles.chartTitle}>Xu hướng 7 ngày</Text>
              </View>
              <LineChart
                data={{
                  labels: data.dates,
                  datasets: [
                    { data: data.bloodPressure.systolicTrend, color: () => '#e53935' },
                    { data: data.bloodPressure.diastolicTrend, color: () => '#1976d2' },
                  ],
                  legend: ['Tâm thu', 'Tâm trương'],
                }}
                width={chartWidth}
                height={160}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: () => '#666',
                }}
                bezier
                style={{ marginTop: 8, borderRadius: 8 }}
              />
            </View>

            {/* History */}
            <View style={styles.historyCard}>
              <View style={styles.sectionTitleRowDark}>
                <Ionicons name="time" size={16} color="#333" />
                <Text style={styles.historyTitle}>Lịch sử</Text>
              </View>
              {data.bloodPressure.history.map((record, index) => (
                <View key={index} style={styles.historyRow}>
                  <Text style={styles.historyValue}>{record.systolic}/{record.diastolic}</Text>
                  <Text style={styles.historyTime}>{formatTime(record.recordedAt)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Blood Sugar Tab */}
        {activeTab === 'sugar' && (
          <>
            <TouchableOpacity style={[styles.primaryButton, styles.sugarButton]} onPress={() => setSugarModalVisible(true)}>
              <Text style={styles.primaryButtonText}>+ Ghi nhận đường huyết</Text>
            </TouchableOpacity>

            {/* Latest Reading */}
            {data.bloodSugar.latest && (
              <View style={[styles.latestCard, { borderColor: getSugarStatus(data.bloodSugar.latest.value, data.bloodSugar.latest.type).color }]}>
                <Text style={styles.latestLabel}>Mới nhất ({data.bloodSugar.latest.type === 'fasting' ? 'Đói' : 'Sau ăn'})</Text>
                <Text style={styles.latestValue}>
                  {data.bloodSugar.latest.value}
                  <Text style={styles.latestUnit}> mg/dL</Text>
                </Text>
                <Text style={[styles.statusText, { color: getSugarStatus(data.bloodSugar.latest.value, data.bloodSugar.latest.type).color }]}>
                  {getSugarStatus(data.bloodSugar.latest.value, data.bloodSugar.latest.type).label}
                </Text>
                <Text style={styles.recordTime}>{formatTime(data.bloodSugar.latest.recordedAt)}</Text>
              </View>
            )}

            {/* Chart */}
            <View style={styles.chartCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="analytics" size={16} color="#7b1fa2" />
                <Text style={[styles.chartTitle, styles.chartTitleSugar]}>Xu hướng 7 ngày</Text>
              </View>
              <LineChart
                data={{
                  labels: data.dates,
                  datasets: [{ data: data.bloodSugar.trend }],
                }}
                width={chartWidth}
                height={160}
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
                  labelColor: () => '#666',
                }}
                bezier
                style={{ marginTop: 8, borderRadius: 8 }}
              />
            </View>

            {/* Reference */}
            <View style={styles.referenceCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="list" size={16} color="#7b1fa2" />
                <Text style={styles.referenceTitle}>Mức tham khảo</Text>
              </View>
              <Text style={styles.referenceText}>Đói bình thường: &lt; 100 mg/dL</Text>
              <Text style={styles.referenceText}>Tiền tiểu đường: 100-125 mg/dL</Text>
              <Text style={styles.referenceText}>Tiểu đường: ≥ 126 mg/dL</Text>
              <Text style={styles.referenceTextSmall}>※ Sau ăn 2h bình thường: &lt; 140 mg/dL</Text>
            </View>

            {/* History */}
            <View style={styles.historyCard}>
              <View style={styles.sectionTitleRowDark}>
                <Ionicons name="time" size={16} color="#333" />
                <Text style={styles.historyTitle}>Lịch sử</Text>
              </View>
              {data.bloodSugar.history.map((record, index) => (
                <View key={index} style={styles.historyRow}>
                  <Text style={styles.historyValue}>{record.value} mg/dL</Text>
                  <Text style={styles.historyType}>{SUGAR_TYPES.find((t) => t.id === record.type)?.label}</Text>
                  <Text style={styles.historyTime}>{formatTime(record.recordedAt)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* BP Modal */}
        <Modal visible={bpModalVisible} transparent animationType="slide" onRequestClose={() => setBpModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Ghi nhận huyết áp</Text>
              
              <Text style={styles.label}>Tâm thu (Systolic) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={systolic} onChangeText={setSystolic} placeholder="VD: 120" placeholderTextColor="#999" />
              
              <Text style={styles.label}>Tâm trương (Diastolic) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={diastolic} onChangeText={setDiastolic} placeholder="VD: 80" placeholderTextColor="#999" />
              
              <Text style={styles.label}>Mạch (không bắt buộc)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={pulse} onChangeText={setPulse} placeholder="VD: 72" placeholderTextColor="#999" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setBpModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveBP}>
                  <Text style={styles.saveButtonText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Sugar Modal */}
        <Modal visible={sugarModalVisible} transparent animationType="slide" onRequestClose={() => setSugarModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Ghi nhận đường huyết</Text>
              
              <Text style={styles.label}>Loại đo</Text>
              <View style={styles.typeRow}>
                {SUGAR_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeButton, sugarType === type.id && styles.typeButtonSelected]}
                    onPress={() => setSugarType(type.id)}
                  >
                    <Text style={[styles.typeButtonText, sugarType === type.id && styles.typeButtonTextSelected]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.label}>Giá trị (mg/dL) *</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={sugarValue} onChangeText={setSugarValue} placeholder="VD: 95" placeholderTextColor="#999" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setSugarModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, styles.sugarSave]} onPress={handleSaveSugar}>
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
  safeArea: { flex: 1, backgroundColor: '#e3f2fd' },
  container: { padding: 16, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#1565c0', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#444', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleRowDark: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tabRow: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#1565c0' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#666' },
  tabTextActive: { color: '#fff' },
  primaryButton: { backgroundColor: '#1565c0', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  sugarButton: { backgroundColor: '#7b1fa2' },
  primaryButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  latestCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 2 },
  latestLabel: { fontSize: 14, color: '#666', marginBottom: 6 },
  latestValue: { fontSize: 40, fontWeight: '900', color: '#333' },
  latestUnit: { fontSize: 18, fontWeight: '500' },
  pulseText: { fontSize: 14, color: '#666', marginTop: 4 },
  statusText: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  recordTime: { fontSize: 12, color: '#999', marginTop: 4 },
  chartCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1565c0' },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#1565c0' },
  chartTitleSugar: { color: '#7b1fa2' },
  historyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#333' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  historyValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  historyType: { fontSize: 12, color: '#7b1fa2', fontWeight: '600' },
  historyTime: { fontSize: 12, color: '#888' },
  referenceCard: { backgroundColor: '#f3e5f5', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#7b1fa2' },
  referenceTitle: { fontSize: 14, fontWeight: '700', color: '#7b1fa2', marginBottom: 8 },
  referenceText: { fontSize: 13, color: '#333', marginBottom: 4 },
  referenceTextSmall: { fontSize: 11, color: '#666', marginTop: 6, fontStyle: 'italic' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1565c0', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 2, borderColor: '#1565c0', borderRadius: 12, padding: 14, fontSize: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 2, borderColor: '#7b1fa2' },
  typeButtonSelected: { backgroundColor: '#7b1fa2' },
  typeButtonText: { fontSize: 13, fontWeight: '600', color: '#7b1fa2' },
  typeButtonTextSelected: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelButton: { flex: 1, borderWidth: 2, borderColor: '#1565c0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#1565c0', fontSize: 16, fontWeight: '700' },
  saveButton: { flex: 1, backgroundColor: '#1565c0', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sugarSave: { backgroundColor: '#7b1fa2' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default BloodSugarScreen;
