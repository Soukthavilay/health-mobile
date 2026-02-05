import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getReminders, createReminder, deleteReminder, markReminderDone } from '../services/api.js';
import AddMedicationModal from '../components/AddMedicationModal.js';

const REMINDER_TYPE_ICONS = {
  medication: 'medical',
  water: 'water',
  exercise: 'fitness',
};

const ScheduleScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [completedToday, setCompletedToday] = useState(new Set());

  const fetchReminders = async () => {
    try {
      const data = await getReminders();
      setReminders(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Lỗi', err?.response?.data?.message || err?.message || 'Không thể tải lịch nhắc');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReminders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleSaveReminder = async (reminder) => {
    try {
      const newReminder = await createReminder(reminder);
      setReminders((prev) => [newReminder, ...prev]);
    } catch (err) {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo lịch nhắc');
    }
  };

  const handleDeleteReminder = (id) => {
    Alert.alert('Xác nhận', 'Xóa lịch nhắc này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReminder(id);
            setReminders((prev) => prev.filter((r) => r.id !== id));
          } catch (err) {
            Alert.alert('Lỗi', err?.message || 'Không thể xóa');
          }
        },
      },
    ]);
  };

  const handleMarkDone = async (id) => {
    try {
      await markReminderDone(id);
      setCompletedToday((prev) => new Set([...prev, id]));
    } catch (err) {
      // Silently handle for now
    }
  };

  const formatDays = (daysStr) => {
    if (!daysStr) return 'Mỗi ngày';
    const days = daysStr.split(',');
    if (days.length === 7) return 'Mỗi ngày';
    const dayLabels = {
      mon: 'T2',
      tue: 'T3',
      wed: 'T4',
      thu: 'T5',
      fri: 'T6',
      sat: 'T7',
      sun: 'CN',
    };
    return days.map((d) => dayLabels[d] || d).join(', ');
  };

  const getTypeIcon = (type) => REMINDER_TYPE_ICONS[type] || 'calendar';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.titleRow}>
          <Ionicons name="calendar" size={28} color="#0b3d91" />
          <Text style={styles.title}>Đặt lịch</Text>
        </View>
        <Text style={styles.subtitle}>Lịch nhắc uống thuốc, uống nước, tập thể dục</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" style={styles.primaryButtonIcon} />
          <Text style={styles.primaryButtonText}>Tạo lịch nhắc</Text>
        </TouchableOpacity>

        {reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open" size={44} color="#0b3d91" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Chưa có lịch nhắc nào</Text>
            <Text style={styles.emptyHint}>Tạo lịch nhắc để nhận thông báo đúng giờ</Text>
          </View>
        ) : (
          reminders.map((r) => {
            const isCompleted = completedToday.has(r.id);
            return (
              <View key={r.id} style={[styles.card, isCompleted && styles.cardCompleted]}>
                <View style={styles.cardHeader}>
                  <Ionicons name={getTypeIcon(r.type)} size={24} color={isCompleted ? '#43a047' : '#0b3d91'} style={styles.cardIcon} />
                  <View style={styles.cardTitleContainer}>
                    <Text style={[styles.cardTitle, isCompleted && styles.cardTitleCompleted]}>
                      {r.title}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {String(r.time_of_day).slice(0, 5)} • {formatDays(r.days_of_week)}
                    </Text>
                  </View>
                </View>

                {!!r.message && <Text style={styles.cardMessage}>{r.message}</Text>}

                <View style={styles.cardActions}>
                  {!isCompleted && (
                    <TouchableOpacity
                      style={styles.doneButton}
                      onPress={() => handleMarkDone(r.id)}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.actionIcon} />
                      <Text style={styles.doneButtonText}>Đã xong</Text>
                    </TouchableOpacity>
                  )}
                  {isCompleted && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-done" size={16} color="#43a047" style={styles.actionIcon} />
                      <Text style={styles.completedBadgeText}>Hoàn thành</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteReminder(r.id)}
                  >
                    <Ionicons name="trash" size={16} color="#e53935" style={styles.actionIcon} />
                    <Text style={styles.deleteButtonText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Compliance Stats */}
        {reminders.length > 0 && (
          <View style={styles.statsCard}>
            <View style={styles.statsTitleRow}>
              <Ionicons name="stats-chart" size={18} color="#0b3d91" />
              <Text style={styles.statsTitle}>Thống kê hôm nay</Text>
            </View>
            <Text style={styles.statsValue}>
              {completedToday.size} / {reminders.length} hoàn thành
            </Text>
            <View style={styles.statsBar}>
              <View
                style={[
                  styles.statsBarFill,
                  { width: `${(completedToday.size / reminders.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <AddMedicationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveReminder}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0b3d91',
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#0b3d91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  primaryButtonIcon: {
    marginRight: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#0b3d91',
  },
  cardCompleted: {
    backgroundColor: '#e8f5e9',
    borderColor: '#43a047',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b3d91',
  },
  cardTitleCompleted: {
    color: '#43a047',
    textDecorationLine: 'line-through',
  },
  cardMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cardMessage: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  doneButton: {
    backgroundColor: '#43a047',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  completedBadge: {
    backgroundColor: '#e8f5e9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedBadgeText: {
    color: '#43a047',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    marginRight: 2,
  },
  deleteButtonText: {
    color: '#e53935',
    fontSize: 14,
    fontWeight: '700',
  },
  statsCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  statsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b3d91',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  statsBar: {
    height: 8,
    backgroundColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statsBarFill: {
    height: '100%',
    backgroundColor: '#43a047',
    borderRadius: 4,
  },
});

export default ScheduleScreen;
