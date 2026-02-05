import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
      tabBarActiveTintColor: '#0b3d91',
      tabBarInactiveTintColor: '#888',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8 },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="SummaryTab"
      component={SummaryScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'home' : 'home-outline'} size={28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="WaterTab"
      component={WaterIntakeScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'water' : 'water-outline'} size={28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="ExerciseTab"
      component={ExerciseScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'fitness' : 'fitness-outline'} size={28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="SleepTab"
      component={SleepScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'moon' : 'moon-outline'} size={28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="ScheduleTab"
      component={ScheduleScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={28} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="SettingsTab"
      component={SettingsScreen}
      options={{
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? 'settings' : 'settings-outline'} size={28} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export default MainTabs;
