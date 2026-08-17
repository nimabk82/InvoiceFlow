import type { PropsWithChildren } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { invoiceFlowPaperTheme } from '../theme';

export function MobileAppProviders({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={invoiceFlowPaperTheme}>
        {children}
      </PaperProvider>
    </SafeAreaProvider>
  );
}
