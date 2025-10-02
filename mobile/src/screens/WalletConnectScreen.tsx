import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {Text, Button, Card, ActivityIndicator} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppTranslation} from '@utils/i18n';
import {useAppDispatch, useAppSelector} from '@store/index';
import {connectWallet} from '@store/slices/authSlice';
import {connectMetaMask, connectWalletConnect, loadStoredConnection, clearError} from '@store/slices/web3Slice';
import {theme} from '@theme/index';

const WalletConnectScreen: React.FC = () => {
  const {t} = useAppTranslation();
  const dispatch = useAppDispatch();
  const {loading} = useAppSelector(state => state.auth);
  const {loading: web3Loading, error: web3Error, isConnected} = useAppSelector(state => state.web3);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: '最受歡迎的以太坊錢包',
      icon: 'account-balance-wallet',
      color: theme.colors.primary,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: '連接多種移動錢包',
      icon: 'link',
      color: theme.colors.secondary,
    },
  ];

  useEffect(() => {
    // Try to load stored wallet connection on component mount
    dispatch(loadStoredConnection());
  }, [dispatch]);

  useEffect(() => {
    // Clear any previous errors when component mounts
    if (web3Error) {
      dispatch(clearError());
    }
  }, [dispatch, web3Error]);

  const handleWalletConnect = async (walletType: string) => {
    setSelectedWallet(walletType);
    
    try {
      let result;
      
      if (walletType === 'metamask') {
        result = await dispatch(connectMetaMask()).unwrap();
      } else if (walletType === 'walletconnect') {
        result = await dispatch(connectWalletConnect()).unwrap();
      }
      
      if (result) {
        // Also update the auth state for backward compatibility
        await dispatch(connectWallet(result.address)).unwrap();
        
        Alert.alert(
          '連接成功',
          `已成功連接到 ${walletType === 'metamask' ? 'MetaMask' : 'WalletConnect'}`,
          [{text: '確定', onPress: () => {}}]
        );
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      Alert.alert(
        '連接失敗',
        error instanceof Error ? error.message : '錢包連接失敗，請重試',
        [{text: '確定', onPress: () => {}}]
      );
    } finally {
      setSelectedWallet(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('auth.connectWallet')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            選擇您的錢包來開始使用NFT優惠券平台
          </Text>
        </View>

        <View style={styles.walletOptions}>
          {walletOptions.map((wallet) => (
            <Card
              key={wallet.id}
              style={[
                styles.walletCard,
                selectedWallet === wallet.id && styles.selectedWalletCard,
              ]}
              onPress={() => handleWalletConnect(wallet.id)}
              disabled={web3Loading || loading}
            >
              <Card.Content style={styles.walletCardContent}>
                <View style={[styles.walletIcon, {backgroundColor: wallet.color}]}>
                  <Icon name={wallet.icon} size={32} color={theme.colors.onPrimary} />
                </View>
                <View style={styles.walletInfo}>
                  <Text variant="titleMedium" style={styles.walletName}>
                    {wallet.name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.walletDescription}>
                    {wallet.description}
                  </Text>
                </View>
                {selectedWallet === wallet.id && (web3Loading || loading) && (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                )}
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.disclaimer}>
            連接錢包即表示您同意我們的服務條款和隱私政策
          </Text>
        </View>
      </View>

      {(loading || web3Loading) && (
        <View style={styles.loadingOverlay}>
          <Card style={styles.loadingCard}>
            <Card.Content style={styles.loadingContent}>
              <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loadingSpinner} />
              <Text variant="bodyMedium" style={styles.loadingText}>
                {selectedWallet ? `正在連接 ${selectedWallet === 'metamask' ? 'MetaMask' : 'WalletConnect'}...` : t('auth.connectingWallet')}
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}

      {web3Error && (
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <Card.Content style={styles.errorContent}>
              <Icon name="error" size={24} color={theme.colors.error} />
              <Text variant="bodyMedium" style={styles.errorText}>
                {web3Error}
              </Text>
              <Button 
                mode="outlined" 
                onPress={() => dispatch(clearError())}
                style={styles.errorButton}
              >
                關閉
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    textAlign: 'center',
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: theme.spacing.md,
  },
  walletOptions: {
    marginBottom: theme.spacing.xl,
  },
  walletCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: theme.custom.elevation.small,
  },
  selectedWalletCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  walletCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  walletDescription: {
    color: theme.colors.onSurfaceVariant,
  },
  walletIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.custom.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  footer: {
    alignItems: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    paddingHorizontal: theme.spacing.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingSpinner: {
    marginBottom: theme.spacing.md,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.onSurface,
  },
  errorContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  errorCard: {
    backgroundColor: theme.colors.errorContainer,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.onErrorContainer,
  },
  errorButton: {
    marginLeft: theme.spacing.sm,
  },
});

export default WalletConnectScreen;