import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { getWeeklyReport, getMonthlyReport } from '../services/api.js';

const ReportsScreen = () => {
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1);
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

      const [weeklyResult, monthlyResult] = await Promise.all([
        getWeeklyReport(weekStartStr),
        getMonthlyReport(monthStr),
      ]);

      // Transform weekly data
      const weekly = {
        period: `${formatDate(weekStart)} - ${formatDate(today)}`,
        summary: {
          water: {
            avg: Math.round(weeklyResult.water?.avg_ml || 0),
            goal: 2000,
            compliance: Math.round(weeklyResult.water?.compliance_percent || 0),
          },
          exercise: {
            totalMin: weeklyResult.exercise?.total_minutes || 0,
            sessions: weeklyResult.exercise?.total_sessions || 0,
            streak: weeklyResult.exercise?.current_streak || 0,
          },
          sleep: {
            avg: parseFloat((weeklyResult.sleep?.avg_hours || 0).toFixed(1)),
            quality: getSleepQuality(weeklyResult.sleep?.avg_hours),
          },
          bmi: { current: 22.5, change: 0 },
        },
        waterTrend: weeklyResult.water?.daily_data?.map((d) => d.total_ml) || null,
        exerciseTrend: weeklyResult.exercise?.daily_data?.map((d) => d.total_minutes) || null,
        sleepTrend: weeklyResult.sleep?.daily_data?.map((d) => d.duration_hours) || null,
        insights: weeklyResult.insights || [],
      };

      // Transform monthly data
      const monthly = {
        period: `Tháng ${today.getMonth() + 1}/${today.getFullYear()}`,
        summary: {
          water: {
            avg: Math.round(monthlyResult.water?.avg_ml || 0),
            goal: 2000,
            compliance: Math.round(monthlyResult.water?.compliance_percent || 0),
          },
          exercise: {
            totalMin: monthlyResult.exercise?.total_minutes || 0,
            sessions: monthlyResult.exercise?.total_sessions || 0,
            streak: monthlyResult.exercise?.longest_streak || 0,
          },
          sleep: {
            avg: parseFloat((monthlyResult.sleep?.avg_hours || 0).toFixed(1)),
            quality: getSleepQuality(monthlyResult.sleep?.avg_hours),
          },
          bmi: { current: 22.5, change: 0 },
        },
        insights: monthlyResult.insights || [],
        monthOverMonth: monthlyResult.month_over_month || {},
      };

      setWeeklyData(weekly);
      setMonthlyData(monthly);
    } catch (error) {
      console.log('Error fetching reports:', error);
      // Set default data on error
      setWeeklyData({ period: 'Tuần này', summary: { water: { avg: 0, goal: 2000, compliance: 0 }, exercise: { totalMin: 0, sessions: 0, streak: 0 }, sleep: { avg: 0, quality: '--' }, bmi: { current: 0, change: 0 } }, insights: [] });
      setMonthlyData({ period: 'Tháng này', summary: { water: { avg: 0, goal: 2000, compliance: 0 }, exercise: { totalMin: 0, sessions: 0, streak: 0 }, sleep: { avg: 0, quality: '--' }, bmi: { current: 0, change: 0 } }, insights: [], monthOverMonth: {} });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (date) => {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getSleepQuality = (hours) => {
    if (!hours) return '--';
    if (hours >= 7.5) return 'Tốt';
    if (hours >= 6.5) return 'Khá';
    if (hours >= 5) return 'Trung bình';
    return 'Kém';
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

  const data = activeTab === 'weekly' ? weeklyData : monthlyData;

  const chartWidth = Dimensions.get('window').width - 64;

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'tip': return 'bulb';
      default: return 'document-text';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976d2']} />}
      >
        <View style={styles.titleRow}>
          <Ionicons name="bar-chart" size={28} color="#1976d2" />
          <Text style={styles.title}>Báo cáo</Text>
        </View>
        <Text style={styles.subtitle}>Phân tích xu hướng sức khỏe</Text>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
              Tuần
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'monthly' && styles.tabActive]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[styles.tabText, activeTab === 'monthly' && styles.tabTextActive]}>
              Tháng
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.period}>{data.period}</Text>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Ionicons name="water" size={22} color="#4da6ff" style={styles.summaryIcon} />
            <Text style={styles.summaryValue}>{data.summary.water.avg}ml</Text>
            <Text style={styles.summaryLabel}>TB nước/ngày</Text>
            <Text style={styles.summaryMeta}>{data.summary.water.compliance}% đạt mục tiêu</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="fitness" size={22} color="#2e7d32" style={styles.summaryIcon} />
            <Text style={styles.summaryValue}>{data.summary.exercise.sessions}</Text>
            <Text style={styles.summaryLabel}>buổi tập</Text>
            <Text style={styles.summaryMeta}>{data.summary.exercise.totalMin} phút</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="moon" size={22} color="#673ab7" style={styles.summaryIcon} />
            <Text style={styles.summaryValue}>{data.summary.sleep.avg}h</Text>
            <Text style={styles.summaryLabel}>TB giấc ngủ</Text>
            <Text style={styles.summaryMeta}>{data.summary.sleep.quality}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Ionicons name="scale" size={22} color="#666" style={styles.summaryIcon} />
            <Text style={styles.summaryValue}>{data.summary.bmi.current}</Text>
            <Text style={styles.summaryLabel}>BMI hiện tại</Text>
            <Text style={[styles.summaryMeta, { color: data.summary.bmi.change < 0 ? '#43a047' : '#e53935' }]}
            >
              {data.summary.bmi.change > 0 ? '+' : ''}{data.summary.bmi.change}
            </Text>
          </View>
        </View>

        {/* Weekly Charts */}
        {activeTab === 'weekly' && weeklyData?.waterTrend && (
          <View style={styles.chartCard}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="water" size={18} color="#4da6ff" />
              <Text style={styles.chartTitle}>Xu hướng uống nước</Text>
            </View>
            <BarChart
              data={{
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                datasets: [{ data: weeklyData.waterTrend }],
              }}
              width={chartWidth}
              height={140}
              yAxisSuffix="ml"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(77, 166, 255, ${opacity})`,
                labelColor: () => '#666',
                barPercentage: 0.5,
              }}
              style={{ marginTop: 8, borderRadius: 8 }}
            />
          </View>
        )}

        {activeTab === 'weekly' && weeklyData?.exerciseTrend && (
          <View style={styles.chartCard}>
            <View style={styles.chartTitleRow}>
              <Ionicons name="fitness" size={18} color="#2e7d32" />
              <Text style={styles.chartTitle}>Thời gian tập luyện</Text>
            </View>
            <BarChart
              data={{
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                datasets: [{ data: weeklyData.exerciseTrend }],
              }}
              width={chartWidth}
              height={140}
              yAxisSuffix="m"
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                labelColor: () => '#666',
                barPercentage: 0.5,
              }}
              style={{ marginTop: 8, borderRadius: 8 }}
            />
          </View>
        )}

        {/* Insights */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsTitleRow}>
            <Ionicons name="bulb" size={18} color="#f57f17" />
            <Text style={styles.insightsTitle}>Phân tích & Gợi ý</Text>
          </View>
          {data.insights.map((insight, index) => (
            <View key={index} style={styles.insightRow}>
              <Ionicons name={getInsightIcon(insight.type)} size={16} color="#f57f17" style={styles.insightIcon} />
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}
        </View>

        {/* Comparison (Monthly only) */}
        {activeTab === 'monthly' && (
          <View style={styles.comparisonCard}>
            <View style={styles.comparisonTitleRow}>
              <Ionicons name="stats-chart" size={18} color="#1976d2" />
              <Text style={styles.comparisonTitle}>So sánh với tháng trước</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Nước uống</Text>
              <Text style={[styles.comparisonValue, { color: '#43a047' }]}>+5%</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Thời gian tập</Text>
              <Text style={[styles.comparisonValue, { color: '#43a047' }]}>+20%</Text>
            </View>
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonLabel}>Giấc ngủ</Text>
              <Text style={[styles.comparisonValue, { color: '#e53935' }]}>-3%</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 16,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1976d2',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1976d2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  period: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  summaryMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  insightsCard: {
    backgroundColor: '#fff9c4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f9a825',
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f57f17',
    marginBottom: 12,
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  comparisonCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1976d2',
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#333',
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default ReportsScreen;
