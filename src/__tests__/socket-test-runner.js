#!/usr/bin/env node

/**
 * Socket.io Test Runner
 * 
 * This script validates that the Socket.io tests can run properly
 * by checking dependencies and running a basic connection test.
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

console.log('🔌 Socket.io Test Runner - Validating Test Environment');
console.log('================================================');

// Test 1: Check if required modules are available
console.log('\n1. Checking dependencies...');
try {
  require('socket.io');
  console.log('   ✅ socket.io - OK');
} catch (error) {
  console.log('   ❌ socket.io - MISSING');
  process.exit(1);
}

try {
  require('socket.io-client');
  console.log('   ✅ socket.io-client - OK');
} catch (error) {
  console.log('   ❌ socket.io-client - MISSING');
  console.log('   💡 Run: npm install --save-dev socket.io-client@^4.7.4');
  process.exit(1);
}

try {
  require('jsonwebtoken');
  console.log('   ✅ jsonwebtoken - OK');
} catch (error) {
  console.log('   ❌ jsonwebtoken - MISSING');
  process.exit(1);
}

// Test 2: Basic Socket.io server creation
console.log('\n2. Testing Socket.io server creation...');
try {
  const httpServer = createServer();
  const io = new Server(httpServer);
  console.log('   ✅ Socket.io server created successfully');
  httpServer.close();
} catch (error) {
  console.log('   ❌ Failed to create Socket.io server:', error.message);
  process.exit(1);
}

// Test 3: JWT token generation
console.log('\n3. Testing JWT token generation...');
try {
  const token = jwt.sign(
    { userId: 'test-user', walletAddress: '0x123...abc' },
    'test-secret',
    { expiresIn: '1h' }
  );
  
  const decoded = jwt.verify(token, 'test-secret');
  console.log('   ✅ JWT token generation and verification - OK');
  console.log(`   📝 Test token: ${token.substring(0, 50)}...`);
} catch (error) {
  console.log('   ❌ JWT token test failed:', error.message);
  process.exit(1);
}

// Test 4: Basic Socket.io client connection test
console.log('\n4. Testing Socket.io client connection...');

const testConnection = () => {
  return new Promise((resolve, reject) => {
    const httpServer = createServer();
    const io = new Server(httpServer, {
      cors: { origin: "*" }
    });

    // Simple authentication middleware
    io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }
      
      try {
        const decoded = jwt.verify(token, 'test-secret');
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log('   ✅ Client connected successfully');
      socket.emit('welcome', { message: 'Connection test successful' });
      
      socket.on('test-ping', () => {
        socket.emit('test-pong', { timestamp: new Date() });
      });
    });

    httpServer.listen(() => {
      const port = httpServer.address().port;
      
      // Import socket.io-client dynamically
      const { io: Client } = require('socket.io-client');
      
      const token = jwt.sign(
        { userId: 'test-user', walletAddress: '0x123...abc' },
        'test-secret',
        { expiresIn: '1h' }
      );

      const client = Client(`http://localhost:${port}`, {
        auth: { token }
      });

      client.on('connect', () => {
        console.log('   ✅ Authentication successful');
        client.emit('test-ping');
      });

      client.on('welcome', (data) => {
        console.log('   ✅ Welcome message received:', data.message);
      });

      client.on('test-pong', (data) => {
        console.log('   ✅ Ping-pong test successful');
        console.log('   📝 Response time:', new Date() - new Date(data.timestamp), 'ms');
        
        client.disconnect();
        httpServer.close();
        resolve();
      });

      client.on('connect_error', (error) => {
        console.log('   ❌ Connection failed:', error.message);
        httpServer.close();
        reject(error);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('   ❌ Connection test timed out');
        client.disconnect();
        httpServer.close();
        reject(new Error('Connection test timeout'));
      }, 5000);
    });
  });
};

testConnection()
  .then(() => {
    console.log('\n🎉 All tests passed! Socket.io test environment is ready.');
    console.log('\n📋 Next steps:');
    console.log('   • Run: npm test -- --testPathPattern="socket.*test\\.ts"');
    console.log('   • Or run individual test files:');
    console.log('     - npm test src/__tests__/socket-service.test.ts');
    console.log('     - npm test src/__tests__/socket-api-integration.test.ts');
    console.log('     - npm test src/__tests__/socket-e2e.test.ts');
    console.log('\n📚 Documentation: src/__tests__/SOCKET_TESTS_README.md');
  })
  .catch((error) => {
    console.log('\n❌ Test environment validation failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Ensure all dependencies are installed: npm install');
    console.log('   • Install socket.io-client: npm install --save-dev socket.io-client@^4.7.4');
    console.log('   • Check network connectivity and firewall settings');
    process.exit(1);
  });