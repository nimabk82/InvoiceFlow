import { NavigationContainer } from '@react-navigation/native';

import { invoiceFlowNavigationTheme } from '../theme';

/**
 * Navigation root for future navigators and screens.
 *
 * Feature navigators are intentionally deferred to their own tickets.
 */
export function AppNavigation() {
  return (
    <NavigationContainer theme={invoiceFlowNavigationTheme}>
      {null}
    </NavigationContainer>
  );
}
