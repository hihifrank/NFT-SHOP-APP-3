import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {Provider} from 'react-redux';
import {PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import {store} from '@store/index';
import {theme} from '@theme/index';
import AppNavigator from '@navigation/AppNavigator';
import {I18nProvider} from '@utils/i18n';
import Web3Service from '@services/Web3Service';
import NotificationManager from '@services/NotificationManager';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize Web3 service
    Web3Service.initializeWeb3().catch(console.error);
    
    // Initialize Notification Manager
    NotificationManager.getInstance().initialize().catch(console.error);
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Provider store={store}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <I18nProvider>
              <NavigationContainer>
                <StatusBar
                  barStyle="dark-content"
                  backgroundColor={theme.colors.surface}
                />
                <AppNavigator />
              </NavigationContainer>
            </I18nProvider>
          </SafeAreaProvider>
        </PaperProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;