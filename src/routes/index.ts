import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import merchantRoutes from './merchants';
import couponRoutes from './coupons';
import lotteryRoutes from './lotteries';
import storeRoutes from './stores';

const router = Router();

// API version 1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/merchants', merchantRoutes);
router.use('/coupons', couponRoutes);
router.use('/lotteries', lotteryRoutes);
router.use('/stores', storeRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'HK Retail NFT Platform API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        merchants: '/api/v1/merchants',
        coupons: '/api/v1/coupons',
        lotteries: '/api/v1/lotteries',
        stores: '/api/v1/stores',
        docs: '/api/docs',
      },
    },
  });
});

export default router;