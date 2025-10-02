import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from '../mocks/react-native-maps';
import { useTranslation } from 'react-i18next';
import LocationService, { Location } from '../services/LocationService';
import MapService, { StoreMarker, MapRegion } from '../services/MapService';
import { useTheme } from '../theme';
import Button from './Button';
import ErrorMessage from './ErrorMessage';

interface Props {
  stores: StoreMarker[];
  onStoreSelect?: (store: StoreMarker) => void;
  showUserLocation?: boolean;
  enableOfflineMode?: boolean;
  initialRegion?: MapRegion;
}

const CustomMapView: React.FC<Props> = ({
  stores,
  onStoreSelect,
  showUserLocation = true,
  enableOfflineMode = true,
  initialRegion,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const mapRef = useRef<any>(null);
  
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [region, setRegion] = useState<Region>(
    initialRegion || MapService.getHongKongRegion()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>('');

  useEffect(() => {
    initializeMap();
    return () => {
      LocationService.stopWatchingLocation();
    };
  }, []);

  const initializeMap = async () => {
    try {
      setIsLoading(true);
      
      // Initialize map service
      await MapService.initialize();
      
      // Get user location if enabled
      if (showUserLocation) {
        await getCurrentLocation();
      }
      
      // Check offline cache status
      if (enableOfflineMode) {
        await checkCacheStatus();
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setError(t('map.initializationError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
      
      // Center map on user location
      const newRegion = {
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert(
        t('map.locationError'),
        t('map.locationErrorMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.retry'), onPress: getCurrentLocation },
        ]
      );
    }
  };

  const checkCacheStatus = async () => {
    try {
      const isAreaCached = await MapService.isAreaCached(region);
      const cacheSize = await MapService.getCacheSize();
      
      setIsOfflineMode(isAreaCached);
      setCacheStatus(
        isAreaCached 
          ? t('map.offlineAvailable', { size: formatBytes(cacheSize) })
          : t('map.offlineNotAvailable')
      );
    } catch (error) {
      console.error('Failed to check cache status:', error);
    }
  };

  const downloadOfflineMap = async () => {
    try {
      setIsLoading(true);
      Alert.alert(
        t('map.downloadOfflineMap'),
        t('map.downloadOfflineMapMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.download'),
            onPress: async () => {
              try {
                await MapService.cacheMapRegion(region);
                await checkCacheStatus();
                Alert.alert(t('common.success'), t('map.offlineMapDownloaded'));
              } catch (error) {
                Alert.alert(t('common.error'), t('map.downloadError'));
              }
            },
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearOfflineCache = async () => {
    try {
      Alert.alert(
        t('map.clearCache'),
        t('map.clearCacheMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.clear'),
            style: 'destructive',
            onPress: async () => {
              await MapService.clearCache();
              await checkCacheStatus();
              Alert.alert(t('common.success'), t('map.cacheCleared'));
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('map.clearCacheError'));
    }
  };

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    if (enableOfflineMode) {
      checkCacheStatus();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMarkerColor = (store: StoreMarker): string => {
    return store.isNFTParticipant ? theme.colors.primary : theme.colors.secondary;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ErrorMessage message={error} />
        <Button
          onPress={initializeMap}
          style={styles.retryButton}
        >
          {t('common.retry')}
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        loadingIndicatorColor={theme.colors.primary}
        loadingBackgroundColor={theme.colors.background}
      >
        {/* Store markers */}
        {stores.map((store) => (
          <Marker
            key={store.id}
            coordinate={store.coordinate}
            title={store.title}
            description={store.description}
            pinColor={getMarkerColor(store)}
            onPress={() => onStoreSelect?.(store)}
          />
        ))}
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title={t('map.yourLocation')}
            pinColor={theme.colors.accent}
          />
        )}
      </MapView>

      {/* Offline controls */}
      {enableOfflineMode && (
        <View style={styles.offlineControls}>
          <View style={styles.cacheStatus}>
            <Text style={styles.cacheStatusText}>
              {cacheStatus}
            </Text>
          </View>
          
          <View style={styles.offlineButtons}>
            <Button
              onPress={downloadOfflineMap}
              style={styles.offlineButton}
              disabled={isLoading}
            >
              {t('map.downloadArea')}
            </Button>
            
            <Button
              onPress={clearOfflineCache}
              style={styles.offlineButton}
              disabled={isLoading}
            >
              {t('map.clearCache')}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  retryButton: {
    marginTop: 16,
  },
  offlineControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
  },
  cacheStatus: {
    marginBottom: 8,
  },
  offlineButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  offlineButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  cacheStatusText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CustomMapView;