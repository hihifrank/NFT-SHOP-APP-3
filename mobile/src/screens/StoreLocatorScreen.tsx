import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import LocationService, { Location } from '../services/LocationService';
import MapService, { StoreMarker } from '../services/MapService';
import CustomMapView from '../components/MapView';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTheme } from '../theme';
import { RootState } from '../store';
import { fetchNearbyStores } from '../store/slices/merchantSlice';

interface StoreListItem {
  id: string;
  name: string;
  address: string;
  category: string;
  distance: number;
  isNFTParticipant: boolean;
  latitude: number;
  longitude: number;
  rating?: number;
  isOpen?: boolean;
}

const StoreLocatorScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const { stores, loading } = useSelector((state: RootState) => state.merchants);
  
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [nearbyStores, setNearbyStores] = useState<StoreListItem[]>([]);
  const [searchRadius, setSearchRadius] = useState(5); // km

  const categories = [
    { key: 'all', label: t('stores.categories.all') },
    { key: 'restaurant', label: t('stores.categories.restaurant') },
    { key: 'retail', label: t('stores.categories.retail') },
    { key: 'entertainment', label: t('stores.categories.entertainment') },
    { key: 'service', label: t('stores.categories.service') },
  ];

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      searchNearbyStores();
    }
  }, [userLocation, searchRadius, selectedCategory]);

  const initializeLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert(
        t('location.error'),
        t('location.permissionRequired'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.settings'), onPress: () => {} }, // Open settings
        ]
      );
    }
  };

  const searchNearbyStores = async () => {
    if (!userLocation) return;

    try {
      // Fetch stores from API
      const result: any = await (dispatch as any)(fetchNearbyStores({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: searchRadius,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
      }));

      if (result.payload) {
        // Calculate distances and sort
        const storesWithDistance = LocationService.findNearbyStores(
          userLocation,
          result.payload,
          searchRadius
        );

        setNearbyStores(storesWithDistance as StoreListItem[]);
      }
    } catch (error) {
      console.error('Failed to search nearby stores:', error);
      Alert.alert(t('common.error'), t('stores.searchError'));
    }
  };

  const filteredStores = nearbyStores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mapStores: StoreMarker[] = filteredStores.map((store) => ({
    id: store.id,
    coordinate: {
      latitude: store.latitude,
      longitude: store.longitude,
    },
    title: store.name,
    description: `${store.category} • ${store.distance.toFixed(1)}km`,
    category: store.category,
    isNFTParticipant: store.isNFTParticipant,
  }));

  const onStoreSelect = (store: StoreMarker) => {
    const storeDetails = nearbyStores.find(s => s.id === store.id);
    if (storeDetails) {
      Alert.alert(
        storeDetails.name,
        `${storeDetails.address}\n${t('stores.distance')}: ${storeDetails.distance.toFixed(1)}km`,
        [
          { text: t('common.close'), style: 'cancel' },
          { text: t('stores.viewDetails'), onPress: () => navigateToStore(storeDetails) },
        ]
      );
    }
  };

  const navigateToStore = (store: StoreListItem) => {
    // Navigate to store details screen
    console.log('Navigate to store:', store.id);
  };

  const renderStoreItem = ({ item }: { item: StoreListItem }) => (
    <TouchableOpacity onPress={() => navigateToStore(item)}>
      <Card style={styles.storeCard}>
        <View style={styles.storeHeader}>
          <Text style={styles.storeName}>{item.name}</Text>
          <View style={styles.storeDistance}>
            <Text style={styles.distanceText}>
              {item.distance.toFixed(1)}km
            </Text>
          </View>
        </View>
        
        <Text style={styles.storeAddress}>{item.address}</Text>
        
        <View style={styles.storeFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          {item.isNFTParticipant && (
            <View style={[styles.nftBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.nftText}>NFT</Text>
            </View>
          )}
          
          {item.isOpen !== undefined && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.isOpen ? '#4CAF50' : theme.colors.error }
            ]}>
              <Text style={styles.statusText}>
                {item.isOpen ? t('stores.open') : t('stores.closed')}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderCategoryFilter = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={categories}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === item.key && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedCategory(item.key)}
        >
          <Text
            style={[
              styles.categoryButtonText,
              selectedCategory === item.key && { color: 'white' },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
      style={styles.categoryList}
    />
  );

  return (
    <View style={styles.container}>
      {/* Search and filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('stores.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'map' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setViewMode('map')}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'map' && { color: 'white' },
              ]}
            >
              {t('stores.mapView')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => setViewMode('list')}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === 'list' && { color: 'white' },
              ]}
            >
              {t('stores.listView')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderCategoryFilter()}

      {/* Content */}
      {viewMode === 'map' ? (
        <CustomMapView
          stores={mapStores}
          onStoreSelect={onStoreSelect}
          showUserLocation={true}
          enableOfflineMode={true}
        />
      ) : (
        <FlatList
          data={filteredStores}
          keyExtractor={(item) => item.id}
          renderItem={renderStoreItem}
          style={styles.storeList}
          refreshing={loading}
          onRefresh={searchNearbyStores}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('stores.noStoresFound')}
              </Text>
              <Button
                onPress={() => setSearchRadius(searchRadius + 5)}
                style={styles.expandButton}
              >
                {t('stores.expandSearch')}
              </Button>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryList: {
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  storeList: {
    flex: 1,
    padding: 16,
  },
  storeCard: {
    marginBottom: 12,
    padding: 16,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  storeDistance: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  storeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  nftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  nftText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  expandButton: {
    marginTop: 8,
  },
});

export default StoreLocatorScreen;