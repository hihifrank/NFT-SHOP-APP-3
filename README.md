# HK Retail NFT Platform

A comprehensive blockchain-based NFT coupon platform for Hong Kong retail businesses, enabling merchants to create, distribute, and manage NFT coupons while providing customers with an innovative shopping experience.

## 🌟 Features

### Core Functionality
- **NFT Coupon System**: Create, mint, and manage NFT-based discount coupons
- **Wallet Integration**: Support for MetaMask, WalletConnect, and other Web3 wallets
- **Geolocation Services**: Find nearby participating stores and merchants
- **Lottery System**: Engage customers with NFT lottery campaigns
- **Multi-language Support**: English, Traditional Chinese, and Simplified Chinese
- **Real-time Communication**: Live notifications and updates via Socket.IO

### Technical Features
- **Blockchain Integration**: Built on Polygon network for low-cost transactions
- **IPFS Storage**: Decentralized metadata and image storage
- **Security First**: Comprehensive security measures and monitoring
- **Mobile App**: React Native app for iOS and Android
- **Scalable Architecture**: Microservices-ready with Kubernetes deployment
- **Monitoring & Logging**: Complete observability stack with Prometheus and Grafana

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Frontend  │    │   Admin Panel   │
│  (React Native) │    │     (React)     │    │     (React)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │    (Express.js + TS)      │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────┴───────┐    ┌─────────┴───────┐    ┌─────────┴───────┐
│   PostgreSQL    │    │   Redis Cache   │    │   Blockchain    │
│   (Database)    │    │   (Sessions)    │    │   (Polygon)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/hk-retail-nft-platform.git
   cd hk-retail-nft-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd mobile && npm install && cd ..
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Mobile App Setup

```bash
cd mobile

# iOS
npx pod-install ios
npm run ios

# Android
npm run android
```

## 📱 Mobile App

The React Native mobile app provides a seamless user experience with:

- Wallet connection and management
- Store discovery with map integration
- NFT coupon browsing and purchasing
- Push notifications
- Offline functionality
- Multi-language support

### Key Features
- **Store Locator**: Find nearby participating stores
- **NFT Collection**: View and manage owned NFT coupons
- **Coupon Usage**: Redeem coupons at merchant locations
- **Lottery Participation**: Join NFT lottery campaigns
- **Profile Management**: User preferences and settings

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run all tests
npm run test:unit       # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests
npm run test:coverage   # Test coverage

# Blockchain
npm run compile         # Compile smart contracts
npm run test:contracts  # Test smart contracts
npm run deploy:local    # Deploy to local network
npm run deploy:mumbai   # Deploy to Mumbai testnet
npm run deploy:polygon  # Deploy to Polygon mainnet

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database

# Deployment
npm run docker:build    # Build Docker image
npm run deploy:staging  # Deploy to staging
npm run deploy:production # Deploy to production
```

### Project Structure

```
├── src/                    # Backend source code
│   ├── controllers/        # API controllers
│   ├── services/          # Business logic
│   ├── repositories/      # Data access layer
│   ├── middleware/        # Express middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── __tests__/        # Test files
├── mobile/               # React Native mobile app
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── screens/      # App screens
│   │   ├── services/     # API and business logic
│   │   ├── store/        # Redux store
│   │   └── utils/        # Utility functions
├── contracts/            # Smart contracts
├── k8s/                 # Kubernetes manifests
├── monitoring/          # Monitoring configuration
├── scripts/             # Deployment scripts
└── docs/               # Documentation
```

## 🔐 Security

The platform implements comprehensive security measures:

- **Authentication**: JWT tokens with wallet signature verification
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting and DDoS protection
- **HTTPS Enforcement**: SSL/TLS encryption
- **Security Headers**: Helmet.js security headers
- **Data Privacy**: GDPR compliance with data export/deletion
- **Monitoring**: Security event logging and alerting

## 📊 Monitoring & Observability

### Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation
- **AlertManager**: Alert routing and notification

### Key Metrics
- API response times and error rates
- Database performance
- Blockchain transaction status
- User engagement metrics
- System resource usage

### Health Checks
- `/health` - Basic health check
- `/health/ready` - Readiness probe
- `/api/v1/monitoring/metrics` - Application metrics

## 🚢 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Build production image
npm run docker:build

# Run production container
npm run docker:run
```

### Kubernetes Deployment

```bash
# Apply all Kubernetes resources
kubectl apply -f k8s/

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Rollback deployment
npm run rollback
```

### CI/CD Pipeline

The project includes a complete CI/CD pipeline with GitHub Actions:

- Automated testing (unit, integration, E2E)
- Security scanning
- Docker image building
- Kubernetes deployment
- Monitoring and alerting

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: API and service integration
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability and penetration testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:security

# Run with coverage
npm run test:coverage
```

## 🌍 Internationalization

The platform supports multiple languages:

- **English** (en)
- **Traditional Chinese** (zh-HK)
- **Simplified Chinese** (zh-CN)

Language switching is available in both web and mobile interfaces.

## 📚 API Documentation

API documentation is available at `/api/docs` when running the server. The API follows RESTful conventions with comprehensive OpenAPI/Swagger documentation.

### Key Endpoints
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/stores/nearby` - Find nearby stores
- `POST /api/v1/coupons/create` - Create NFT coupon
- `POST /api/v1/coupons/{id}/purchase` - Purchase NFT
- `POST /api/v1/lotteries/create` - Create lottery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow security guidelines
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Check the [documentation](docs/)
- Review the [API documentation](/api/docs)

## 🙏 Acknowledgments

- OpenZeppelin for smart contract libraries
- Polygon network for blockchain infrastructure
- IPFS for decentralized storage
- React Native community for mobile development tools