import React from 'react';
import {View, ScrollView, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {Text, Card, Button, Chip, Avatar} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppTranslation} from '@utils/i18n';
import {theme} from '@theme/index';

const HomeScreen: React.FC = () => {
  const {t} = useAppTranslation();

  const aiRecommendations = [
    {
      id: '1',
      name: 'Morning Tea House',
      description: 'Har Gow NFT Coupon - Collectible & Redeemable',
      discount: 'Free Dim Sum NFT',
      rarity: 'Rare',
      rating: 4.8,
      validUntil: 'Dec 31',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/6bdd8fc06b-b016529b904f922b1c9f.png',
    },
    {
      id: '2',
      name: 'Literary Corner',
      description: 'Vintage Book Cover NFT - Free latte included',
      discount: 'Book NFT Token',
      rarity: 'Epic',
      rating: 4.7,
      validUntil: 'Jan 15',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/18b3e35e00-d53a34103ad93194edae.png',
    },
    {
      id: '3',
      name: 'Style District',
      description: 'Limited Edition Accessory NFT Token',
      discount: 'Designer NFT',
      rarity: 'Legend',
      rating: 4.9,
      validUntil: 'Dec 25',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/043f2faa62-1cfc594f653ea486bfb4.png',
    },
  ];

  const comboBundles = [
    {
      id: '1',
      title: 'Tea + Books',
      description: 'Dim Sum NFT + Novel Token Bundle',
      price: '$35 HKD',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/679c241f3e-ab87d69431010df979de.png',
    },
    {
      id: '2',
      title: 'Style + Tea',
      description: 'Fashion NFT + Premium Tea Set',
      price: '$68 HKD',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/c71fb6ad9c-0105501dc0ebcfbea66c.png',
    },
  ];

  const trendingDeals = [
    {
      id: '1',
      name: 'Pearl Tea House',
      description: 'Signature Pearl Milk Tea NFT',
      discount: 'Free Drink NFT',
      minted: '1.2k minted',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/2f8fe99bac-483c21fc9eb290516dc7.png',
    },
    {
      id: '2',
      name: "Reader's Haven",
      description: 'Classic Literature NFT Collection',
      discount: 'Book + Coffee',
      minted: '856 minted',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/18b3e35e00-d53a34103ad93194edae.png',
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'rare':
        return theme.colors.primary;
      case 'epic':
        return theme.colors.secondary;
      case 'legend':
        return theme.colors.nftGold;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Icon name="shopping-bag" size={24} color={theme.colors.onPrimary} />
            <Text variant="titleLarge" style={styles.appTitle}>ShopTransit</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="language" size={20} color={theme.colors.onPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Icon name="dark-mode" size={20} color={theme.colors.onPrimary} />
            </TouchableOpacity>
            <Button mode="contained" compact style={styles.connectButton}>
              <Icon name="account-balance-wallet" size={16} />
              <Text style={styles.connectText}> Connect</Text>
            </Button>
          </View>
        </View>
        <View style={styles.headerCenter}>
          <Text variant="headlineSmall" style={styles.headerTitle}>NFT Deals</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Exclusive Hong Kong Shop Coupons
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* AI Recommendations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Icon name="smart-toy" size={20} color={theme.colors.primary} />
              <Text variant="titleLarge" style={styles.sectionTitle}>AI Recommended</Text>
            </View>
            <Chip mode="flat" style={styles.liveChip}>LIVE</Chip>
          </View>

          {aiRecommendations.map((item) => (
            <TouchableOpacity key={item.id}>
              <Card style={styles.recommendationCard}>
                <Card.Content style={styles.recommendationContent}>
                  <View style={styles.recommendationImageContainer}>
                    <Image source={{uri: item.image}} style={styles.recommendationImage} />
                    <Chip 
                      mode="flat" 
                      style={[styles.rarityChip, {backgroundColor: getRarityColor(item.rarity)}]}
                      textStyle={styles.rarityText}
                    >
                      <Icon name="diamond" size={12} /> {item.rarity}
                    </Chip>
                  </View>
                  <View style={styles.recommendationDetails}>
                    <View style={styles.recommendationHeader}>
                      <Text variant="titleSmall" style={styles.merchantName}>{item.name}</Text>
                      <Text variant="titleSmall" style={styles.discountText}>{item.discount}</Text>
                    </View>
                    <Text variant="bodySmall" style={styles.description}>{item.description}</Text>
                    <View style={styles.recommendationFooter}>
                      <Text variant="bodySmall" style={styles.validText}>Valid: {item.validUntil}</Text>
                      <View style={styles.ratingContainer}>
                        <Icon name="star" size={12} color={theme.colors.nftGold} />
                        <Text variant="bodySmall" style={styles.ratingText}>{item.rating}</Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cross-Store NFT Bundles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Cross-Store NFT Bundles</Text>
            <Button mode="text" compact>View All</Button>
          </View>

          <View style={styles.bundleGrid}>
            {comboBundles.map((bundle) => (
              <TouchableOpacity key={bundle.id} style={styles.bundleCard}>
                <Image source={{uri: bundle.image}} style={styles.bundleImage} />
                <Text variant="titleSmall" style={styles.bundleTitle}>{bundle.title}</Text>
                <Text variant="bodySmall" style={styles.bundleDescription}>{bundle.description}</Text>
                <View style={styles.bundleFooter}>
                  <Text variant="titleSmall" style={styles.bundlePrice}>{bundle.price}</Text>
                  <Icon name="qr-code" size={16} color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending NFT Coupons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Trending NFT Coupons</Text>
            <View style={styles.trendingBadge}>
              <Icon name="local-fire-department" size={16} color={theme.colors.secondary} />
              <Text variant="bodySmall" style={styles.hotText}>Hot</Text>
            </View>
          </View>

          {trendingDeals.map((deal) => (
            <TouchableOpacity key={deal.id}>
              <Card style={styles.trendingCard}>
                <Card.Content style={styles.trendingContent}>
                  <Avatar.Image size={48} source={{uri: deal.image}} />
                  <View style={styles.trendingDetails}>
                    <Text variant="titleSmall">{deal.name}</Text>
                    <Text variant="bodySmall" style={styles.trendingDescription}>{deal.description}</Text>
                  </View>
                  <View style={styles.trendingRight}>
                    <Text variant="titleSmall" style={styles.discountText}>{deal.discount}</Text>
                    <Text variant="bodySmall" style={styles.mintedText}>{deal.minted}</Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* NFT Lucky Draw */}
        <View style={styles.section}>
          <Card style={styles.lotteryCard}>
            <Card.Content style={styles.lotteryContent}>
              <Text variant="titleLarge" style={styles.lotteryTitle}>NFT Lucky Draw</Text>
              <Text variant="bodyMedium" style={styles.lotterySubtitle}>Spin to win exclusive prizes!</Text>
              
              <View style={styles.lotteryWheel}>
                <Image 
                  source={{uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/0e4c3768c8-9524d6dd3f25388c9794.png'}} 
                  style={styles.wheelImage} 
                />
                <View style={styles.playButton}>
                  <Icon name="play-arrow" size={24} color={theme.colors.onPrimary} />
                </View>
              </View>

              <View style={styles.prizeGrid}>
                <View style={styles.prizeItem}>
                  <Icon name="card-giftcard" size={16} color={theme.colors.nftGold} />
                  <Text variant="bodySmall" style={styles.prizeText}>Shop Badges</Text>
                </View>
                <View style={styles.prizeItem}>
                  <Icon name="confirmation-number" size={16} color={theme.colors.error} />
                  <Text variant="bodySmall" style={styles.prizeText}>Premium Coupons</Text>
                </View>
                <View style={styles.prizeItem}>
                  <Icon name="star" size={16} color={theme.colors.primary} />
                  <Text variant="bodySmall" style={styles.prizeText}>Rare NFTs</Text>
                </View>
                <View style={styles.prizeItem}>
                  <Icon name="workspace-premium" size={16} color={theme.colors.tertiary} />
                  <Text variant="bodySmall" style={styles.prizeText}>VIP Access</Text>
                </View>
              </View>

              <Button mode="contained" style={styles.spinButton}>
                <Icon name="casino" size={16} />
                <Text style={styles.spinButtonText}> Spin Now (5 NFT Tokens)</Text>
              </Button>
            </Card.Content>
          </Card>
        </View>

        {/* Marketplace Stats */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Marketplace Stats</Text>
          
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon name="people" size={32} color={theme.colors.primary} />
                <Text variant="titleLarge" style={styles.statNumber}>12.5K</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Active Users</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon name="confirmation-number" size={32} color={theme.colors.nftGold} />
                <Text variant="titleLarge" style={styles.statNumber}>8.9K</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Coupons Redeemed</Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.miniStatsGrid}>
            <Card style={styles.miniStatCard}>
              <Card.Content style={styles.miniStatContent}>
                <Icon name="store" size={20} color={theme.colors.primary} />
                <Text variant="titleSmall" style={styles.miniStatNumber}>450+</Text>
                <Text variant="bodySmall" style={styles.miniStatLabel}>Shops</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.miniStatCard}>
              <Card.Content style={styles.miniStatContent}>
                <Icon name="image" size={20} color={theme.colors.tertiary} />
                <Text variant="titleSmall" style={styles.miniStatNumber}>2.1K</Text>
                <Text variant="bodySmall" style={styles.miniStatLabel}>NFTs</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.miniStatCard}>
              <Card.Content style={styles.miniStatContent}>
                <Icon name="monetization-on" size={20} color={theme.colors.nftGold} />
                <Text variant="titleSmall" style={styles.miniStatNumber}>$89K</Text>
                <Text variant="bodySmall" style={styles.miniStatLabel}>Volume</Text>
              </Card.Content>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    color: theme.colors.onPrimary,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  connectButton: {
    backgroundColor: theme.colors.onPrimary,
  },
  connectText: {
    color: theme.colors.primary,
    fontSize: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.onBackground,
    fontWeight: '600',
  },
  liveChip: {
    backgroundColor: theme.colors.primary,
  },
  recommendationCard: {
    marginBottom: theme.spacing.sm,
    elevation: theme.custom.elevation.small,
  },
  recommendationContent: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
  },
  recommendationImageContainer: {
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  recommendationImage: {
    width: 64,
    height: 64,
    borderRadius: theme.custom.borderRadius.medium,
  },
  rarityChip: {
    position: 'absolute',
    top: -8,
    right: -8,
    minHeight: 20,
  },
  rarityText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
  },
  recommendationDetails: {
    flex: 1,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  merchantName: {
    fontWeight: '600',
  },
  discountText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validText: {
    color: theme.colors.onSurfaceVariant,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  bundleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bundleCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.custom.borderRadius.medium,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
    elevation: theme.custom.elevation.small,
  },
  bundleImage: {
    width: '100%',
    height: 80,
    borderRadius: theme.custom.borderRadius.small,
    marginBottom: theme.spacing.sm,
  },
  bundleTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  bundleDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  bundleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bundlePrice: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotText: {
    color: theme.colors.secondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  trendingCard: {
    marginBottom: theme.spacing.sm,
    elevation: theme.custom.elevation.small,
  },
  trendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  trendingDetails: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  trendingDescription: {
    color: theme.colors.onSurfaceVariant,
  },
  trendingRight: {
    alignItems: 'flex-end',
  },
  mintedText: {
    color: theme.colors.onSurfaceVariant,
  },
  lotteryCard: {
    backgroundColor: theme.colors.surface,
    elevation: theme.custom.elevation.medium,
  },
  lotteryContent: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  lotteryTitle: {
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  lotterySubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.lg,
  },
  lotteryWheel: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  wheelImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: theme.colors.nftGold,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -20}, {translateY: -20}],
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  prizeItem: {
    width: '48%',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.custom.borderRadius.small,
    padding: theme.spacing.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  prizeText: {
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  spinButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
  },
  spinButtonText: {
    color: theme.colors.onPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    elevation: theme.custom.elevation.small,
  },
  statContent: {
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statNumber: {
    fontWeight: '600',
    marginVertical: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
  },
  miniStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStatCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    elevation: theme.custom.elevation.small,
  },
  miniStatContent: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  miniStatNumber: {
    fontWeight: '600',
    marginVertical: theme.spacing.xs,
  },
  miniStatLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
});

export default HomeScreen;