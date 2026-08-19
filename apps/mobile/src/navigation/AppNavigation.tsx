import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { invoiceFlowNavigationTheme } from '../theme';

export type AuthStackParamList = {
  'Sign In': undefined;
  'Sign Up': undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AppNavigation() {
  return (
    <NavigationContainer theme={invoiceFlowNavigationTheme}>
      <Stack.Navigator initialRouteName="Sign In">
        <Stack.Screen name="Sign In" component={SignInScreen} />
        <Stack.Screen name="Sign Up" component={SignUpScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
