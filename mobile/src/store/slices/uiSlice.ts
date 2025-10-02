import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface UIState {
  theme: 'light' | 'dark';
  loading: {
    global: boolean;
    wallet: boolean;
    transaction: boolean;
  };
  modals: {
    walletConnect: boolean;
    couponDetail: boolean;
    lotteryDetail: boolean;
    transactionStatus: boolean;
  };
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }>;
  bottomSheet: {
    isOpen: boolean;
    content: 'coupon' | 'merchant' | 'lottery' | null;
    data: any;
  };
}

const initialState: UIState = {
  theme: 'light',
  loading: {
    global: false,
    wallet: false,
    transaction: false,
  },
  modals: {
    walletConnect: false,
    couponDetail: false,
    lotteryDetail: false,
    transactionStatus: false,
  },
  notifications: [],
  bottomSheet: {
    isOpen: false,
    content: null,
    data: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setWalletLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.wallet = action.payload;
    },
    setTransactionLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.transaction = action.payload;
    },
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    addNotification: (
      state,
      action: PayloadAction<{
        type: 'success' | 'error' | 'warning' | 'info';
        message: string;
      }>
    ) => {
      const notification = {
        id: Date.now().toString(),
        ...action.payload,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openBottomSheet: (
      state,
      action: PayloadAction<{
        content: 'coupon' | 'merchant' | 'lottery';
        data: any;
      }>
    ) => {
      state.bottomSheet.isOpen = true;
      state.bottomSheet.content = action.payload.content;
      state.bottomSheet.data = action.payload.data;
    },
    closeBottomSheet: (state) => {
      state.bottomSheet.isOpen = false;
      state.bottomSheet.content = null;
      state.bottomSheet.data = null;
    },
  },
});

export const {
  setTheme,
  setGlobalLoading,
  setWalletLoading,
  setTransactionLoading,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  openBottomSheet,
  closeBottomSheet,
} = uiSlice.actions;

export default uiSlice.reducer;