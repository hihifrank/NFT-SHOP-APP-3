import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';

interface User {
  id: string;
  walletAddress: string;
  email?: string;
  preferredLanguage: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Async thunks for authentication
export const connectWallet = createAsyncThunk(
  'auth/connectWallet',
  async (walletAddress: string) => {
    // This will be implemented when we add Web3 functionality
    return {
      id: 'temp-id',
      walletAddress,
      preferredLanguage: 'zh-HK',
    };
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  // Clear any stored tokens or wallet connections
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(connectWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to connect wallet';
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const {clearError, setUser} = authSlice.actions;
export default authSlice.reducer;