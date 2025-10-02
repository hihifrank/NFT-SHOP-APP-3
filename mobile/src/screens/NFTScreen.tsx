import React, {useState, useEffect} from 'react';
import {View, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert, RefreshControl} from 'react-native';
import {Text, SegmentedButtons, Card, Button, Chip, Modal, Portal, TextInput, ActivityIndicator} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
// Chart component placeholder - install react-native-chart-kit for full functionality
const LineChart = ({data, width, height, chartConfig, bezier, style}: any) => (
  <View style={[{width, height, backgroundColor: '#f0f0f0', borderRadius: 8, justifyContent: 'center', alignItems: 'center'}, style]}>
    <Text>Price Chart</Text>
    <Text style={{fontSize: 12, color: '#666'}}>Install react-native-chart-kit</Text>
  </View>
);
import {useAppTranslation} from '@utils/i18n';
import {useAppDispatch, useAppSelector} from '@store/index';
import {
  fetchUserNFTs,
  purchaseNFT,
  useCouponNFT,
  transferNFT,
  fetchBalance,
  connectMetaMask,
  connectWalletConnect,
  clearError,
} from '@store/slices/web3Slice';
import {theme} from '@theme/index';
import TransactionTracker from '@components/TransactionTracker';
import NFTCard from '@components/NFTCard';
import TransactionStatusModal from '@components/TransactionStatusModal';
import WalletStatusCard from '@components/WalletStatusCard';

const screenWidth = Dimensions.get('window').width;

const NFTScreen: React.FC = () => {
  const {t} = useAppTranslation();
  const dispatch = useAppDispatch();
  const [selectedTab, setSelectedTab] = useState('deals');
  const [refreshing, setRefreshing] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [transferAddress, setTransferAddress] = useState('');
  const [showTransactionTracker, setShowTransactionTracker] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [selectedTransactionHash, setSelectedTransactionHash] = useState<string | undefined>();
  
  const {
    isConnected,
    walletAddress,
    balance,
    nfts,
    transactions,
    loading,
    error,
  } = useAppSelector(state => state.web3);

  const tabs = [
    {value: 'deals', label: 'NFT Deals'},
    {value: 'owned', label: '我的NFT'},
    {value: 'transactions', label: '交易記錄'},
  ];

  useEffect(() => {
    if (isConnected && walletAddress) {
      dispatch(fetchUserNFTs(walletAddress));
      dispatch(fetchBalance(walletAddress));
    }
  }, [dispatch, isConnected, walletAddress]);

  useEffect(() => {
    // Show transaction tracker when there are pending transactions
    if (transactions.length > 0) {
      setShowTransactionTracker(true);
    }
  }, [transactions.length]);

  const handleRefresh = async () => {
    if (!isConnected || !walletAddress) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchUserNFTs(walletAddress)),
        dispatch(fetchBalance(walletAddress)),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectWallet = () => {
    Alert.alert(
      '選擇錢包',
      '請選擇要連接的錢包類型',
      [
        {text: 'MetaMask', onPress: () => dispatch(connectMetaMask())},
        {text: 'WalletConnect', onPress: () => dispatch(connectWalletConnect())},
        {text: '取消', style: 'cancel'},
      ]
    );
  };

  const handlePurchaseNFT = (tokenId: string, price: string) => {
    if (!isConnected) {
      Alert.alert('錢包未連接', '請先連接錢包以購買NFT');
      return;
    }

    Alert.alert(
      '確認購買',
      `確定要以 ${price} MATIC 購買此NFT嗎？`,
      [
        {text: '取消', style: 'cancel'},
        {
          text: '確認',
          onPress: async () => {
            try {
              const result = await dispatch(purchaseNFT({tokenId, price})).unwrap();
              setSelectedTransactionHash(result.hash);
              setTransactionModalVisible(true);
              setShowTransactionTracker(true);
            } catch (error) {
              Alert.alert('購買失敗', error instanceof Error ? error.message : '購買失敗');
            }
          },
        },
      ]
    );
  };

  const handleUseCoupon = (tokenId: string, nftName?: string) => {
    if (!isConnected) {
      Alert.alert('錢包未連接', '請先連接錢包以使用優惠券');
      return;
    }

    const displayName = nftName || `Token #${tokenId}`;
    
    Alert.alert(
      '確認使用',
      `確定要使用 "${displayName}" 優惠券嗎？使用後將無法撤銷。`,
      [
        {text: '取消', style: 'cancel'},
        {
          text: '確認使用',
          onPress: async () => {
            try {
              const result = await dispatch(useCouponNFT(tokenId)).unwrap();
              setSelectedTransactionHash(result.hash);
              setTransactionModalVisible(true);
              setShowTransactionTracker(true);
            } catch (error) {
              Alert.alert('使用失敗', error instanceof Error ? error.message : '使用失敗');
            }
          },
        },
      ]
    );
  };

  const handleTransferNFT = (nft: any) => {
    setSelectedNFT(nft);
    setTransferModalVisible(true);
  };

  const confirmTransfer = async () => {
    if (!selectedNFT || !transferAddress.trim()) {
      Alert.alert('錯誤', '請輸入有效的接收地址');
      return;
    }

    try {
      const result = await dispatch(transferNFT({
        to: transferAddress.trim(),
        tokenId: selectedNFT.tokenId,
      })).unwrap();
      
      setTransferModalVisible(false);
      setTransferAddress('');
      setSelectedNFT(null);
      
      setSelectedTransactionHash(result.hash);
      setTransactionModalVisible(true);
      setShowTransactionTracker(true);
    } catch (error) {
      Alert.alert('轉移失敗', error instanceof Error ? error.message : '轉移失敗');
    }
  };

  const nftDeals = [
    {
      id: '1',
      name: 'Morning Tea House NFT Coupon',
      discount: '15% OFF',
      originalPrice: '$28.00',
      rarity: 'Legendary',
      rarityScore: '9.2/10',
      expiry: '2025-10-15',
      icon: 'local-cafe',
      price: '0.05',
      rating: 5,
    },
    {
      id: '2',
      name: 'Fashion Boutique NFT Deal',
      discount: '20% OFF',
      originalPrice: '$45.00',
      rarity: 'Rare',
      rarityScore: '7.8/10',
      expiry: '2025-11-01',
      icon: 'checkroom',
      price: '0.03',
      rating: 4,
    },
    {
      id: '3',
      name: 'Gaming Store NFT Voucher',
      discount: '10% OFF',
      originalPrice: '$35.00',
      rarity: 'Common',
      rarityScore: '5.5/10',
      expiry: '2025-12-31',
      icon: 'sports-esports',
      price: '0.02',
      rating: 5,
    },
    {
      id: '4',
      name: 'Literary Corner NFT Pass',
      discount: '25% OFF',
      originalPrice: '$22.00',
      rarity: 'Epic',
      rarityScore: '8.7/10',
      expiry: '2025-09-30',
      icon: 'menu-book',
      price: '0.04',
      rating: 5,
    },
  ];

  const trendingCollections = [
    {
      id: '1',
      title: 'Food & Dining',
      count: '156 NFTs',
      icon: 'restaurant',
      color: theme.colors.tertiary,
    },
    {
      id: '2',
      title: 'Retail',
      count: '89 NFTs',
      icon: 'shopping-bag',
      color: theme.colors.primary,
    },
  ];

  const featuredMerchants = [
    {
      id: '1',
      name: 'Dragon Mall',
      description: 'Premium Shopping Center',
      rating: 4.8,
      icon: 'store',
      color: theme.colors.error,
    },
    {
      id: '2',
      name: 'Organic Market',
      description: 'Fresh & Sustainable',
      rating: 4.9,
      icon: 'eco',
      color: theme.colors.cryptoGreen,
    },
  ];

  const chartData = {
    labels: ['1D', '7D', '30D', '90D', '1Y'],
    datasets: [
      {
        data: [0.065, 0.072, 0.085, 0.078, 0.085],
        color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return theme.colors.nftGold;
      case 'epic':
        return theme.colors.secondary;
      case 'rare':
        return theme.colors.primary;
      case 'common':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({length: 5}, (_, i) => (
      <Icon
        key={i}
        name={i < rating ? 'star' : 'star-border'}
        size={12}
        color={theme.colors.nftGold}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity>
            <Icon name="menu" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>ShopTransit</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="dark-mode" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            <Button 
              mode="contained" 
              compact 
              style={[styles.connectButton, isConnected && styles.connectedButton]}
              onPress={handleConnectWallet}
              disabled={isConnected}
            >
              <Icon name="account-balance-wallet" size={14} />
              <Text style={styles.connectText}>
                {isConnected ? ' Connected' : ' Connect'}
              </Text>
            </Button>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={tabs}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {selectedTab === 'deals' && (
          <>
            {/* NFT Price Chart */}
            <View style={styles.section}>
              <Card style={styles.chartCard}>
                <Card.Content>
                  <View style={styles.chartHeader}>
                    <Text variant="titleMedium" style={styles.chartTitle}>Morning Tea House NFT</Text>
                    <View style={styles.priceChange}>
                      <Text variant="bodySmall" style={styles.priceChangeText}>+12.5%</Text>
                      <Text variant="bodySmall" style={styles.priceChangeLabel}>24h</Text>
                    </View>
                  </View>
                  <View style={styles.priceRow}>
                    <Text variant="headlineSmall" style={styles.priceETH}>0.085 ETH</Text>
                    <Text variant="bodySmall" style={styles.priceUSD}>≈ $156.30</Text>
                  </View>
                  <LineChart
                    data={chartData}
                    width={screenWidth - 64}
                    height={120}
                    chartConfig={{
                      backgroundColor: theme.colors.surface,
                      backgroundGradientFrom: theme.colors.surface,
                      backgroundGradientTo: theme.colors.surface,
                      decimalPlaces: 3,
                      color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(117, 117, 117, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: '3',
                        strokeWidth: '2',
                        stroke: theme.colors.primary,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </Card.Content>
              </Card>
            </View>

            {/* List NFT Section */}
            <View style={styles.section}>
              <Card style={styles.listNFTCard}>
                <Card.Content>
                  <View style={styles.listNFTHeader}>
                    <Text variant="titleMedium" style={styles.listNFTTitle}>List Your NFTs</Text>
                    <Icon name="add-circle" size={24} color={theme.colors.primary} />
                  </View>
                  <Text variant="bodySmall" style={styles.listNFTSubtitle}>
                    Turn your NFTs into exclusive deals and earn rewards
                  </Text>
                  <Button mode="contained" style={styles.listButton}>
                    <Icon name="file-upload" size={16} />
                    <Text style={styles.listButtonText}> List New NFT Deal</Text>
                  </Button>
                  <View style={styles.listActions}>
                    <Button mode="outlined" compact style={styles.actionButton}>
                      <Icon name="visibility" size={14} />
                      <Text style={styles.actionButtonText}> Preview</Text>
                    </Button>
                    <Button mode="outlined" compact style={styles.actionButton}>
                      <Icon name="trending-up" size={14} />
                      <Text style={styles.actionButtonText}> Analytics</Text>
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </View>

            {/* AI Recommended NFT Deals */}
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>AI Recommended NFT Deals</Text>
              
              {nftDeals.map((deal) => (
                <TouchableOpacity key={deal.id}>
                  <Card style={styles.dealCard}>
                    <Card.Content style={styles.dealContent}>
                      <Chip 
                        mode="flat" 
                        style={[styles.rarityChip, {backgroundColor: getRarityColor(deal.rarity)}]}
                        textStyle={styles.rarityText}
                      >
                        {deal.rarity}
                      </Chip>
                      <View style={styles.dealRow}>
                        <View style={styles.dealIcon}>
                          <Icon name={deal.icon} size={24} color={theme.colors.onPrimary} />
                        </View>
                        <View style={styles.dealDetails}>
                          <View style={styles.dealStars}>
                            {renderStars(deal.rating)}
                          </View>
                          <Text variant="titleSmall" style={styles.dealName}>{deal.name}</Text>
                          <View style={styles.dealPricing}>
                            <Text variant="titleMedium" style={styles.dealDiscount}>{deal.discount}</Text>
                            <Text variant="bodySmall" style={styles.dealOriginalPrice}>{deal.originalPrice}</Text>
                          </View>
                          <Text variant="bodySmall" style={styles.dealRarity}>Rarity: {deal.rarityScore}</Text>
                          <Text variant="bodySmall" style={styles.dealExpiry}>Expires: {deal.expiry}</Text>
                        </View>
                        <Button 
                          mode="contained" 
                          compact 
                          style={styles.redeemButton}
                          onPress={() => handlePurchaseNFT(deal.id, deal.price)}
                          disabled={!isConnected}
                        >
                          {isConnected ? 'Purchase' : 'Connect Wallet'}
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>

            {/* Trending Collections */}
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Trending Collections</Text>
              <View style={styles.collectionsGrid}>
                {trendingCollections.map((collection) => (
                  <TouchableOpacity key={collection.id} style={styles.collectionCard}>
                    <View style={[styles.collectionIcon, {backgroundColor: collection.color}]}>
                      <Icon name={collection.icon} size={32} color={theme.colors.onPrimary} />
                    </View>
                    <Text variant="titleSmall" style={styles.collectionTitle}>{collection.title}</Text>
                    <Text variant="bodySmall" style={styles.collectionCount}>{collection.count}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Featured Merchants */}
            <View style={styles.section}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Featured Merchants</Text>
              {featuredMerchants.map((merchant) => (
                <TouchableOpacity key={merchant.id}>
                  <Card style={styles.merchantCard}>
                    <Card.Content style={styles.merchantContent}>
                      <View style={[styles.merchantIcon, {backgroundColor: merchant.color}]}>
                        <Icon name={merchant.icon} size={24} color={theme.colors.onPrimary} />
                      </View>
                      <View style={styles.merchantDetails}>
                        <Text variant="titleSmall" style={styles.merchantName}>{merchant.name}</Text>
                        <Text variant="bodySmall" style={styles.merchantDescription}>{merchant.description}</Text>
                      </View>
                      <View style={styles.merchantRating}>
                        <Icon name="star" size={14} color={theme.colors.nftGold} />
                        <Text variant="bodySmall" style={styles.merchantRatingText}>{merchant.rating}</Text>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>

            {/* Platform Stats */}
            <View style={styles.section}>
              <Card style={styles.statsCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.statsTitle}>Platform Stats</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text variant="headlineSmall" style={styles.statNumber}>2.4K</Text>
                      <Text variant="bodySmall" style={styles.statLabel}>Active NFTs</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text variant="headlineSmall" style={styles.statNumber}>15.6K</Text>
                      <Text variant="bodySmall" style={styles.statLabel}>Total Users</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </View>

            {/* Wallet Status */}
            <View style={styles.section}>
              <WalletStatusCard 
                showFullDetails={true}
                onConnectPress={handleConnectWallet}
              />
            </View>
          </>
        )}

        {selectedTab === 'owned' && (
          <View style={styles.section}>
            {!isConnected ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Icon name="account-balance-wallet" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    暫無擁有的NFT
                  </Text>
                  <Text variant="bodySmall" style={styles.emptySubtext}>
                    連接錢包以查看您的NFT收藏
                  </Text>
                  <Button 
                    mode="contained" 
                    style={styles.connectWalletButton}
                    onPress={handleConnectWallet}
                  >
                    Connect Wallet
                  </Button>
                </Card.Content>
              </Card>
            ) : loading ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    載入中...
                  </Text>
                </Card.Content>
              </Card>
            ) : nfts.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Icon name="collections" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    暫無擁有的NFT
                  </Text>
                  <Text variant="bodySmall" style={styles.emptySubtext}>
                    購買NFT優惠券開始您的收藏
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <>
                <Text variant="titleLarge" style={styles.sectionTitle}>我的NFT收藏</Text>
                {nfts.map((nft) => (
                  <NFTCard
                    key={nft.tokenId}
                    nft={nft}
                    isOwned={true}
                    onUse={handleUseCoupon}
                    onTransfer={handleTransferNFT}
                    showActions={true}
                  />
                ))}
              </>
            )}
          </View>
        )}

        {selectedTab === 'transactions' && (
          <View style={styles.section}>
            {!isConnected ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Icon name="receipt" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    暫無交易記錄
                  </Text>
                  <Text variant="bodySmall" style={styles.emptySubtext}>
                    連接錢包以查看交易記錄
                  </Text>
                </Card.Content>
              </Card>
            ) : transactions.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <Icon name="receipt" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    暫無交易記錄
                  </Text>
                  <Text variant="bodySmall" style={styles.emptySubtext}>
                    開始交易NFT以查看記錄
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <>
                <Text variant="titleLarge" style={styles.sectionTitle}>交易記錄</Text>
                {transactions.map((tx) => (
                  <Card key={tx.hash} style={styles.transactionCard}>
                    <Card.Content style={styles.transactionContent}>
                      <View style={styles.transactionIcon}>
                        <Icon 
                          name={
                            tx.type === 'purchase' ? 'shopping-cart' :
                            tx.type === 'use' ? 'redeem' : 'send'
                          } 
                          size={24} 
                          color={theme.colors.onPrimary} 
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text variant="titleSmall" style={styles.transactionType}>
                          {tx.type === 'purchase' ? '購買NFT' : 
                           tx.type === 'use' ? '使用優惠券' : '轉移NFT'}
                        </Text>
                        <Text variant="bodySmall" style={styles.transactionHash}>
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </Text>
                        <Text variant="bodySmall" style={styles.transactionTime}>
                          {new Date(tx.timestamp).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.transactionStatus}>
                        <Chip 
                          mode="flat"
                          style={[
                            styles.statusChip,
                            {backgroundColor: 
                              tx.status === 'confirmed' ? theme.colors.cryptoGreen :
                              tx.status === 'pending' ? theme.colors.secondary :
                              theme.colors.error
                            }
                          ]}
                          textStyle={styles.statusText}
                        >
                          {tx.status === 'confirmed' ? '已確認' :
                           tx.status === 'pending' ? '待確認' : '失敗'}
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Transfer NFT Modal */}
      <Portal>
        <Modal
          visible={transferModalVisible}
          onDismiss={() => setTransferModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.modalTitle}>轉移NFT</Text>
              {selectedNFT && (
                <View style={styles.modalNFTInfo}>
                  <Text variant="bodyMedium" style={styles.modalNFTName}>
                    {selectedNFT.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.modalNFTDescription}>
                    Token ID: {selectedNFT.tokenId}
                  </Text>
                </View>
              )}
              <TextInput
                label="接收地址"
                value={transferAddress}
                onChangeText={setTransferAddress}
                placeholder="0x..."
                style={styles.addressInput}
                mode="outlined"
              />
              <View style={styles.modalActions}>
                <Button 
                  mode="outlined" 
                  onPress={() => setTransferModalVisible(false)}
                  style={styles.modalButton}
                >
                  取消
                </Button>
                <Button 
                  mode="contained" 
                  onPress={confirmTransfer}
                  style={styles.modalButton}
                  disabled={!transferAddress.trim()}
                >
                  確認轉移
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* Transaction Tracker */}
      <TransactionTracker
        visible={showTransactionTracker}
        onDismiss={() => setShowTransactionTracker(false)}
      />

      {/* Transaction Status Modal */}
      <TransactionStatusModal
        visible={transactionModalVisible}
        onDismiss={() => setTransactionModalVisible(false)}
        transactionHash={selectedTransactionHash}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: theme.spacing.sm,
  },
  connectButton: {
    backgroundColor: theme.colors.onSurface,
  },
  connectedButton: {
    backgroundColor: theme.colors.cryptoGreen,
  },
  connectText: {
    color: theme.colors.surface,
    fontSize: 12,
  },
  tabContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  segmentedButtons: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    color: theme.colors.onBackground,
  },
  chartCard: {
    backgroundColor: theme.colors.onSurface,
    elevation: theme.custom.elevation.medium,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  chartTitle: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChangeText: {
    color: theme.colors.cryptoGreen,
    fontWeight: '600',
    marginRight: theme.spacing.xs,
  },
  priceChangeLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.md,
  },
  priceETH: {
    color: theme.colors.surface,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  priceUSD: {
    color: theme.colors.onSurfaceVariant,
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.custom.borderRadius.medium,
  },
  listNFTCard: {
    backgroundColor: theme.colors.onSurface,
    elevation: theme.custom.elevation.medium,
  },
  listNFTHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  listNFTTitle: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  listNFTSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
  },
  listButton: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  listButtonText: {
    color: theme.colors.onPrimary,
  },
  listActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    borderColor: theme.colors.onSurfaceVariant,
  },
  actionButtonText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  dealCard: {
    backgroundColor: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
    elevation: theme.custom.elevation.medium,
  },
  dealContent: {
    position: 'relative',
  },
  rarityChip: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    zIndex: 1,
  },
  rarityText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  dealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: theme.spacing.lg,
  },
  dealIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.custom.borderRadius.medium,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  dealDetails: {
    flex: 1,
  },
  dealStars: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  dealName: {
    color: theme.colors.surface,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  dealPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  dealDiscount: {
    color: theme.colors.cryptoGreen,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
  dealOriginalPrice: {
    color: theme.colors.onSurfaceVariant,
    textDecorationLine: 'line-through',
  },
  dealRarity: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  dealExpiry: {
    color: theme.colors.onSurfaceVariant,
  },
  redeemButton: {
    backgroundColor: theme.colors.primary,
  },
  collectionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collectionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.custom.borderRadius.medium,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    elevation: theme.custom.elevation.small,
  },
  collectionIcon: {
    width: 80,
    height: 80,
    borderRadius: theme.custom.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  collectionTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  collectionCount: {
    color: theme.colors.onSurfaceVariant,
  },
  merchantCard: {
    marginBottom: theme.spacing.sm,
    elevation: theme.custom.elevation.small,
  },
  merchantContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  merchantDetails: {
    flex: 1,
  },
  merchantName: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  merchantDescription: {
    color: theme.colors.onSurfaceVariant,
  },
  merchantRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  merchantRatingText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  statsCard: {
    backgroundColor: theme.colors.onSurface,
    elevation: theme.custom.elevation.medium,
  },
  statsTitle: {
    color: theme.colors.surface,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  walletCard: {
    backgroundColor: theme.colors.onSurface,
    elevation: theme.custom.elevation.medium,
  },
  walletContent: {
    alignItems: 'center',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  walletTitle: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
  walletStatus: {
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
  walletEmpty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  walletEmptyText: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  walletConnected: {
    paddingVertical: theme.spacing.md,
  },
  walletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  walletLabel: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  walletAddress: {
    color: theme.colors.onSurface,
    fontFamily: 'monospace',
  },
  walletBalance: {
    color: theme.colors.cryptoGreen,
    fontWeight: '600',
  },
  connectWalletButton: {
    marginTop: theme.spacing.sm,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    elevation: theme.custom.elevation.small,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
  },
  // Owned NFTs styles
  ownedNFTCard: {
    marginBottom: theme.spacing.md,
    elevation: theme.custom.elevation.small,
  },
  ownedNFTContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nftImageContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.custom.borderRadius.medium,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  nftDetails: {
    flex: 1,
  },
  nftName: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  nftDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  nftAttributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.sm,
  },
  attributeChip: {
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  attributeText: {
    fontSize: 10,
  },
  nftActions: {
    alignItems: 'flex-end',
  },
  useButton: {
    backgroundColor: theme.colors.cryptoGreen,
    marginBottom: theme.spacing.xs,
  },
  transferButton: {
    borderColor: theme.colors.primary,
  },
  // Transaction styles
  transactionCard: {
    marginBottom: theme.spacing.sm,
    elevation: theme.custom.elevation.small,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  transactionHash: {
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
    marginBottom: theme.spacing.xs,
  },
  transactionTime: {
    color: theme.colors.onSurfaceVariant,
  },
  transactionStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    minWidth: 60,
  },
  statusText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: '600',
  },
  modalNFTInfo: {
    backgroundColor: theme.colors.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.custom.borderRadius.medium,
    marginBottom: theme.spacing.lg,
  },
  modalNFTName: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  modalNFTDescription: {
    color: theme.colors.onSurfaceVariant,
  },
  addressInput: {
    marginBottom: theme.spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
});

export default NFTScreen;