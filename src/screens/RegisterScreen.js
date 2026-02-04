import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { API_BASE_URL, register } from '../services/api.js';
import { saveToken, saveUser } from '../storage/authStorage.js';
import { getProfile } from '../services/api.js';
import { getNotifOnboardingDone } from '../storage/onboardingStorage.js';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      if (!username || !email || !password) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ username, email và mật khẩu');
        return;
      }

      setLoading(true);
      const result = await register({ username, email, password });
      await saveToken(result.token);
      await saveUser(result.user);

      const profile = await getProfile();
      if (!profile) {
        navigation.replace('ProfileSetup');
        return;
      }

      const notifDone = await getNotifOnboardingDone(result.user?.id);
      navigation.replace(notifDone ? 'MainTabs' : 'HealthNotification');
    } catch (err) {
      const serverMessage = err?.response?.data?.message;
      const networkMessage = err?.message;

      Alert.alert(
        'Đăng ký thất bại',
        serverMessage || networkMessage || `Không thể kết nối tới server (${API_BASE_URL})`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tạo tài khoản</Text>
      <Text style={styles.subtitle}>Bắt đầu theo dõi sức khỏe của bạn</Text>

      <TextInput
        style={styles.input}
        placeholder="Tên đăng nhập"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0b3d91',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#0b3d91',
    borderRadius: 10,
    fontSize: 18,
    marginBottom: 16,
    color: '#000',
  },
  button: {
    width: '100%',
    backgroundColor: '#0b3d91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 18,
    color: '#0b3d91',
    fontWeight: '600',
  },
});

export default RegisterScreen;
