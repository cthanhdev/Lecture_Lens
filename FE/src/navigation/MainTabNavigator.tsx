import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { LlBottomNavBar } from '../shared/components';
import { HomeScreen } from '../features/home/HomeScreen';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { ReviewScreen } from '../features/review/ReviewScreen';
import { SearchScreen } from '../features/search/SearchScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <LlBottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="LibraryTab" component={LibraryScreen} />
      <Tab.Screen name="ReviewTab" component={ReviewScreen} />
      <Tab.Screen name="SearchTab" component={SearchScreen} />
    </Tab.Navigator>
  );
}
