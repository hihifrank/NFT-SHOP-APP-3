import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {useAppSelector} from '@store/index';
import {theme} from '@theme/index';

// Import screens
import {
  HomeScreen,
  ExploreScreen,
  NFTScreen,
  ProfileScreen,
  WalletConnectScreen,
} from '../screens';
import StoreLocatorScreen from '../screens/StoreLocatorScreen';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  WalletConnect: undefined;
  MerchantDetail: {merchantId: string};
  CouponDetail: {couponId: string};
  LotteryDetail: {lotteryId: string};
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Stores: undefined;
  NFT: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Explore':
              iconName = 'explore';
              break;
            case 'Stores':
              iconName = 'location-on';
              break;
            case 'NFT':
              iconName = 'account-balance-wallet';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: '首頁',
        }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen}
        options={{
          tabBarLabel: '探索',
        }}
      />
      <Tab.Screen 
        name="Stores" 
        component={StoreLocatorScreen}
        options={{
          tabBarLabel: '店鋪',
        }}
      />
      <Tab.Screen 
        name="NFT" 
        component={NFTScreen}
        options={{
          tabBarLabel: 'NFT交易',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: '個人',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      {isAuthenticated ? (
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator}
          options={{headerShown: false}}
        />
      ) : (
        <Stack.Screen 
          name="WalletConnect" 
          component={WalletConnectScreen}
          options={{
            title: '連接錢包',
            headerShown: false,
          }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;