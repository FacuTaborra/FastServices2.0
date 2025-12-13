// FastServices/apps/mobile/src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Pantallas a importar
import SplashScreen from '../screens/Splash/SplashScreen';
import HomePage from '../screens/HomePage/HomePage';
import Login from '../screens/Login/Login';
import Register from '../screens/Register/Register';
import ProviderLicensesScreen from '../screens/ProviderLicenses/ProviderLicensesScreen';
import RequestDetailScreen from '../screens/RequestDetail/RequestDetailScreen';
import ProviderRequestsScreen from '../screens/ProviderRequests/ProviderRequestsScreen';
import ProviderRequestDetailScreen from '../screens/ProviderRequests/ProviderRequestDetailScreen';
import CreateProposalScreen from '../screens/CreateProposal/CreateProposalScreen';
import ProviderProfileScreen from '../screens/ProviderProfile/ProviderProfileScreen';
import MyRequestsScreen from '../screens/MyRequests/MyRequestsScreen';
import Footer from '../components/ClientFooter/ClientFooter';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import PaymentScreen from '../screens/Payment/PaymentScreen';
import PaymentHistoryScreen from '../screens/PaymentHistory/PaymentHistoryScreen';
import HelpSupportScreen from '../screens/HelpSupport/HelpSupportScreen';
import StatsScreen from '../screens/Stats/StatsScreen';
import MyServicesScreen from '../screens/MyServicesProvider/MyServicesScreen';
import ProviderFooter from '../components/ProviderFooter/ProviderFooter';
import FastMatchScreen from '../screens/FastMatch/FastMatchScreen';
import LicitacionScreen from '../screens/Licitacion/LicitacionScreen';
import ServiceDetailScreen from '../screens/ServiceDetail/ServiceDetailScreen';
import ProviderServiceDetailScreen from '../screens/MyServicesProvider/ServiceDetail/ProviderServiceDetailScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditions/TermsAndConditionsScreen';
import ForgotPasswordScreen from '../screens/ForgotPassword/ForgotPasswordScreen';
import RehireRequestScreen from '../screens/RehireRequest/RehireRequestScreen';
import RehireDetailScreen from '../screens/RehireDetail/RehireDetailScreen';
import WarrantyClaimScreen from '../screens/WarrantyClaim/WarrantyClaimScreen';
import { useNotifications } from '../hooks/useNotifications';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function ProviderTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <ProviderFooter {...props} />}>
      <Tab.Screen
        name="ProviderRequests"
        component={ProviderRequestsScreen}
        options={{ headerShown: false, tabBarBadge: 2 }}
      />
      <Tab.Screen name="Statistics" component={StatsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="ProviderProfile" component={ProviderProfileScreen} options={{ headerShown: false }} />
      <Tab.Screen name="MyServicesScreen" component={MyServicesScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}


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


function NotificationHandler() {
  useNotifications();
  return null;
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <NotificationHandler />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          headerTitleAlign: 'center',
          animation: 'slide_from_right',
        }}
      >

        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Login" component={Login} options={({ route }) => ({
          animation: route?.params?.animation ?? 'slide_from_right',
        })} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Register" component={Register} options={({ route }) => ({
          animation: route?.params?.animation ?? 'slide_from_right',
        })} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
        <Stack.Screen
          name="ProviderLicensesSetup"
          component={ProviderLicensesScreen}
          options={({ route }) => ({
            animation: route?.params?.animation ?? 'slide_from_right',
          })}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={({ route }) => ({
            animation: route?.params?.animation ?? 'slide_from_right',
          })}
        />
        <Stack.Screen
          name="ProviderMain"
          component={ProviderTabs}
          options={({ route }) => ({
            animation: route?.params?.animation ?? 'slide_from_right',
          })}
        />
        <Stack.Screen name="MyRequests" component={MainTabs} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen
          name="CreateProposal"
          component={CreateProposalScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="ProviderRequestDetail"
          component={ProviderRequestDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen
          name="FastMatch"
          component={FastMatchScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Licitacion"
          component={LicitacionScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
        <Stack.Screen name="ProviderServiceDetail" component={ProviderServiceDetailScreen} />
        <Stack.Screen
          name="RehireRequest"
          component={RehireRequestScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="RehireDetail"
          component={RehireDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="WarrantyClaim"
          component={WarrantyClaimScreen}
          options={{ animation: 'slide_from_right' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}