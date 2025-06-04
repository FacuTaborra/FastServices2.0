// FastServices/apps/mobile/src/navigation/index.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Pantallas a importar
import HomePage from '../screens/HomePage/HomePage';
import Login from '../screens/Login/Login';
import Register from '../screens/Register/Register'
import RequestDetailScreen from '../screens/RequestDetail/RequestDetailScreen';
import RequestsScreen from '../screens/Requests/RequestsScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import MyRequestsScreen from '../screens/MyRequests/MyRequestsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, headerTitleAlign: 'center', animation: 'slide_from_right'}}>
        
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
        <Stack.Screen name="Requests" component={RequestsScreen} />
        <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />  
              
      </Stack.Navigator>
    </NavigationContainer>
  );
}