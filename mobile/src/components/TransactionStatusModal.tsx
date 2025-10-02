import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Linking} from 'react-native';
import {Modal, Portal, Card, Text, Button, ProgressBar, Chip} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppDispatch, useAppSelector} from '@store/index';
import {updateTransactionStatus, removeTransaction} from '@store/slices/web3Slice';
import {theme} from '@theme/index';

interface TransactionStatusModalProps {
  visible: boolean;
  onDismiss: () => void;
  transactionHash?: string;
}

const TransactionStatusModal: React.FC<TransactionStatusModalProps> = ({
  visible,
  onDismiss,
  transactionHash,
}) => {
  const dispatch = useAppDispatch();
  const {transactions} = useAppSelector(state => state.web3);
  const [currentTx, setCurrentTx] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (transactionHash) {
      const tx = transactions.find(t => t.hash === transactionHash);
      setCurrentTx(tx);
    } else if (transactions.length > 0) {
      setCurrentTx(transactions[0]);
    }
  }, [transactionHash, transactions]);

  useEffect(() => {
    if (currentTx?.status === 'pending') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 0.9) return 0.9;
          return prev + 0.1;
        });
        
        // Update transaction status
        dispatch(updateTransactionStatus(currentTx.hash));
      }, 2000);

      return () => clearInterval(interval);
    } else if (currentTx?.status === 'confirmed') {
      setProgress(1);
    } else if (currentTx?.status === 'failed') {
      setProgress(0);
    }
  }, [currentTx?.status, currentTx?.hash, dispatch]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'hourglass-empty';
      case 'confirmed':
        return 'check-circle';
      case 'failed':
        return 'error';
      default:
        return 'help';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.secondary;
      case 'confirmed':
        return theme.colors.cryptoGreen;
      case 'failed':
        return theme.colors.error;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '交易處理中';
      case 'confirmed':
        return '交易已確認';
      case 'failed':
        return '交易失敗';
      default:
        return '未知狀態';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'purchase':
        return '購買NFT';
      case 'use':
        return '使用優惠券';
      case 'transfer':
        return '轉移NFT';
      default:
        return '交易';
    }
  };

  const getEstimatedTime = (status: string) => {
    switch (status) {
      case 'pending':
        return '預計 30-60 秒';
      case 'confirmed':
        return '已完成';
      case 'failed':
        return '已失敗';
      default:
        return '未知';
    }
  };

  const openBlockExplorer = () => {
    if (currentTx?.hash) {
      const url = `https://mumbai.polygonscan.com/tx/${currentTx.hash}`;
      Linking.openURL(url);
    }
  };

  const handleRetry = () => {
    // In a real implementation, you would retry the transaction
    console.log('Retrying transaction...');
    onDismiss();
  };

  const handleRemove = () => {
    if (currentTx?.hash) {
      dispatch(removeTransaction(currentTx.hash));
    }
    onDismiss();
  };

  if (!currentTx) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Icon 
                  name={getStatusIcon(currentTx.status)} 
                  size={32} 
                  color={getStatusColor(currentTx.status)} 
                />
                <View style={styles.headerText}>
                  <Text variant="titleMedium" style={styles.title}>
                    {getTypeText(currentTx.type)}
                  </Text>
                  <Text variant="bodySmall" style={styles.subtitle}>
                    {getStatusText(currentTx.status)}
                  </Text>
                </View>
              </View>
              <Chip 
                mode="flat"
                style={[styles.statusChip, {backgroundColor: getStatusColor(currentTx.status)}]}
                textStyle={styles.statusChipText}
              >
                {currentTx.status.toUpperCase()}
              </Chip>
            </View>

            {/* Progress Bar */}
            {currentTx.status === 'pending' && (
              <View style={styles.progressSection}>
                <ProgressBar 
                  progress={progress} 
                  color={theme.colors.secondary}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={styles.progressText}>
                  處理中... {Math.round(progress * 100)}%
                </Text>
              </View>
            )}

            {/* Transaction Details */}
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  交易哈希:
                </Text>
                <Text variant="bodySmall" style={styles.detailValue}>
                  {currentTx.hash.slice(0, 10)}...{currentTx.hash.slice(-8)}
                </Text>
              </View>

              {currentTx.tokenId && (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    Token ID:
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    #{currentTx.tokenId}
                  </Text>
                </View>
              )}

              {currentTx.amount && (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    金額:
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    {currentTx.amount} MATIC
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  預計時間:
                </Text>
                <Text variant="bodySmall" style={styles.detailValue}>
                  {getEstimatedTime(currentTx.status)}
                </Text>
              </View>

              {currentTx.status === 'confirmed' && (
                <View style={styles.detailRow}>
                  <Text variant="bodySmall" style={styles.detailLabel}>
                    確認數:
                  </Text>
                  <Text variant="bodySmall" style={styles.detailValue}>
                    {currentTx.confirmations || 12}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  時間:
                </Text>
                <Text variant="bodySmall" style={styles.detailValue}>
                  {new Date(currentTx.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Status Messages */}
            <View style={styles.messageSection}>
              {currentTx.status === 'pending' && (
                <View style={styles.messageContainer}>
                  <Icon name="info" size={16} color={theme.colors.secondary} />
                  <Text variant="bodySmall" style={styles.messageText}>
                    您的交易正在區塊鏈上處理，請耐心等待確認。
                  </Text>
                </View>
              )}

              {currentTx.status === 'confirmed' && (
                <View style={styles.messageContainer}>
                  <Icon name="check-circle" size={16} color={theme.colors.cryptoGreen} />
                  <Text variant="bodySmall" style={styles.messageText}>
                    交易已成功確認！您可以在區塊鏈瀏覽器中查看詳情。
                  </Text>
                </View>
              )}

              {currentTx.status === 'failed' && (
                <View style={styles.messageContainer}>
                  <Icon name="error" size={16} color={theme.colors.error} />
                  <Text variant="bodySmall" style={styles.messageText}>
                    交易失敗。可能是由於網絡擁堵或Gas費不足。
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              <Button 
                mode="outlined" 
                onPress={openBlockExplorer}
                style={styles.actionButton}
              >
                <Icon name="open-in-new" size={16} />
                <Text style={styles.actionButtonText}> 查看詳情</Text>
              </Button>

              {currentTx.status === 'failed' && (
                <Button 
                  mode="contained" 
                  onPress={handleRetry}
                  style={styles.actionButton}
                >
                  <Icon name="refresh" size={16} />
                  <Text style={styles.actionButtonText}> 重試</Text>
                </Button>
              )}

              {currentTx.status !== 'pending' && (
                <Button 
                  mode="text" 
                  onPress={handleRemove}
                  style={styles.actionButton}
                >
                  移除
                </Button>
              )}
            </View>

            {/* Close Button */}
            <Button 
              mode="contained" 
              onPress={onDismiss}
              style={styles.closeButton}
            >
              關閉
            </Button>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
  },
  statusChip: {
    minWidth: 80,
  },
  statusChipText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: theme.spacing.sm,
  },
  progressText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  detailsSection: {
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  detailValue: {
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  messageSection: {
    marginBottom: theme.spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.custom.borderRadius.medium,
  },
  messageText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  actionsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    minWidth: 120,
  },
  actionButtonText: {
    fontSize: 12,
  },
  closeButton: {
    marginTop: theme.spacing.sm,
  },
});

export default TransactionStatusModal;