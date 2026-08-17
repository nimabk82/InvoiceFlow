import { StatusBar } from 'react-native';

import { MobileAppProviders } from './src/app/MobileAppProviders';
import { AppNavigation } from './src/navigation/AppNavigation';

function App() {
  return (
    <MobileAppProviders>
      <StatusBar barStyle="dark-content" />
      <AppNavigation />
    </MobileAppProviders>
  );
}

export default App;
