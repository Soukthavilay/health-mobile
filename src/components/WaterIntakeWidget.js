import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const WaterIntakeWidget = ({ currentMl = 0, goalMl = 2000, onPress }) => {
  const progress = Math.min((currentMl / goalMl) * 100, 100);
  const remaining = Math.max(goalMl - currentMl, 0);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.icon}>💧</Text>
        <Text style={styles.title}>Nước</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.value}>
        {currentMl} <Text style={styles.unit}>/ {goalMl}ml</Text>
      </Text>

      <Text style={styles.remaining}>
        {remaining > 0 ? `Còn ${remaining}ml` : '✅ Hoàn thành!'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e3f2fd',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0b3d91',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b3d91',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4da6ff',
    borderRadius: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b3d91',
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  remaining: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
});

export default WaterIntakeWidget;
