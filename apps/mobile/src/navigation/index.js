// FastServices/apps/mobile/src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Pantallas a importar
import HomePage from '../screens/HomePage/HomePage';
import Login from '../screens/Login/Login';
import Register from '../screens/Register/Register'
import RequestDetailScreen from '../screens/RequestDetail/RequestDetailScreen';
import RequestsScreen from '../screens/Requests/RequestsScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import MyRequestsScreen from '../screens/MyRequests/MyRequestsScreen';
import Footer from '../components/Footer/Footer';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import HelpSupportScreen from '../screens/HelpSupport/HelpSupportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <Footer {...props} />}>
      <Tab.Screen name="HomePage" component={HomePage} options={{ headerShown: false }} />
      <Tab.Screen name="MyRequests" component={MyRequestsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}


export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, headerTitleAlign: 'center', animation: 'slide_from_right'}}>
        
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={({ route }) => ({
            animation: route?.params?.animation ?? 'slide_from_right',
          })}
        />
        <Stack.Screen name="MyRequests" component={MainTabs} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen
          name="Requests"
          component={RequestsScreen}
          options={({ route }) => ({
            animation: route?.params?.animation ?? 'slide_from_right',
          })}
        />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}