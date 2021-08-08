/**
 * If you are not familiar with React Navigation, check out the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';
import {ColorSchemeName, KeyboardAvoidingView, Platform} from 'react-native';
import tailwind from 'tailwind-rn';

import * as API from '../api';
import NotFoundScreen from '../screens/NotFoundScreen';
import ChatScreen from '../screens/ChatScreen';
import {RootStackParamList} from '../types';
import LinkingConfiguration from './LinkingConfiguration';
import ConversationsScreen from '../screens/ConversationsScreen';
import LoginScreen from '../screens/LoginScreen';
import {useAuth} from '../components/AuthProvider';
import SocketProvider, {SocketContext} from '../components/SocketProvider';
import {ConversationsProvider} from '../components/ConversationsProvider';

export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tailwind('h-full')}
    >
      <NavigationContainer
        linking={LinkingConfiguration}
        theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <RootNavigator />
      </NavigationContainer>
    </KeyboardAvoidingView>
  );
}

// A root stack navigator is often used for displaying modals on top of all other content
// Read more here: https://reactnavigation.org/docs/modal
const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  const auth = useAuth();

  // React.useEffect(() => {
  //   auth.logout();
  // }, []);

  if (!auth.isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />

        <Stack.Screen
          name="NotFound"
          component={NotFoundScreen}
          options={{title: 'Oops!'}}
        />
      </Stack.Navigator>
    );
  }

  return (
    <SocketProvider refresh={auth.refresh}>
      <SocketContext.Consumer>
        {({socket}) => {
          return (
            <ConversationsProvider socket={socket}>
              <Stack.Navigator screenOptions={{headerShown: false}}>
                <Stack.Screen
                  name="Conversations"
                  component={ConversationsScreen}
                />
                <Stack.Screen name="Chat" component={ChatScreen} />

                <Stack.Screen
                  name="NotFound"
                  component={NotFoundScreen}
                  options={{title: 'Oops!'}}
                />
              </Stack.Navigator>
            </ConversationsProvider>
          );
        }}
      </SocketContext.Consumer>
    </SocketProvider>
  );
}
