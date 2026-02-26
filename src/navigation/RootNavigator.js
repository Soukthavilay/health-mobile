import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen.js';
import RegisterScreen from '../screens/RegisterScreen.js';
import ProfileSetupScreen from '../screens/ProfileSetupScreen.js';
import HealthNotificationScreen from '../screens/HealthNotificationScreen.js';
import GoalsScreen from '../screens/GoalsScreen.js';
import ReportsScreen from '../screens/ReportsScreen.js';
import VitalsScreen from '../screens/VitalsScreen.js';
import NutritionScreen from '../screens/NutritionScreen.js';
import AIChatScreen from '../screens/AIChatScreen.js';
import SymptomCheckerScreen from '../screens/SymptomCheckerScreen.js';
import PeriodTrackerScreen from '../screens/PeriodTrackerScreen.js';
import BloodSugarScreen from '../screens/BloodSugarScreen.js';
import AchievementsScreen from '../screens/AchievementsScreen.js';
import DashboardScreen from '../screens/DashboardScreen.js';
import MainTabs from './MainTabs.js';
import { loadToken } from '../storage/authStorage.js';
import { getProfile } from '../services/api.js';
import { getNotifOnboardingDone } from '../storage/onboardingStorage.js';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const [checking, setChecking] = React.useState(true);
  const [initialRoute, setInitialRoute] = React.useState('Login');

  React.useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (!token) {
          setInitialRoute('Login');
          return;
        }

        const profile = await getProfile();
        if (!profile) {
          setInitialRoute('ProfileSetup');
          return;
        }

        const notifDone = await getNotifOnboardingDone(profile.user_id);
        setInitialRoute(notifDone ? 'MainTabs' : 'HealthNotification');
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#0b3d91" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng ký' }} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ title: 'Thông tin cơ bản' }} />
        <Stack.Screen name="HealthNotification" component={HealthNotificationScreen} options={{ title: 'Thông báo' }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Goals" component={GoalsScreen} options={{ title: 'Mục tiêu' }} />
        <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Báo cáo' }} />
        <Stack.Screen name="Vitals" component={VitalsScreen} options={{ title: 'Chỉ số sinh tồn' }} />
        <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ title: 'Dinh dưỡng' }} />
        <Stack.Screen name="AIChat" component={AIChatScreen} options={{ title: 'AI Chat' }} />
        <Stack.Screen name="SymptomChecker" component={SymptomCheckerScreen} options={{ title: 'Kiểm tra triệu chứng' }} />
        <Stack.Screen name="PeriodTracker" component={PeriodTrackerScreen} options={{ title: 'Kinh nguyệt' }} />
        <Stack.Screen name="BloodSugar" component={BloodSugarScreen} options={{ title: 'Huyết áp & Đường' }} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ title: 'Thành tựu' }} />
        <Stack.Screen name="DashboardScreen" component={DashboardScreen} options={{ title: 'Chỉ số BMI' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;


