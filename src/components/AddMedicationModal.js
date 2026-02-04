import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'T2' },
  { id: 'tue', label: 'T3' },
  { id: 'wed', label: 'T4' },
  { id: 'thu', label: 'T5' },
  { id: 'fri', label: 'T6' },
  { id: 'sat', label: 'T7' },
  { id: 'sun', label: 'CN' },
];

const REMINDER_TYPES = [
  { id: 'medication', label: '💊 Uống thuốc' },
  { id: 'water', label: '💧 Uống nước' },
  { id: 'exercise', label: '🏃 Tập thể dục' },
];

const AddMedicationModal = ({ visible, onClose, onSave }) => {
  const [type, setType] = useState('medication');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [selectedDays, setSelectedDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

  const resetForm = () => {
    setType('medication');
    setTitle('');
    setMessage('');
    setHour(8);
    setMinute(0);
    setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  };

  const toggleDay = (dayId) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên lịch nhắc');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ngày');
      return;
    }

    const reminder = {
      type,
      title: title.trim(),
      message: message.trim(),
      time_of_day: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
      days_of_week: selectedDays.join(','),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh',
      enabled: true,
    };

    onSave(reminder);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Tạo lịch nhắc mới</Text>

            {/* Reminder Type */}
            <Text style={styles.label}>Loại nhắc nhở</Text>
            <View style={styles.typeRow}>
              {REMINDER_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeButton, type === t.id && styles.typeButtonSelected]}
                  onPress={() => setType(t.id)}
                >
                  <Text style={[styles.typeText, type === t.id && styles.typeTextSelected]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.label}>Tên {type === 'medication' ? '(tên thuốc)' : ''}</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={type === 'medication' ? 'VD: Vitamin C' : 'VD: Uống 2 ly nước'}
              placeholderTextColor="#999"
            />

            {/* Message (optional) */}
            <Text style={styles.label}>Ghi chú (tùy chọn)</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="VD: 1 viên sau ăn"
              placeholderTextColor="#999"
              multiline
            />

            {/* Time Selector */}
            <Text style={styles.label}>Giờ nhắc</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setHour((h) => (h > 0 ? h - 1 : 23))}
              >
                <Text style={styles.timeBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{String(hour).padStart(2, '0')}</Text>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setHour((h) => (h < 23 ? h + 1 : 0))}
              >
                <Text style={styles.timeBtnText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.timeColon}>:</Text>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setMinute((m) => (m >= 15 ? m - 15 : 45))}
              >
                <Text style={styles.timeBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.timeValue}>{String(minute).padStart(2, '0')}</Text>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setMinute((m) => (m < 45 ? m + 15 : 0))}
              >
                <Text style={styles.timeBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Days of Week */}
            <Text style={styles.label}>Các ngày trong tuần</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayButton, selectedDays.includes(day.id) && styles.dayButtonSelected]}
                  onPress={() => toggleDay(day.id)}
                >
                  <Text
                    style={[styles.dayText, selectedDays.includes(day.id) && styles.dayTextSelected]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0b3d91',
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0b3d91',
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#0b3d91',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0b3d91',
  },
  typeTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 2,
    borderColor: '#0b3d91',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  messageInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0b3d91',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginHorizontal: 10,
    minWidth: 45,
    textAlign: 'center',
  },
  timeColon: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginHorizontal: 6,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0b3d91',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#0b3d91',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0b3d91',
  },
  dayTextSelected: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#0b3d91',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#0b3d91',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0b3d91',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddMedicationModal;
