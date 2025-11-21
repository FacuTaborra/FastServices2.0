import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation';
import QueryProvider from './src/providers/QueryProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AppNavigator />
      </QueryProvider>
    </GestureHandlerRootView>
  );
}