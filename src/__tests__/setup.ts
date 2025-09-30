// Global test setup

// Set test environment
process.env.NODE_ENV = 'test';

// Global cleanup after all tests
afterAll(async () => {
  // Force cleanup of any remaining handles
  await new Promise(resolve => setTimeout(resolve, 100));
});