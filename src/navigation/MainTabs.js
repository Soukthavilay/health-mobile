import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SummaryScreen from '../screens/SummaryScreen.js';
import ScheduleScreen from '../screens/ScheduleScreen.js';
import ExerciseScreen from '../screens/ExerciseScreen.js';
import WaterIntakeScreen from '../screens/WaterIntakeScreen.js';
import SleepScreen from '../screens/SleepScreen.js';
import SettingsScreen from '../screens/SettingsScreen.js';

const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8 },
    }}
  >
    <Tab.Screen name="SummaryTab" component={SummaryScreen} options={{ title: '🏠' }} />
    <Tab.Screen name="WaterTab" component={WaterIntakeScreen} options={{ title: '💧' }} />
    <Tab.Screen name="ExerciseTab" component={ExerciseScreen} options={{ title: '🏃' }} />
    <Tab.Screen name="SleepTab" component={SleepScreen} options={{ title: '😴' }} />
    <Tab.Screen name="ScheduleTab" component={ScheduleScreen} options={{ title: '📅' }} />
    <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ title: '⚙️' }} />
  </Tab.Navigator>
);

export default MainTabs;
