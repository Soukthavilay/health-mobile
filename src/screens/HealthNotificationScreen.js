import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerExpoPushToken } from '../services/api.js';
import { getProfile } from '../services/api.js';
import { setNotifOnboardingDone } from '../storage/onboardingStorage.js';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const HealthNotificationScreen = ({ navigation }) => {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const requestAndRegister = async (nextEnabled) => {
    if (!nextEnabled) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Chưa được cấp quyền', 'Bạn có thể bật lại quyền thông báo trong Cài đặt (Settings).');
      return;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

    let expoPushToken;
    try {
      const tokenResponse = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      expoPushToken = tokenResponse.data;
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes('projectId')) {
        Alert.alert(
          'Thiếu projectId',
          'Expo Notifications cần projectId để tạo Expo Push Token.\n\nCách sửa (khuyến nghị):\n- Tạo project EAS và lấy Project ID\n- Sau đó thêm vào app.json: expo.extra.eas.projectId\n\nTạm thời app sẽ bỏ qua bước đăng ký push.'
        );
        return;
      }
      throw err;
    }

    await registerExpoPushToken({ expo_push_token: expoPushToken, enabled: true });
  };

  const handleNext = async () => {
    try {
      setLoading(true);

      if (enabled) {
        await requestAndRegister(true);
      }

      const profile = await getProfile();
      if (profile?.user_id) {
        await setNotifOnboardingDone(profile.user_id, true);
      }

      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể đăng ký thông báo');
      try {
        const profile = await getProfile();
        if (profile?.user_id) {
          await setNotifOnboardingDone(profile.user_id, true);
        }
      } catch {
        // ignore
      }
      navigation.replace('MainTabs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // default enabled=true, but we don't request until user presses Next
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Health Notifications</Text>
        <Text style={styles.subtitle}>Bật để nhận nhắc nhở uống thuốc, uống nước và tập thể dục đúng giờ</Text>

        <View style={styles.row}>
          <Text style={styles.rowText}>Cho phép thông báo</Text>
          <Switch value={enabled} onValueChange={setEnabled} />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Đang xử lý...' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#0b3d91',
    borderRadius: 12,
    marginBottom: 24,
  },
  rowText: {
    fontSize: 18,
    fontWeight: '600',
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
    fontWeight: '700',
  },
});

export default HealthNotificationScreen;
