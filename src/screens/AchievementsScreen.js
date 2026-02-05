import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAchievements, getUserLevel } from '../services/api.js';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: 'trophy' },
  { id: 'water', label: 'Nước', icon: 'water' },
  { id: 'exercise', label: 'Tập', icon: 'fitness' },
  { id: 'sleep', label: 'Ngủ', icon: 'moon' },
  { id: 'nutrition', label: 'Dinh dưỡng', icon: 'restaurant' },
  { id: 'goals', label: 'Mục tiêu', icon: 'flag' },
  { id: 'general', label: 'Chung', icon: 'apps' },
];

const CATEGORY_ICONS = {
  exercise: 'fitness',
  water: 'water',
  sleep: 'moon',
  nutrition: 'restaurant',
  goals: 'flag',
  general: 'apps',
  bmi: 'scale',
  medication: 'medical',
  social: 'people',
};

const AchievementsScreen = () => {
  const [achievements, setAchievements] = useState([]);
  const [userLevel, setUserLevel] = useState({ level: 1, points: 0 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [detailModal, setDetailModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [achievementsResult, levelResult] = await Promise.all([
        getAchievements(),
        getUserLevel(),
      ]);
      setAchievements(achievementsResult || []);
      setUserLevel(levelResult || { level: 1, points: 0 });
    } catch (error) {
      console.log('Error fetching achievements:', error);
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

  const isUnlocked = (achievement) => {
    return achievement.is_unlocked || achievement.progress >= 100;
  };

  const getProgress = (achievement) => {
    return achievement.progress || 0;
  };

  const getUnlockDate = (achievement) => {
    if (!achievement.unlocked_at) return null;
    return new Date(achievement.unlocked_at).toLocaleDateString('vi-VN');
  };

  const filteredAchievements = achievements.filter((a) =>
    selectedCategory === 'all' || a.category === selectedCategory
  );

  const unlockedCount = achievements.filter((a) => isUnlocked(a)).length;
  const totalCount = achievements.length;
  const totalPoints = userLevel.points || 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f57c00" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f57c00']} />}
      >
        <View style={styles.titleRow}>
          <Ionicons name="trophy" size={28} color="#f57c00" />
          <Text style={styles.title}>Thành tựu</Text>
        </View>
        <Text style={styles.subtitle}>Thu thập huy hiệu sức khỏe</Text>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedCount}/{totalCount}</Text>
            <Text style={styles.statLabel}>Đã mở khóa</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Điểm</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Math.round((unlockedCount / totalCount) * 100)}%</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryButton, selectedCategory === cat.id && styles.categoryButtonActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <View style={styles.categoryContent}>
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={selectedCategory === cat.id ? '#fff' : '#f57c00'}
                />
                <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Achievements Grid */}
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement) => {
            const unlocked = isUnlocked(achievement);
            const progress = getProgress(achievement);
            const progressPercent = Math.min((progress / (achievement.target_value || 1)) * 100, 100);
            const icon = CATEGORY_ICONS[achievement.category] || 'trophy';

            return (
              <TouchableOpacity
                key={achievement.id}
                style={[styles.achievementCard, unlocked && styles.achievementUnlocked]}
                onPress={() => setDetailModal(achievement)}
              >
                <Ionicons
                  name={icon}
                  size={34}
                  color={unlocked ? '#f57c00' : '#bbb'}
                  style={styles.achievementIcon}
                />
                <Text style={[styles.achievementTitle, !unlocked && styles.achievementTitleLocked]} numberOfLines={2}>
                  {achievement.name || achievement.title}
                </Text>
                <Text style={styles.achievementPoints}>+{achievement.points || 0} pts</Text>
                
                {!unlocked && progress > 0 && (
                  <View style={styles.progressBarSmall}>
                    <View style={[styles.progressFillSmall, { width: `${progressPercent}%` }]} />
                  </View>
                )}
                
                {unlocked && <Ionicons name="checkmark-circle" size={18} color="#43a047" style={styles.checkmark} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Detail Modal */}
        <Modal
          visible={!!detailModal}
          transparent
          animationType="fade"
          onRequestClose={() => setDetailModal(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {detailModal && (
                <>
                  <Ionicons
                    name={CATEGORY_ICONS[detailModal.category] || 'trophy'}
                    size={56}
                    color="#f57c00"
                    style={styles.modalIcon}
                  />
                  <Text style={styles.modalTitle}>{detailModal.name || detailModal.title}</Text>
                  <Text style={styles.modalDesc}>{detailModal.description || detailModal.desc}</Text>
                  
                  {isUnlocked(detailModal) ? (
                    <View style={styles.unlockedBadge}>
                      <View style={styles.unlockedRow}>
                        <Ionicons name="checkmark-done" size={18} color="#43a047" />
                        <Text style={styles.unlockedText}>Đã mở khóa</Text>
                      </View>
                      <Text style={styles.unlockedDate}>{getUnlockDate(detailModal)}</Text>
                    </View>
                  ) : (
                    <View style={styles.progressSection}>
                      <Text style={styles.progressLabel}>
                        Tiến độ: {getProgress(detailModal)}%
                      </Text>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${getProgress(detailModal)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.modalPointsRow}>
                    <Ionicons name="ribbon" size={18} color="#f57c00" />
                    <Text style={styles.modalPoints}>{detailModal.points} điểm</Text>
                  </View>
                  
                  <TouchableOpacity style={styles.closeButton} onPress={() => setDetailModal(null)}>
                    <Text style={styles.closeButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff8e1' },
  container: { padding: 16, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800', color: '#f57c00', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#444', marginBottom: 16 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f57c00',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '900', color: '#f57c00' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#ddd' },
  categoryScroll: { marginBottom: 16 },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#f57c00',
  },
  categoryButtonActive: { backgroundColor: '#f57c00' },
  categoryText: { fontSize: 13, fontWeight: '600', color: '#f57c00' },
  categoryTextActive: { color: '#fff' },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achievementCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    position: 'relative',
  },
  achievementUnlocked: { backgroundColor: '#fff', borderColor: '#f57c00' },
  achievementIcon: { fontSize: 36, marginBottom: 8 },
  achievementIconLocked: { opacity: 0.4 },
  achievementTitle: { fontSize: 14, fontWeight: '700', color: '#333', textAlign: 'center' },
  achievementTitleLocked: { color: '#999' },
  achievementPoints: { fontSize: 12, color: '#f57c00', fontWeight: '600', marginTop: 4 },
  progressBarSmall: { width: '80%', height: 4, backgroundColor: '#ddd', borderRadius: 2, marginTop: 6 },
  progressFillSmall: { height: '100%', backgroundColor: '#f57c00', borderRadius: 2 },
  checkmark: { position: 'absolute', top: 8, right: 8, fontSize: 16, color: '#43a047' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%', alignItems: 'center' },
  modalIcon: { fontSize: 60, marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 8 },
  modalDesc: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 16 },
  unlockedBadge: { backgroundColor: '#e8f5e9', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  unlockedText: { fontSize: 16, fontWeight: '700', color: '#43a047' },
  unlockedDate: { fontSize: 12, color: '#666', marginTop: 4 },
  progressSection: { width: '100%', marginBottom: 16 },
  progressLabel: { fontSize: 14, color: '#666', marginBottom: 8, textAlign: 'center' },
  progressBar: { height: 10, backgroundColor: '#eee', borderRadius: 5 },
  progressFill: { height: '100%', backgroundColor: '#f57c00', borderRadius: 5 },
  modalPoints: { fontSize: 18, fontWeight: '700', color: '#f57c00', marginBottom: 16 },
  closeButton: { backgroundColor: '#f57c00', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 10 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', marginTop: 12 },
});

export default AchievementsScreen;
