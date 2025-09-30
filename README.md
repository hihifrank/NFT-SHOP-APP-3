# HK Retail NFT Platform

A blockchain-based NFT coupon platform for Hong Kong retail businesses, combining traditional coupons with NFT digital assets to create a unique shopping experience for tourists and locals.

## Features

- 🎫 **NFT Coupons**: Digital coupons as collectible NFTs with real utility
- 🎰 **Lottery System**: Fair and transparent lottery system using blockchain
- 🏪 **Store Discovery**: Find participating and non-participating retail stores
- 🌐 **Multi-language**: Support for Traditional Chinese, Simplified Chinese, and English
- 📱 **Mobile-first**: Optimized for mobile devices with offline capabilities
- 🔒 **Secure**: Blockchain-based security with wallet integration

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Redis caching
- **Blockchain**: Polygon network, Web3.js, Solidity
- **Storage**: IPFS for NFT metadata
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hk-retail-nft-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start with Docker Compose:
```bash
docker-compose up -d
```

5. Or run locally:
```bash
npm run dev
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## API Endpoints

### Health Check
- `GET /health` - Application health status

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/verify` - Verify JWT token

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/nfts` - Get user's NFTs
- `GET /api/v1/users/transactions` - Get user's transaction history

### Merchants
- `POST /api/v1/merchants/register` - Register merchant
- `GET /api/v1/merchants/profile` - Get merchant profile
- `PUT /api/v1/merchants/profile` - Update merchant profile
- `POST /api/v1/merchants/coupons` - Create coupon
- `GET /api/v1/merchants/analytics` - Get merchant analytics

### Coupons
- `POST /api/v1/coupons/use` - Use a coupon
- `POST /api/v1/coupons/transfer` - Transfer NFT coupon
- `GET /api/v1/coupons/:id` - Get coupon details
- `POST /api/v1/coupons/validate` - Validate coupon

### Lotteries
- `GET /api/v1/lotteries/active` - Get active lotteries
- `POST /api/v1/lotteries/participate` - Participate in lottery
- `GET /api/v1/lotteries/history` - Get lottery history
- `GET /api/v1/lotteries/:id/results` - Get lottery results

### Stores
- `GET /api/v1/stores/search` - Search stores
- `GET /api/v1/stores/nearby` - Get nearby stores
- `GET /api/v1/stores/:id` - Get store details
- `GET /api/v1/stores/recommendations` - Get recommended stores

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # API route handlers
├── models/          # Database models
├── repositories/    # Data access layer
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `NODE_ENV`: Environment (development/staging/production)
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret for JWT token signing
- `DB_*`: Database connection settings
- `REDIS_*`: Redis connection settings
- `BLOCKCHAIN_*`: Blockchain network configuration

## Docker Support

The application includes full Docker support with multi-stage builds:

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

Services included:
- **app**: Main Node.js application
- **postgres**: PostgreSQL database
- **redis**: Redis cache
- **pgadmin**: Database admin interface (dev profile)
- **redis-commander**: Redis admin interface (dev profile)

## Testing

The project uses Jest for testing with TypeScript support:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.