import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';

interface Lottery {
  id: string;
  name: string;
  description: string;
  entryFee: number;
  totalPrizes: number;
  remainingPrizes: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  prizes: string[];
}

interface LotteryParticipation {
  lotteryId: string;
  participationTime: string;
  result?: 'won' | 'lost';
  prize?: string;
}

interface LotteryState {
  activeLotteries: Lottery[];
  participationHistory: LotteryParticipation[];
  loading: boolean;
  error: string | null;
}

const initialState: LotteryState = {
  activeLotteries: [],
  participationHistory: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchActiveLotteries = createAsyncThunk(
  'lotteries/fetchActive',
  async () => {
    // This will be implemented when we connect to the backend API
    return [] as Lottery[];
  }
);

export const participateInLottery = createAsyncThunk(
  'lotteries/participate',
  async (lotteryId: string) => {
    // This will be implemented when we connect to the backend API
    return {
      lotteryId,
      participationTime: new Date().toISOString(),
    } as LotteryParticipation;
  }
);

export const fetchParticipationHistory = createAsyncThunk(
  'lotteries/fetchHistory',
  async (userId: string) => {
    // This will be implemented when we connect to the backend API
    return [] as LotteryParticipation[];
  }
);

const lotterySlice = createSlice({
  name: 'lotteries',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateLotteryResult: (
      state,
      action: PayloadAction<{lotteryId: string; result: 'won' | 'lost'; prize?: string}>
    ) => {
      const participation = state.participationHistory.find(
        p => p.lotteryId === action.payload.lotteryId
      );
      if (participation) {
        participation.result = action.payload.result;
        participation.prize = action.payload.prize;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveLotteries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveLotteries.fulfilled, (state, action) => {
        state.loading = false;
        state.activeLotteries = action.payload;
      })
      .addCase(fetchActiveLotteries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch lotteries';
      })
      .addCase(participateInLottery.fulfilled, (state, action) => {
        state.participationHistory.push(action.payload);
      })
      .addCase(fetchParticipationHistory.fulfilled, (state, action) => {
        state.participationHistory = action.payload;
      });
  },
});

export const {clearError, updateLotteryResult} = lotterySlice.actions;
export default lotterySlice.reducer;