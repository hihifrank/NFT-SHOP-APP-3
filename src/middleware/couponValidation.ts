import { body, param, query } from 'express-validator';

/**
 * Validation for creating a new coupon NFT
 */
export const validateCreateCoupon = [
  body('merchantId')
    .isUUID()
    .withMessage('Merchant ID must be a valid UUID'),
  
  body('couponType')
    .isIn(['percentage', 'fixed_amount', 'buy_one_get_one', 'free_item'])
    .withMessage('Coupon type must be one of: percentage, fixed_amount, buy_one_get_one, free_item'),
  
  body('title')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  
  body('titleEn')
    .optional()
    .isLength({ max: 255 })
    .withMessage('English title must not exceed 255 characters'),
  
  body('titleZhCn')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Chinese title must not exceed 255 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('descriptionEn')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('English description must not exceed 1000 characters'),
  
  body('descriptionZhCn')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Chinese description must not exceed 1000 characters'),
  
  body('discountValue')
    .isFloat({ min: 0.01 })
    .withMessage('Discount value must be a positive number'),
  
  body('discountType')
    .isIn(['percentage', 'fixed_amount'])
    .withMessage('Discount type must be either percentage or fixed_amount'),
  
  body('minimumPurchase')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum purchase must be a non-negative number'),
  
  body('maxQuantity')
    .isInt({ min: 1 })
    .withMessage('Max quantity must be a positive integer'),
  
  body('rarity')
    .optional()
    .isIn(['common', 'rare', 'epic', 'legendary'])
    .withMessage('Rarity must be one of: common, rare, epic, legendary'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  
  body('isTransferable')
    .optional()
    .isBoolean()
    .withMessage('isTransferable must be a boolean'),
  
  body('termsAndConditions')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Terms and conditions must not exceed 2000 characters'),

  // Custom validation for discount value based on type
  body('discountValue').custom((value, { req }) => {
    if (req.body.discountType === 'percentage' && (value < 0 || value > 100)) {
      throw new Error('Percentage discount must be between 0 and 100');
    }
    return true;
  })
];

/**
 * Validation for using a coupon
 */
export const validateUseCoupon = [
  param('id')
    .isUUID()
    .withMessage('Coupon ID must be a valid UUID'),
  
  body('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID')
];

/**
 * Validation for transferring a coupon
 */
export const validateTransferCoupon = [
  param('id')
    .isUUID()
    .withMessage('Coupon ID must be a valid UUID'),
  
  body('fromUserId')
    .isUUID()
    .withMessage('From User ID must be a valid UUID'),
  
  body('toUserId')
    .isUUID()
    .withMessage('To User ID must be a valid UUID'),
  
  // Ensure from and to users are different
  body('toUserId').custom((value, { req }) => {
    if (value === req.body.fromUserId) {
      throw new Error('Cannot transfer coupon to the same user');
    }
    return true;
  })
];

/**
 * Validation for coupon ID parameter
 */
export const validateCouponId = [
  param('id')
    .isUUID()
    .withMessage('Coupon ID must be a valid UUID')
];

/**
 * Validation for user ID parameter
 */
export const validateUserId = [
  param('userId')
    .isUUID()
    .withMessage('User ID must be a valid UUID')
];

/**
 * Validation for merchant ID parameter
 */
export const validateMerchantId = [
  param('merchantId')
    .isUUID()
    .withMessage('Merchant ID must be a valid UUID')
];

/**
 * Validation for getting coupons with query parameters
 */
export const validateGetCoupons = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  query('merchantId')
    .optional()
    .isUUID()
    .withMessage('Merchant ID must be a valid UUID'),
  
  query('rarity')
    .optional()
    .isIn(['common', 'rare', 'epic', 'legendary'])
    .withMessage('Rarity must be one of: common, rare, epic, legendary'),
  
  query('minDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum discount must be a non-negative number'),
  
  query('maxDiscount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum discount must be a non-negative number'),
  
  // Custom validation to ensure minDiscount <= maxDiscount
  query('maxDiscount').custom((value, { req }) => {
    if (req.query?.minDiscount && value && parseFloat(value) < parseFloat(req.query.minDiscount as string)) {
      throw new Error('Maximum discount must be greater than or equal to minimum discount');
    }
    return true;
  })
];

/**
 * Validation for image upload
 */
export const validateImageUpload = (req: any, file: any, cb: any) => {
  // Check file type
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'), false);
  }
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return cb(new Error('File size must be less than 5MB'), false);
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Only JPG, JPEG, PNG, GIF, and WebP files are allowed'), false);
  }
  
  cb(null, true);
};

export default {
  validateCreateCoupon,
  validateUseCoupon,
  validateTransferCoupon,
  validateCouponId,
  validateUserId,
  validateMerchantId,
  validateGetCoupons,
  validateImageUpload
};