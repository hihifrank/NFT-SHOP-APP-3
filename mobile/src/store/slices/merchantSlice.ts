import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';

interface Merchant {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  isNftParticipant: boolean;
  image?: string;
  rating?: number;
  distance?: number;
}

interface MerchantState {
  nearbyMerchants: Merchant[];
  allMerchants: Merchant[];
  stores: Merchant[];
  selectedMerchant: Merchant | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
}

const initialState: MerchantState = {
  nearbyMerchants: [],
  allMerchants: [],
  stores: [],
  selectedMerchant: null,
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategory: null,
};

// Async thunks
export const fetchNearbyMerchants = createAsyncThunk(
  'merchants/fetchNearby',
  async (location: {latitude: number; longitude: number; radius: number}) => {
    // This will be implemented when we connect to the backend API
    return [] as Merchant[];
  }
);

export const fetchNearbyStores = createAsyncThunk(
  'merchants/fetchNearbyStores',
  async (params: {
    latitude: number;
    longitude: number;
    radius: number;
    category?: string;
  }) => {
    // Mock data for now - will be replaced with actual API call
    const mockStores: Merchant[] = [
      {
        id: '1',
        name: '茶餐廳 A',
        description: '傳統港式茶餐廳',
        address: '香港中環德輔道中1號',
        latitude: 22.2819,
        longitude: 114.1577,
        category: 'restaurant',
        isNftParticipant: true,
        rating: 4.5,
      },
      {
        id: '2',
        name: '時裝店 B',
        description: '潮流服飾專門店',
        address: '香港銅鑼灣軒尼詩道500號',
        latitude: 22.2793,
        longitude: 114.1847,
        category: 'retail',
        isNftParticipant: false,
        rating: 4.2,
      },
      {
        id: '3',
        name: '咖啡廳 C',
        description: '精品咖啡與輕食',
        address: '香港尖沙咀彌敦道100號',
        latitude: 22.2976,
        longitude: 114.1722,
        category: 'restaurant',
        isNftParticipant: true,
        rating: 4.7,
      },
    ];

    // Filter by category if specified
    let filteredStores = mockStores;
    if (params.category && params.category !== 'all') {
      filteredStores = mockStores.filter(store => store.category === params.category);
    }

    return filteredStores;
  }
);

export const searchMerchants = createAsyncThunk(
  'merchants/search',
  async (query: string) => {
    // This will be implemented when we connect to the backend API
    return [] as Merchant[];
  }
);

const merchantSlice = createSlice({
  name: 'merchants',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedMerchant: (state, action: PayloadAction<Merchant | null>) => {
      state.selectedMerchant = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    clearSearch: (state) => {
      state.searchQuery = '';
      state.selectedCategory = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNearbyMerchants.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNearbyMerchants.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyMerchants = action.payload;
      })
      .addCase(fetchNearbyMerchants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch merchants';
      })
      .addCase(searchMerchants.fulfilled, (state, action) => {
        state.allMerchants = action.payload;
      })
      .addCase(fetchNearbyStores.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNearbyStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload;
      })
      .addCase(fetchNearbyStores.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch nearby stores';
      });
  },
});

export const {
  clearError,
  setSelectedMerchant,
  setSearchQuery,
  setSelectedCategory,
  clearSearch,
} = merchantSlice.actions;
export default merchantSlice.reducer;