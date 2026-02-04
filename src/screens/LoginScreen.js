import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { login } from '../services/api.js';
import { saveToken, saveUser } from '../storage/authStorage.js';
import { getProfile } from '../services/api.js';
import { getNotifOnboardingDone } from '../storage/onboardingStorage.js';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await login({ username, password });
      await saveToken(result.token);
      await saveUser(result.user);

      const profile = await getProfile();
      if (!profile) {
        navigation.replace('ProfileSetup');
        return;
      }

      const notifDone = await getNotifOnboardingDone(profile.user_id || result.user?.id);
      navigation.replace(notifDone ? 'MainTabs' : 'HealthNotification');
    } catch (err) {
      Alert.alert('Đăng nhập thất bại', err?.response?.data?.message || 'Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Health Assistant</Text>
      <Text style={styles.subtitle}>Đăng nhập để theo dõi sức khỏe</Text>

      <TextInput
        style={styles.input}
        placeholder="Tên đăng nhập"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Register')} disabled={loading}>
        <Text style={styles.linkText}>Chưa có tài khoản? Tạo tài khoản</Text>
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

export default LoginScreen;
