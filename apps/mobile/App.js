import React from 'react';
import AppNavigator from './src/navigation';
import QueryProvider from './src/providers/QueryProvider';

export default function App() {
  return (
    <QueryProvider>
      <AppNavigator />
    </QueryProvider>
  );
}