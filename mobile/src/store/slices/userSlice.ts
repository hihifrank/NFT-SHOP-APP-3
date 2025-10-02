import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';

interface UserProfile {
  id: string;
  walletAddress: string;
  email?: string;
  preferredLanguage: 'zh-HK' | 'zh-CN' | 'en';
  notifications: {
    locationBased: boolean;
    couponReminders: boolean;
    lotteryResults: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId: string) => {
    // This will be implemented when we connect to the backend API
    return {
      id: userId,
      walletAddress: '0x...',
      preferredLanguage: 'zh-HK',
      notifications: {
        locationBased: true,
        couponReminders: true,
        lotteryResults: true,
      },
    } as UserProfile;
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (updates: Partial<UserProfile>) => {
    // This will be implemented when we connect to the backend API
    return updates;
  }
);

export const updateLocation = createAsyncThunk(
  'user/updateLocation',
  async (location: {latitude: number; longitude: number}) => {
    // This will be implemented when we connect to the backend API
    return location;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLanguage: (state, action: PayloadAction<'zh-HK' | 'zh-CN' | 'en'>) => {
      if (state.profile) {
        state.profile.preferredLanguage = action.payload;
      }
    },
    updateNotificationSettings: (
      state,
      action: PayloadAction<Partial<UserProfile['notifications']>>
    ) => {
      if (state.profile) {
        state.profile.notifications = {
          ...state.profile.notifications,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user profile';
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile = {...state.profile, ...action.payload};
        }
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.location = action.payload;
        }
      });
  },
});

export const {clearError, setLanguage, updateNotificationSettings} = userSlice.actions;
export default userSlice.reducer;