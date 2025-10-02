import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {Card, Text, Button, Chip, Modal, Portal} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppDispatch, useAppSelector} from '@store/index';
import {
  connectMetaMask,
  connectWalletConnect,
  disconnectWallet,
  fetchBalance,
  clearError,
} from '@store/slices/web3Slice';
import {theme} from '@theme/index';

interface WalletStatusCardProps {
  showFullDetails?: boolean;
  onConnectPress?: () => void;
}

const WalletStatusCard: React.FC<WalletStatusCardProps> = ({
  showFullDetails = true,
  onConnectPress,
}) => {
  const dispatch = useAppDispatch();
  const {
    isConnected,
    walletAddress,
    balance,
    chainId,
    connectionType,
    loading,
    error,
  } = useAppSelector(state => state.web3);
  
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const handleConnectWallet = () => {
    if (onConnectPress) {
      onConnectPress();
    } else {
      setWalletModalVisible(true);
    }
  };

  const handleWalletSelection = async (walletType: 'metamask' | 'walletconnect') => {
    setWalletModalVisible(false);
    
    try {
      if (walletType === 'metamask') {
        await dispatch(connectMetaMask()).unwrap();
      } else {
        await dispatch(connectWalletConnect()).unwrap();
      }
      
      Alert.alert(
        '連接成功',
        `已成功連接到 ${walletType === 'metamask' ? 'MetaMask' : 'WalletConnect'}`,
      );
    } catch (error) {
      Alert.alert(
        '連接失敗',
        error instanceof Error ? error.message : '錢包連接失敗，請重試',
      );
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      '斷開錢包',
      '確定要斷開錢包連接嗎？',
      [
        {text: '取消', style: 'cancel'},
        {
          text: '確定',
          onPress: async () => {
            try {
              await dispatch(disconnectWallet()).unwrap();
              Alert.alert('已斷開', '錢包已成功斷開連接');
            } catch (error) {
              Alert.alert('錯誤', '斷開連接失敗');
            }
          },
        },
      ]
    );
  };

  const handleRefreshBalance = async () => {
    if (walletAddress) {
      try {
        await dispatch(fetchBalance(walletAddress)).unwrap();
      } catch (error) {
        Alert.alert('錯誤', '刷新餘額失敗');
      }
    }
  };

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 80001:
        return 'Polygon Mumbai';
      case 137:
        return 'Polygon Mainnet';
      case 1:
        return 'Ethereum Mainnet';
      default:
        return '未知網絡';
    }
  };

  const getWalletIcon = (type: string | null) => {
    switch (type) {
      case 'metamask':
        return 'account-balance-wallet';
      case 'walletconnect':
        return 'link';
      default:
        return 'account-balance-wallet';
    }
  };

  return (
    <>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon 
                name={getWalletIcon(connectionType)} 
                size={24} 
                color={isConnected ? theme.colors.primary : theme.colors.onSurfaceVariant} 
              />
              <Text variant="titleMedium" style={styles.title}>
                錢包狀態
              </Text>
            </View>
            
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                {backgroundColor: isConnected ? theme.colors.cryptoGreen : theme.colors.error}
              ]} />
              <Text variant="bodySmall" style={styles.statusText}>
                {isConnected ? '已連接' : '未連接'}
              </Text>
            </View>
          </View>

          {isConnected ? (
            <View style={styles.connectedContent}>
              {/* Wallet Info */}
              <View style={styles.walletInfo}>
                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    錢包類型:
                  </Text>
                  <Chip 
                    mode="flat" 
                    style={styles.walletTypeChip}
                    textStyle={styles.walletTypeText}
                  >
                    {connectionType === 'metamask' ? 'MetaMask' : 'WalletConnect'}
                  </Chip>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    地址:
                  </Text>
                  <TouchableOpacity onPress={() => setDetailsVisible(true)}>
                    <Text variant="bodySmall" style={styles.addressText}>
                      {walletAddress ? 
                        `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 
                        '載入中...'
                      }
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodySmall" style={styles.infoLabel}>
                    餘額:
                  </Text>
                  <View style={styles.balanceContainer}>
                    <Text variant="bodySmall" style={styles.balanceText}>
                      {balance ? `${balance} MATIC` : '載入中...'}
                    </Text>
                    <TouchableOpacity onPress={handleRefreshBalance}>
                      <Icon name="refresh" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {showFullDetails && (
                  <View style={styles.infoRow}>
                    <Text variant="bodySmall" style={styles.infoLabel}>
                      網絡:
                    </Text>
                    <Text variant="bodySmall" style={styles.networkText}>
                      {getNetworkName(chainId)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {showFullDetails && (
                  <Button 
                    mode="outlined" 
                    compact 
                    style={styles.actionButton}
                    onPress={() => setDetailsVisible(true)}
                  >
                    <Icon name="info" size={14} />
                    <Text style={styles.actionButtonText}> 詳情</Text>
                  </Button>
                )}
                
                <Button 
                  mode="text" 
                  compact 
                  style={styles.actionButton}
                  onPress={handleDisconnect}
                >
                  <Icon name="logout" size={14} />
                  <Text style={styles.actionButtonText}> 斷開</Text>
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.disconnectedContent}>
              <Icon 
                name="account-balance-wallet" 
                size={48} 
                color={theme.colors.onSurfaceVariant} 
              />
              <Text variant="bodyMedium" style={styles.disconnectedText}>
                連接錢包以開始使用NFT功能
              </Text>
              <Button 
                mode="contained" 
                style={styles.connectButton}
                onPress={handleConnectWallet}
                loading={loading}
                disabled={loading}
              >
                {loading ? '連接中...' : '連接錢包'}
              </Button>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error" size={16} color={theme.colors.error} />
              <Text variant="bodySmall" style={styles.errorText}>
                {error}
              </Text>
              <Button 
                mode="text" 
                compact 
                onPress={() => dispatch(clearError())}
              >
                關閉
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Wallet Selection Modal */}
      <Portal>
        <Modal
          visible={walletModalVisible}
          onDismiss={() => setWalletModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>
                選擇錢包
              </Text>
              
              <TouchableOpacity 
                style={styles.walletOption}
                onPress={() => handleWalletSelection('metamask')}
              >
                <Icon name="account-balance-wallet" size={32} color={theme.colors.primary} />
                <View style={styles.walletOptionText}>
                  <Text variant="titleMedium">MetaMask</Text>
                  <Text variant="bodySmall" style={styles.walletOptionDescription}>
                    最受歡迎的以太坊錢包
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.walletOption}
                onPress={() => handleWalletSelection('walletconnect')}
              >
                <Icon name="link" size={32} color={theme.colors.secondary} />
                <View style={styles.walletOptionText}>
                  <Text variant="titleMedium">WalletConnect</Text>
                  <Text variant="bodySmall" style={styles.walletOptionDescription}>
                    連接多種移動錢包
                  </Text>
                </View>
              </TouchableOpacity>

              <Button 
                mode="outlined" 
                onPress={() => setWalletModalVisible(false)}
                style={styles.cancelButton}
              >
                取消
              </Button>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Wallet Details Modal */}
      <Portal>
        <Modal
          visible={detailsVisible}
          onDismiss={() => setDetailsVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.detailsHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>
                  錢包詳情
                </Text>
                <TouchableOpacity onPress={() => setDetailsVisible(false)}>
                  <Icon name="close" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailsContent}>
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    完整地址:
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    {walletAddress}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    網絡ID:
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    {chainId}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    網絡名稱:
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    {getNetworkName(chainId)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    錢包類型:
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    {connectionType === 'metamask' ? 'MetaMask' : 'WalletConnect'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    elevation: theme.custom.elevation.small,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    color: theme.colors.onSurfaceVariant,
  },
  connectedContent: {
    gap: theme.spacing.md,
  },
  walletInfo: {
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  walletTypeChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  walletTypeText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 10,
  },
  addressText: {
    fontFamily: 'monospace',
    color: theme.colors.primary,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  balanceText: {
    fontWeight: '600',
  },
  networkText: {
    color: theme.colors.onSurface,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 12,
  },
  disconnectedContent: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  disconnectedText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  connectButton: {
    minWidth: 150,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorContainer,
    padding: theme.spacing.sm,
    borderRadius: theme.custom.borderRadius.small,
    marginTop: theme.spacing.md,
  },
  errorText: {
    flex: 1,
    marginLeft: theme.spacing.xs,
    color: theme.colors.onErrorContainer,
  },
  modalContainer: {
    margin: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.custom.borderRadius.medium,
    backgroundColor: theme.colors.surfaceVariant,
    marginBottom: theme.spacing.md,
  },
  walletOptionText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  walletOptionDescription: {
    color: theme.colors.onSurfaceVariant,
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  detailsContent: {
    gap: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  detailValue: {
    flex: 2,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
});

export default WalletStatusCard;