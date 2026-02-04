import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getBodyParts, checkSymptoms } from '../services/api.js';

const SymptomCheckerScreen = () => {
  const [step, setStep] = useState(1); // 1: select parts, 2: select symptoms, 3: results
  const [bodyParts, setBodyParts] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadBodyParts = async () => {
        try {
          const data = await getBodyParts();
          if (data && Array.isArray(data) && data.length > 0) {
            // Transform API data to component format
            const transformed = data.map((bp) => ({
              id: bp.id,
              name: bp.name,
              label: `${bp.icon || '🏥'} ${bp.name}`,
              symptoms: (bp.symptoms || []).map((s) => ({
                id: s.id,
                name: s.name,
                label: s.name,
              })),
            }));
            setBodyParts(transformed);
          } else {
            // Fallback to default body parts
            setBodyParts([
              { id: 'head', name: 'Đầu', label: '🧠 Đầu', symptoms: [{ id: 1, name: 'Đau đầu', label: 'Đau đầu' }] },
              { id: 'chest', name: 'Ngực', label: '💗 Ngực', symptoms: [{ id: 2, name: 'Đau ngực', label: 'Đau ngực' }] },
              { id: 'stomach', name: 'Bụng', label: '🫃 Bụng', symptoms: [{ id: 3, name: 'Đau bụng', label: 'Đau bụng' }] },
              { id: 'general', name: 'Toàn thân', label: '🌡️ Toàn thân', symptoms: [{ id: 4, name: 'Sốt', label: 'Sốt' }] },
            ]);
          }
        } catch (error) {
          console.log('Error loading body parts:', error);
        } finally {
          setLoading(false);
        }
      };
      loadBodyParts();
    }, [])
  );

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) => {
      const exists = prev.find((s) => s.id === symptom.id);
      if (exists) {
        return prev.filter((s) => s.id !== symptom.id);
      }
      return [...prev, symptom];
    });
  };

  const handleNext = async () => {
    if (step === 2 && selectedSymptoms.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 triệu chứng');
      return;
    }
    if (step === 2) {
      setChecking(true);
      try {
        const symptomNames = selectedSymptoms.map((s) => s.name || s.label);
        const apiResult = await checkSymptoms({
          symptoms: symptomNames,
          duration_days: 1,
          severity: 'moderate',
        });
        
        // Transform API result
        const transformedResult = {
          severity: apiResult.severity || 'low',
          color: apiResult.severity === 'high' ? '#e53935' : apiResult.severity === 'medium' ? '#fb8c00' : '#43a047',
          title: apiResult.title || '📝 Kết quả phân tích',
          message: apiResult.advice || apiResult.message || 'Triệu chứng của bạn đã được ghi nhận.',
          actions: apiResult.recommendations || apiResult.actions || ['Nghỉ ngơi', 'Theo dõi triệu chứng', 'Đi khám nếu tồi tệ hơn'],
          conditions: apiResult.conditions || [],
          disclaimer: apiResult.disclaimer || 'Đây chỉ là gợi ý tham khảo, không thay thế chẩn đoán của bác sĩ.',
        };
        
        setResult(transformedResult);
        setStep(3);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể phân tích. Vui lòng thử lại.');
      } finally {
        setChecking(false);
      }
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedPart(null);
    setSelectedSymptoms([]);
    setResult(null);
  };

  const handleSelectPart = (part) => {
    setSelectedPart(part);
    setStep(2);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1565c0" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🩺 Kiểm tra triệu chứng</Text>
        <Text style={styles.subtitle}>Mô tả triệu chứng để nhận gợi ý</Text>

        {/* Progress */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={styles.progressLine} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          <View style={styles.progressLine} />
          <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
        </View>

        {/* Step 1: Body Parts */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Bước 1: Chọn vùng cơ thể</Text>
            <View style={styles.partsGrid}>
              {bodyParts.map((part) => (
                <TouchableOpacity
                  key={part.id}
                  style={styles.partButton}
                  onPress={() => handleSelectPart(part)}
                >
                  <Text style={styles.partText}>{part.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Step 2: Symptoms */}
        {step === 2 && selectedPart && (
          <>
            <Text style={styles.stepTitle}>Bước 2: Chọn triệu chứng ({selectedPart.label})</Text>
            
            <View style={styles.symptomsGrid}>
              {(selectedPart.symptoms || []).map((symptom) => {
                const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);
                return (
                  <TouchableOpacity
                    key={symptom.id}
                    style={[styles.symptomButton, isSelected && styles.symptomButtonSelected]}
                    onPress={() => toggleSymptom(symptom)}
                  >
                    <Text style={[styles.symptomText, isSelected && styles.symptomTextSelected]}>
                      {symptom.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.addMoreButton} onPress={() => setStep(1)}>
              <Text style={styles.addMoreText}>+ Thêm vùng khác</Text>
            </TouchableOpacity>

            {selectedSymptoms.length > 0 && (
              <View style={styles.selectedList}>
                <Text style={styles.selectedTitle}>Đã chọn ({selectedSymptoms.length}):</Text>
                <Text style={styles.selectedSymptoms}>
                  {selectedSymptoms.map((s) => s.label).join(', ')}
                </Text>
              </View>
            )}

            <TouchableOpacity style={[styles.primaryButton, checking && styles.buttonDisabled]} onPress={handleNext} disabled={checking}>
              <Text style={styles.primaryButtonText}>{checking ? 'Đang phân tích...' : 'Xem kết quả'}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step 3: Results */}
        {step === 3 && result && (
          <>
            <Text style={styles.stepTitle}>Kết quả đánh giá</Text>
            
            <View style={[styles.resultCard, { borderColor: result.color }]}>
              <Text style={[styles.resultTitle, { color: result.color }]}>{result.title}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
              
              <Text style={styles.actionsTitle}>📋 Khuyến nghị:</Text>
              {result.actions.map((action, index) => (
                <Text key={index} style={styles.actionItem}>• {action}</Text>
              ))}
            </View>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                ⚠️ Lưu ý: Đây chỉ là gợi ý tham khảo, không thay thế chẩn đoán của bác sĩ. 
                Nếu triệu chứng nặng hoặc kéo dài, hãy đến cơ sở y tế.
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleReset}>
              <Text style={styles.primaryButtonText}>Kiểm tra lại</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#e3f2fd',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1565c0',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#bbb',
  },
  progressDotActive: {
    backgroundColor: '#1565c0',
  },
  progressLine: {
    width: 40,
    height: 3,
    backgroundColor: '#ccc',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1565c0',
    marginBottom: 16,
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  partButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1565c0',
  },
  partText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1565c0',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1565c0',
    backgroundColor: '#fff',
  },
  symptomButtonSelected: {
    backgroundColor: '#1565c0',
  },
  symptomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565c0',
  },
  symptomTextSelected: {
    color: '#fff',
  },
  addMoreButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  addMoreText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedList: {
    marginTop: 16,
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 10,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565c0',
    marginBottom: 4,
  },
  selectedSymptoms: {
    fontSize: 14,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#1565c0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  resultMessage: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  actionItem: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
    lineHeight: 22,
  },
  disclaimer: {
    backgroundColor: '#fff9c4',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
  buttonDisabled: { opacity: 0.6 },
});

export default SymptomCheckerScreen;
