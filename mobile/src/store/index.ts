import {configureStore} from '@reduxjs/toolkit';
import {useDispatch, useSelector, TypedUseSelectorHook} from 'react-redux';

import authSlice from './slices/authSlice';
import userSlice from './slices/userSlice';
import couponSlice from './slices/couponSlice';
import merchantSlice from './slices/merchantSlice';
import lotterySlice from './slices/lotterySlice';
import uiSlice from './slices/uiSlice';
import web3Slice from './slices/web3Slice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    coupons: couponSlice,
    merchants: merchantSlice,
    lotteries: lotterySlice,
    ui: uiSlice,
    web3: web3Slice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;