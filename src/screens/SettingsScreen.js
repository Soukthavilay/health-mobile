import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { clearToken, clearUser } from '../storage/authStorage.js';

const SettingsScreen = ({ navigation }) => {
  const handleLogout = async () => {
    Alert.alert('Xác nhận', 'Bạn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await clearToken();
          await clearUser();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const menuSections = [
    {
      title: 'Theo dõi sức khỏe',
      icon: 'stats-chart',
      items: [
        { icon: 'flag', label: 'Mục tiêu', screen: 'Goals', desc: 'Đặt và theo dõi mục tiêu' },
        { icon: 'bar-chart', label: 'Báo cáo', screen: 'Reports', desc: 'Phân tích tuần/tháng' },
        { icon: 'heart', label: 'Chỉ số sinh tồn', screen: 'Vitals', desc: 'Nhịp tim, cân nặng' },
        { icon: 'restaurant', label: 'Dinh dưỡng', screen: 'Nutrition', desc: 'Theo dõi calo' },
        { icon: 'medkit', label: 'Huyết áp & Đường', screen: 'BloodSugar', desc: 'Ghi nhận chỉ số' },
      ],
    },
    {
      title: 'Công cụ',
      icon: 'sparkles',
      items: [
        { icon: 'chatbubble', label: 'AI Chat', screen: 'AIChat', desc: 'Trợ lý sức khỏe' },
        { icon: 'search', label: 'Kiểm tra triệu chứng', screen: 'SymptomChecker', desc: 'Đánh giá nhanh' },
      ],
    },
    {
      title: 'Dành riêng cho nữ',
      icon: 'female',
      items: [
        { icon: 'flower', label: 'Kinh nguyệt', screen: 'PeriodTracker', desc: 'Theo dõi chu kỳ' },
      ],
    },
    {
      title: 'Gamification',
      icon: 'trophy',
      items: [
        { icon: 'trophy', label: 'Thành tựu', screen: 'Achievements', desc: 'Huy hiệu & điểm' },
      ],
    },
    {
      title: 'Tài khoản',
      icon: 'person',
      items: [
        { icon: 'person', label: 'Hồ sơ', screen: 'ProfileSetup', desc: 'Chỉnh sửa thông tin' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.titleRow}>
          <Ionicons name="settings" size={28} color="#333" />
          <Text style={styles.title}>Cài đặt</Text>
        </View>
        <Text style={styles.subtitle}>Quản lý tài khoản và tính năng</Text>

        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name={section.icon} size={16} color="#666" />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.menuSection}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, index === section.items.length - 1 && styles.menuItemLast]}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <Ionicons name={item.icon} size={20} color="#333" style={styles.menuIcon} />
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Thông tin ứng dụng</Text>
          <Text style={styles.infoText}>Smart Health Assistant v2.0</Text>
          <Text style={styles.infoText}>15 tính năng • Mock data</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutRow}>
            <Ionicons name="log-out" size={18} color="#e53935" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { padding: 16, flexGrow: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#333' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginLeft: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#666' },
  menuSection: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { marginRight: 12 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#333' },
  menuDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  infoSection: { backgroundColor: '#e3f2fd', borderRadius: 14, padding: 16, marginBottom: 16, marginTop: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1976d2', marginBottom: 8 },
  infoText: { fontSize: 13, color: '#555', marginBottom: 4 },
  logoutButton: { backgroundColor: '#ffebee', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e53935' },
  logoutRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#e53935' },
});

export default SettingsScreen;
