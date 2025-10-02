import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import Web3Service, {WalletConnection, TransactionStatus} from '../../services/Web3Service';

export interface NFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  contractAddress: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface Transaction {
  hash: string;
  type: 'purchase' | 'use' | 'transfer';
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  timestamp: number;
  tokenId?: string;
  amount?: string;
}

interface Web3State {
  isConnected: boolean;
  walletAddress: string | null;
  chainId: number | null;
  balance: string | null;
  nfts: NFT[];
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  connectionType: 'metamask' | 'walletconnect' | null;
}

const initialState: Web3State = {
  isConnected: false,
  walletAddress: null,
  chainId: null,
  balance: null,
  nfts: [],
  transactions: [],
  loading: false,
  error: null,
  connectionType: null,
};

// Async thunks
export const connectMetaMask = createAsyncThunk(
  'web3/connectMetaMask',
  async (_, {rejectWithValue}) => {
    try {
      const connection = await Web3Service.connectMetaMask();
      return {
        ...connection,
        connectionType: 'metamask' as const,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to connect MetaMask');
    }
  }
);

export const connectWalletConnect = createAsyncThunk(
  'web3/connectWalletConnect',
  async (_, {rejectWithValue}) => {
    try {
      const connection = await Web3Service.connectWalletConnect();
      return {
        ...connection,
        connectionType: 'walletconnect' as const,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to connect WalletConnect');
    }
  }
);

export const disconnectWallet = createAsyncThunk(
  'web3/disconnectWallet',
  async (_, {rejectWithValue}) => {
    try {
      await Web3Service.disconnectWallet();
      return null;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to disconnect wallet');
    }
  }
);

export const loadStoredConnection = createAsyncThunk(
  'web3/loadStoredConnection',
  async (_, {rejectWithValue}) => {
    try {
      const connection = await Web3Service.getStoredWalletConnection();
      return connection;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load stored connection');
    }
  }
);

export const fetchUserNFTs = createAsyncThunk(
  'web3/fetchUserNFTs',
  async (address: string, {rejectWithValue}) => {
    try {
      const nfts = await Web3Service.getUserNFTs(address);
      return nfts;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch NFTs');
    }
  }
);

export const purchaseNFT = createAsyncThunk(
  'web3/purchaseNFT',
  async ({tokenId, price}: {tokenId: string; price: string}, {rejectWithValue}) => {
    try {
      const txStatus = await Web3Service.purchaseNFT(tokenId, price);
      return {
        ...txStatus,
        type: 'purchase' as const,
        timestamp: Date.now(),
        tokenId,
        amount: price,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to purchase NFT');
    }
  }
);

export const useCouponNFT = createAsyncThunk(
  'web3/useCouponNFT',
  async (tokenId: string, {rejectWithValue}) => {
    try {
      const txStatus = await Web3Service.useCouponNFT(tokenId);
      return {
        ...txStatus,
        type: 'use' as const,
        timestamp: Date.now(),
        tokenId,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to use coupon NFT');
    }
  }
);

export const transferNFT = createAsyncThunk(
  'web3/transferNFT',
  async ({to, tokenId}: {to: string; tokenId: string}, {rejectWithValue}) => {
    try {
      const txStatus = await Web3Service.transferNFT(to, tokenId);
      return {
        ...txStatus,
        type: 'transfer' as const,
        timestamp: Date.now(),
        tokenId,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to transfer NFT');
    }
  }
);

export const updateTransactionStatus = createAsyncThunk(
  'web3/updateTransactionStatus',
  async (txHash: string, {rejectWithValue}) => {
    try {
      const status = await Web3Service.getTransactionStatus(txHash);
      return status;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update transaction status');
    }
  }
);

export const fetchBalance = createAsyncThunk(
  'web3/fetchBalance',
  async (address: string, {rejectWithValue}) => {
    try {
      const balance = await Web3Service.getBalance(address);
      return balance;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch balance');
    }
  }
);

const web3Slice = createSlice({
  name: 'web3',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTransactionInState: (state, action: PayloadAction<{hash: string; status: TransactionStatus}>) => {
      const {hash, status} = action.payload;
      const txIndex = state.transactions.findIndex(tx => tx.hash === hash);
      if (txIndex !== -1) {
        state.transactions[txIndex] = {
          ...state.transactions[txIndex],
          ...status,
        };
      }
    },
    removeTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(tx => tx.hash !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect MetaMask
      .addCase(connectMetaMask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectMetaMask.fulfilled, (state, action) => {
        state.loading = false;
        state.isConnected = true;
        state.walletAddress = action.payload.address;
        state.chainId = action.payload.chainId;
        state.connectionType = action.payload.connectionType;
      })
      .addCase(connectMetaMask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Connect WalletConnect
      .addCase(connectWalletConnect.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectWalletConnect.fulfilled, (state, action) => {
        state.loading = false;
        state.isConnected = true;
        state.walletAddress = action.payload.address;
        state.chainId = action.payload.chainId;
        state.connectionType = action.payload.connectionType;
      })
      .addCase(connectWalletConnect.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Disconnect wallet
      .addCase(disconnectWallet.fulfilled, (state) => {
        state.isConnected = false;
        state.walletAddress = null;
        state.chainId = null;
        state.balance = null;
        state.nfts = [];
        state.transactions = [];
        state.connectionType = null;
      })
      
      // Load stored connection
      .addCase(loadStoredConnection.fulfilled, (state, action) => {
        if (action.payload) {
          state.isConnected = true;
          state.walletAddress = action.payload.address;
          state.chainId = action.payload.chainId;
        }
      })
      
      // Fetch user NFTs
      .addCase(fetchUserNFTs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserNFTs.fulfilled, (state, action) => {
        state.loading = false;
        state.nfts = action.payload;
      })
      .addCase(fetchUserNFTs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Purchase NFT
      .addCase(purchaseNFT.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      
      // Use coupon NFT
      .addCase(useCouponNFT.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      
      // Transfer NFT
      .addCase(transferNFT.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      
      // Fetch balance
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      });
  },
});

export const {clearError, updateTransactionInState, removeTransaction} = web3Slice.actions;
export default web3Slice.reducer;