import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { getHealthStats, saveHealthStat } from '../services/api.js';
import { LineChart } from 'react-native-chart-kit';
import { loadToken } from '../storage/authStorage.js';

const DashboardScreen = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [stats, setStats] = useState([]);
  const [bmi, setBmi] = useState(null);

  const fetchStats = async () => {
    const data = await getHealthStats();
    setStats(data);
    if (data?.length) setBmi(data[0].bmi);
  };

  const handleSubmit = async () => {
    await saveHealthStat({ height: Number(height), weight: Number(weight) });
    setHeight('');
    setWeight('');
    fetchStats();
  };

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (!token) return;
      fetchStats();
    })();
  }, []);

  const recentPairs = stats.slice(0, 5).reduce(
    (acc, s) => {
      const value = Number(s?.bmi);
      if (!Number.isFinite(value)) return acc;
      acc.labels.push(new Date(s.recorded_at).toLocaleDateString());
      acc.values.push(value);
      return acc;
    },
    { labels: [], values: [] }
  );

  const chartData = {
    labels: recentPairs.labels,
    datasets: [
      {
        data: recentPairs.values,
        color: () => '#0b3d91',
        strokeWidth: 3,
      },
    ],
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Chỉ số sức khỏe</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Chiều cao (cm)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
          placeholder="Ví dụ: 170"
          placeholderTextColor="#666"
        />
        <Text style={styles.label}>Cân nặng (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          placeholder="Ví dụ: 65"
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Lưu & tính BMI</Text>
        </TouchableOpacity>
        {bmi && <Text style={styles.bmiText}>BMI hiện tại: {bmi}</Text>}
      </View>

      {recentPairs.values.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Xu hướng BMI</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 48}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              color: () => '#0b3d91',
              labelColor: () => '#000',
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#0b3d91' },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 12 }}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f7f9fc',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0b3d91',
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderColor: '#0b3d91',
    borderWidth: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    marginBottom: 12,
    backgroundColor: '#fff',
    color: '#000',
  },
  button: {
    backgroundColor: '#0b3d91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  bmiText: {
    marginTop: 12,
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0b3d91',
    marginBottom: 8,
  },
});

export default DashboardScreen;
