import React, {useState} from 'react';
import {View, ScrollView, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {Text, Searchbar, Chip, Card, Button} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useAppTranslation} from '@utils/i18n';
import {theme} from '@theme/index';

const ExploreScreen: React.FC = () => {
  const {t} = useAppTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    {key: 'all', label: '所有商店', icon: 'apps'},
    {key: 'toys', label: '玩具遊戲', icon: 'toys'},
    {key: 'electronics', label: '電子產品', icon: 'phone-android'},
    {key: 'collectibles', label: '收藏品', icon: 'diamond'},
    {key: 'antiques', label: '古董', icon: 'museum'},
    {key: 'books', label: '書籍', icon: 'book'},
  ];

  const featuredDeals = [
    {
      id: '1',
      name: 'Vintage Toy Emporium',
      description: 'Rare collectible toys & vintage games',
      location: 'Tsim Sha Tsui, HK',
      rating: 4.9,
      badge: 'Exclusive NFT',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/d1e5107e12-a8d24f8b3148dc94961b.png',
    },
    {
      id: '2',
      name: 'Retro Electronics Hub',
      description: 'Vintage computers & gaming consoles',
      location: 'Causeway Bay, HK',
      rating: 4.7,
      badge: 'Gaming NFT',
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/00b928e874-0bce6e13bf62a2a86a3a.png',
    },
  ];

  const categoryStats = [
    {key: 'toys', label: '玩具遊戲', icon: 'toys', count: 85, color: theme.colors.error},
    {key: 'electronics', label: '電子產品', icon: 'phone-android', count: 67, color: theme.colors.tertiary},
    {key: 'collectibles', label: '收藏品', icon: 'diamond', count: 92, color: theme.colors.primary},
    {key: 'antiques', label: '古董', icon: 'museum', count: 34, color: theme.colors.cryptoGreen},
    {key: 'books', label: '書籍', icon: 'book', count: 48, color: theme.colors.nftGold},
    {key: 'art', label: '藝術工藝', icon: 'palette', count: 29, color: theme.colors.secondary},
  ];

  const allStores = [
    {
      id: '1',
      name: 'Action Figure Kingdom',
      description: 'Exclusive superhero & anime figures',
      rating: 4.8,
      reviews: 324,
      distance: '0.8 km away',
      category: 'toys',
      hasNFT: true,
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/0c226cb5d8-8b7d5815cc7e78aa33de.png',
    },
    {
      id: '2',
      name: 'Vintage Tech Vault',
      description: 'Rare vintage computers & consoles',
      rating: 4.6,
      reviews: 189,
      distance: '1.2 km away',
      category: 'electronics',
      hasNFT: true,
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/1b12fb0d44-eb94d4a501515cedca8e.png',
    },
    {
      id: '3',
      name: 'Rare Treasures Co.',
      description: 'Trading cards & rare collectibles',
      rating: 4.7,
      reviews: 256,
      distance: '0.5 km away',
      category: 'collectibles',
      hasNFT: true,
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/a656c227b6-58cefe0c868ed16850e0.png',
    },
    {
      id: '4',
      name: 'Heritage Antiques',
      description: 'Authentic antique furniture & artifacts',
      rating: 4.9,
      reviews: 412,
      distance: '1.5 km away',
      category: 'antiques',
      hasNFT: true,
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/9f35100d4e-7efacd475836697d39e0.png',
    },
    {
      id: '5',
      name: 'Rare Books Library',
      description: 'First editions & rare manuscripts',
      rating: 4.5,
      reviews: 178,
      distance: '2.1 km away',
      category: 'books',
      hasNFT: true,
      image: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/ba965de760-2338b8e67c284fe77cc5.png',
    },
  ];

  const filteredStores = selectedCategory === 'all' 
    ? allStores 
    : allStores.filter(store => store.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity>
            <Icon name="arrow-back" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>Explore Stores</Text>
          <TouchableOpacity>
            <Icon name="search" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text variant="headlineSmall" style={styles.headerMainTitle}>Discover Amazing Deals</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Browse stores by category & save big
          </Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              onPress={() => setSelectedCategory(category.key)}
              style={[
                styles.filterChip,
                selectedCategory === category.key && styles.filterChipActive
              ]}
            >
              <Icon 
                name={category.icon} 
                size={16} 
                color={selectedCategory === category.key ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} 
              />
              <Text 
                variant="bodySmall" 
                style={[
                  styles.filterChipText,
                  selectedCategory === category.key && styles.filterChipTextActive
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Featured NFT Deals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>Featured NFT Deals</Text>
            <Chip mode="flat" style={styles.limitedChip}>LIMITED NFT</Chip>
          </View>

          {featuredDeals.map((deal) => (
            <TouchableOpacity key={deal.id}>
              <Card style={styles.featuredCard}>
                <Card.Content style={styles.featuredContent}>
                  <View style={styles.featuredImageContainer}>
                    <Image source={{uri: deal.image}} style={styles.featuredImage} />
                    <Chip mode="flat" style={styles.nftBadge}>
                      <Icon name="token" size={12} />
                      <Text style={styles.nftBadgeText}> NFT</Text>
                    </Chip>
                  </View>
                  <View style={styles.featuredDetails}>
                    <View style={styles.featuredHeader}>
                      <Text variant="titleSmall" style={styles.storeName}>{deal.name}</Text>
                      <View style={styles.ratingContainer}>
                        <Icon name="star" size={14} color={theme.colors.nftGold} />
                        <Text variant="bodySmall" style={styles.ratingText}>{deal.rating}</Text>
                      </View>
                    </View>
                    <Text variant="bodySmall" style={styles.storeDescription}>{deal.description}</Text>
                    <View style={styles.featuredFooter}>
                      <View style={styles.locationContainer}>
                        <Icon name="place" size={12} color={theme.colors.error} />
                        <Text variant="bodySmall" style={styles.locationText}>{deal.location}</Text>
                      </View>
                      <Chip mode="flat" style={styles.exclusiveBadge}>{deal.badge}</Chip>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Browse by Category</Text>
          
          <View style={styles.categoryGrid}>
            {categoryStats.map((category) => (
              <TouchableOpacity 
                key={category.key}
                style={styles.categoryCard}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Icon name={category.icon} size={32} color={category.color} />
                <Text variant="titleSmall" style={styles.categoryTitle}>{category.label}</Text>
                <Text variant="bodySmall" style={styles.categoryCount}>{category.count} stores</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Stores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleLarge" style={styles.sectionTitle}>All Stores</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity style={styles.sortButton}>
                <Icon name="sort" size={16} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sortButton}>
                <Icon name="filter-list" size={16} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {filteredStores.map((store) => (
            <TouchableOpacity key={store.id}>
              <Card style={styles.storeCard}>
                <Card.Content style={styles.storeContent}>
                  <Image source={{uri: store.image}} style={styles.storeImage} />
                  <View style={styles.storeDetails}>
                    <View style={styles.storeHeader}>
                      <Text variant="titleSmall" style={styles.storeName}>{store.name}</Text>
                      {store.hasNFT && (
                        <Chip mode="flat" style={styles.nftBadgeSmall}>
                          <Icon name="token" size={10} />
                          <Text style={styles.nftBadgeSmallText}> NFT</Text>
                        </Chip>
                      )}
                    </View>
                    <Text variant="bodySmall" style={styles.storeDescription}>{store.description}</Text>
                    <View style={styles.storeFooter}>
                      <View style={styles.ratingContainer}>
                        <Icon name="star" size={12} color={theme.colors.nftGold} />
                        <Text variant="bodySmall" style={styles.ratingText}>{store.rating}</Text>
                        <Text variant="bodySmall" style={styles.reviewsText}>({store.reviews} reviews)</Text>
                      </View>
                      <Text variant="bodySmall" style={styles.distanceText}>{store.distance}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Searches */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Trending Searches</Text>
          
          <View style={styles.trendingTags}>
            {['#ActionFigures', '#VintageElectronics', '#TradingCards', '#RareBooks', '#Antiques', '#ModelKits', '#Collectibles', '#RetroGaming'].map((tag) => (
              <Chip key={tag} mode="outlined" style={styles.trendingTag}>
                {tag}
              </Chip>
            ))}
          </View>
        </View>

        {/* Store Stats */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon name="store" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.statNumber}>450+</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Partner Stores</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon name="percent" size={24} color={theme.colors.nftGold} />
                <Text variant="titleMedium" style={styles.statNumber}>35%</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Avg Discount</Text>
              </Card.Content>
            </Card>
            
            <Card style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon name="people" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={styles.statNumber}>12.5K</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Happy Customers</Text>
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
  headerTitle: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerMainTitle: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
  filterBar: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    paddingVertical: theme.spacing.md,
  },
  filterScrollView: {
    paddingHorizontal: theme.spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: theme.colors.onPrimary,
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
  sectionTitle: {
    color: theme.colors.onBackground,
    fontWeight: '600',
  },
  limitedChip: {
    backgroundColor: theme.colors.error,
  },
  featuredCard: {
    marginBottom: theme.spacing.sm,
    elevation: theme.custom.elevation.medium,
  },
  featuredContent: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
  },
  featuredImageContainer: {
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  featuredImage: {
    width: 80,
    height: 80,
    borderRadius: theme.custom.borderRadius.medium,
  },
  nftBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.primary,
    minHeight: 20,
  },
  nftBadgeText: {
    color: theme.colors.onPrimary,
    fontSize: 10,
  },
  featuredDetails: {
    flex: 1,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  storeName: {
    fontWeight: '600',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  storeDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  exclusiveBadge: {
    backgroundColor: theme.colors.tertiary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.custom.borderRadius.medium,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    elevation: theme.custom.elevation.small,
  },
  categoryTitle: {
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  categoryCount: {
    color: theme.colors.onSurfaceVariant,
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    marginLeft: theme.spacing.sm,
  },
  storeCard: {
    marginBottom: theme.spacing.sm,
    elevation: theme.custom.elevation.small,
  },
  storeContent: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
  },
  storeImage: {
    width: 64,
    height: 64,
    borderRadius: theme.custom.borderRadius.small,
    marginRight: theme.spacing.sm,
  },
  storeDetails: {
    flex: 1,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  nftBadgeSmall: {
    backgroundColor: theme.colors.primary,
    minHeight: 18,
  },
  nftBadgeSmallText: {
    color: theme.colors.onPrimary,
    fontSize: 8,
  },
  storeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  reviewsText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  distanceText: {
    color: theme.colors.onSurfaceVariant,
  },
  trendingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  trendingTag: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    elevation: theme.custom.elevation.small,
  },
  statContent: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  statNumber: {
    fontWeight: '600',
    marginVertical: theme.spacing.xs,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
});

export default ExploreScreen;