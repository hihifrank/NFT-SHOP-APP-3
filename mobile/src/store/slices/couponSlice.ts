import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';

interface CouponNFT {
  id: string;
  tokenId: string;
  merchantId: string;
  merchantName: string;
  couponType: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed_amount';
  expiryDate: string;
  isUsed: boolean;
  metadataUri: string;
  image?: string;
}

interface CouponState {
  ownedCoupons: CouponNFT[];
  availableCoupons: CouponNFT[];
  loading: boolean;
  error: string | null;
}

const initialState: CouponState = {
  ownedCoupons: [],
  availableCoupons: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchOwnedCoupons = createAsyncThunk(
  'coupons/fetchOwned',
  async (userId: string) => {
    // This will be implemented when we connect to the backend API
    return [] as CouponNFT[];
  }
);

export const fetchAvailableCoupons = createAsyncThunk(
  'coupons/fetchAvailable',
  async () => {
    // This will be implemented when we connect to the backend API
    return [] as CouponNFT[];
  }
);

export const useCoupon = createAsyncThunk(
  'coupons/use',
  async (couponId: string) => {
    // This will be implemented when we connect to the backend API
    return couponId;
  }
);

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addCoupon: (state, action: PayloadAction<CouponNFT>) => {
      state.ownedCoupons.push(action.payload);
    },
    removeCoupon: (state, action: PayloadAction<string>) => {
      state.ownedCoupons = state.ownedCoupons.filter(
        coupon => coupon.id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnedCoupons.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOwnedCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.ownedCoupons = action.payload;
      })
      .addCase(fetchOwnedCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch coupons';
      })
      .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
        state.availableCoupons = action.payload;
      })
      .addCase(useCoupon.fulfilled, (state, action) => {
        const couponIndex = state.ownedCoupons.findIndex(
          coupon => coupon.id === action.payload
        );
        if (couponIndex !== -1) {
          state.ownedCoupons[couponIndex].isUsed = true;
        }
      });
  },
});

export const {clearError, addCoupon, removeCoupon} = couponSlice.actions;
export default couponSlice.reducer;