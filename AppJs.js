/**
 * Chat Bot app
 * by MyS
 *
 * @format
 */

import React from 'react';

import {Provider} from 'react-native-paper';

import {NavigationContainer} from '@react-navigation/native';

import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {theme} from './src/core/theme.js';

import {
  StartScreen,
  LoginScreen,
  ChatTestScreen,
} from './src/screen_components';

const Stack = createNativeStackNavigator();

function AppJs() {
  var content = (
    <Provider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="StartScreen"
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen
            name="StartScreen"
            component={StartScreen}
            options={{
              title: 'Welcome',
            }}
          />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="ChatTestScreen" component={ChatTestScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );

  return content;
}

export default AppJs;
