import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { upsertProfile } from '../services/api.js';
import { getCurrentUserId } from '../storage/authStorage.js';
import { getNotifOnboardingDone } from '../storage/onboardingStorage.js';
import { getProfile } from '../services/api.js';

const ProfileSetupScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [birthdate, setBirthdate] = useState(''); // YYYY-MM-DD
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    try {
      if (!fullName) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên');
        return;
      }

      setLoading(true);
      await upsertProfile({
        full_name: fullName,
        age: age ? Number(age) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        birthdate: birthdate || null,
      });

      const profile = await getProfile();
      const userId = profile?.user_id || (await getCurrentUserId());
      const notifDone = await getNotifOnboardingDone(userId);
      navigation.replace(notifDone ? 'MainTabs' : 'HealthNotification');
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể lưu thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Thông tin cơ bản</Text>
        <Text style={styles.subtitle}>Nhập thông tin để hệ thống gợi ý sức khỏe chính xác hơn</Text>

        <Text style={styles.label}>Tên</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Koh"
          placeholderTextColor="#888"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Tuổi</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: 25"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
        />

        <Text style={styles.label}>Chiều cao (cm)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: 170"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={heightCm}
          onChangeText={setHeightCm}
        />

        <Text style={styles.label}>Cân nặng (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: 65"
          placeholderTextColor="#888"
          keyboardType="numeric"
          value={weightKg}
          onChangeText={setWeightKg}
        />

        <Text style={styles.label}>Sinh nhật (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: 2001-01-01"
          placeholderTextColor="#888"
          value={birthdate}
          onChangeText={setBirthdate}
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleNext} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang lưu...' : 'Next'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0b3d91',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#222',
    marginBottom: 18,
    textAlign: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#0b3d91',
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 8,
    color: '#000',
  },
  button: {
    width: '100%',
    backgroundColor: '#0b3d91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});

export default ProfileSetupScreen;
