import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '../config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HK Retail NFT Platform API',
      version: '1.0.0',
      description: 'API documentation for Hong Kong Retail NFT Coupon Platform',
      contact: {
        name: 'HK Retail NFT Platform Team',
        email: 'support@hk-retail-nft.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.hk-retail-nft.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
                code: {
                  type: 'string',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and wallet connection',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Merchants',
        description: 'Merchant management operations',
      },
      {
        name: 'Coupons',
        description: 'NFT coupon management',
      },
      {
        name: 'Lotteries',
        description: 'Lottery system operations',
      },
      {
        name: 'Stores',
        description: 'Store discovery and management',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };