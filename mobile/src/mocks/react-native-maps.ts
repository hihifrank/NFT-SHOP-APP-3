// Mock implementation for react-native-maps
import React from 'react';
import { View, ViewProps } from 'react-native';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
  onPress?: () => void;
}

export const PROVIDER_GOOGLE = 'google';

export const Marker: React.FC<MarkerProps> = () => null;

interface MapViewProps extends ViewProps {
  provider?: string;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  showsScale?: boolean;
  loadingEnabled?: boolean;
  loadingIndicatorColor?: string;
  loadingBackgroundColor?: string;
  children?: React.ReactNode;
}

const MapView = React.forwardRef<View, MapViewProps>((props, ref) => {
  return <View ref={ref} {...props} style={[{ flex: 1, backgroundColor: '#e0e0e0' }, props.style]} />;
});

MapView.displayName = 'MapView';

export default MapView;