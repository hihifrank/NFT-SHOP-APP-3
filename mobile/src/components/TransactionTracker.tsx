import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {Card, Text, ProgressBar, Button, Chip} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppDispatch, useAppSelector} from '@store/index';
import {updateTransactionStatus, removeTransaction} from '@store/slices/web3Slice';
import {theme} from '@theme/index';

interface TransactionTrackerProps {
  visible: boolean;
  onDismiss: () => void;
}

const TransactionTracker: React.FC<TransactionTrackerProps> = ({visible, onDismiss}) => {
  const dispatch = useAppDispatch();
  const {transactions} = useAppSelector(state => state.web3);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);

  const pendingTransactions = transactions.filter(tx => tx.status === 'pending');

  useEffect(() => {
    if (pendingTransactions.length > 0 && !trackingInterval) {
      const interval = setInterval(() => {
        pendingTransactions.forEach(tx => {
          dispatch(updateTransactionStatus(tx.hash));
        });
      }, 5000); // Check every 5 seconds

      setTrackingInterval(interval);
    } else if (pendingTransactions.length === 0 && trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }

    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [pendingTransactions.length, trackingInterval, dispatch]);

  const getTransactionIcon = (type: string, status: string) => {
    if (status === 'pending') return 'hourglass-empty';
    if (status === 'failed') return 'error';
    
    switch (type) {
      case 'purchase': return 'shopping-cart';
      case 'use': return 'redeem';
      case 'transfer': return 'send';
      default: return 'check-circle';
    }
  };

  const getTransactionColor = (status: string) => {
    switch (status) {
      case 'confirmed': return theme.colors.cryptoGreen;
      case 'pending': return theme.colors.secondary;
      case 'failed': return theme.colors.error;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '已確認';
      case 'pending': return '待確認';
      case 'failed': return '失敗';
      default: return '未知';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'purchase': return '購買NFT';
      case 'use': return '使用優惠券';
      case 'transfer': return '轉移NFT';
      default: return '交易';
    }
  };

  const handleRemoveTransaction = (hash: string) => {
    dispatch(removeTransaction(hash));
  };

  if (!visible || transactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.title}>交易狀態</Text>
            <Button mode="text" onPress={onDismiss} compact>
              關閉
            </Button>
          </View>
          
          {transactions.slice(0, 3).map((tx) => (
            <View key={tx.hash} style={styles.transactionItem}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionInfo}>
                  <Icon 
                    name={getTransactionIcon(tx.type, tx.status)} 
                    size={20} 
                    color={getTransactionColor(tx.status)} 
                  />
                  <Text variant="bodyMedium" style={styles.transactionType}>
                    {getTypeText(tx.type)}
                  </Text>
                </View>
                <Chip 
                  mode="flat"
                  style={[styles.statusChip, {backgroundColor: getTransactionColor(tx.status)}]}
                  textStyle={styles.statusText}
                >
                  {getStatusText(tx.status)}
                </Chip>
              </View>
              
              <Text variant="bodySmall" style={styles.transactionHash}>
                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
              </Text>
              
              {tx.status === 'pending' && (
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={0.5} 
                    color={theme.colors.secondary}
                    style={styles.progressBar}
                  />
                  <Text variant="bodySmall" style={styles.progressText}>
                    等待區塊鏈確認...
                  </Text>
                </View>
              )}
              
              {tx.status === 'confirmed' && (
                <View style={styles.actionContainer}>
                  <Text variant="bodySmall" style={styles.confirmationText}>
                    確認數: {tx.confirmations}
                  </Text>
                  <Button 
                    mode="text" 
                    compact 
                    onPress={() => handleRemoveTransaction(tx.hash)}
                  >
                    移除
                  </Button>
                </View>
              )}
              
              {tx.status === 'failed' && (
                <View style={styles.actionContainer}>
                  <Text variant="bodySmall" style={styles.errorText}>
                    交易失敗，請重試
                  </Text>
                  <Button 
                    mode="text" 
                    compact 
                    onPress={() => handleRemoveTransaction(tx.hash)}
                  >
                    移除
                  </Button>
                </View>
              )}
            </View>
          ))}
          
          {transactions.length > 3 && (
            <Text variant="bodySmall" style={styles.moreText}>
              還有 {transactions.length - 3} 個交易...
            </Text>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 1000,
  },
  card: {
    backgroundColor: theme.colors.surface,
    elevation: theme.custom.elevation.high,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontWeight: '600',
  },
  transactionItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionType: {
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  statusChip: {
    minWidth: 60,
  },
  statusText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  transactionHash: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
  progressContainer: {
    marginTop: theme.spacing.xs,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  confirmationText: {
    color: theme.colors.cryptoGreen,
  },
  errorText: {
    color: theme.colors.error,
  },
  moreText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
});

export default TransactionTracker;