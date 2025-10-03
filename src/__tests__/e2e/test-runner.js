#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting End-to-End Test Suite for HK Retail NFT Platform');
console.log('=' .repeat(60));

// Test configuration
const testConfig = {
  timeout: 300000, // 5 minutes per test suite
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
};

// Test suites to run
const testSuites = [
  {
    name: 'User Journey Tests',
    file: 'user-journey.test.ts',
    description: 'Complete user flow from registration to coupon usage'
  },
  {
    name: 'Cross-Platform Compatibility Tests',
    file: 'cross-platform.test.ts',
    description: 'Mobile app, web browser, and API compatibility'
  },
  {
    name: 'Performance and Load Tests',
    file: 'performance.test.ts',
    description: 'Response times, concurrent requests, and resource usage'
  }
];

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: testSuites.length,
  details: []
};

async function runTestSuite(suite) {
  console.log(`\n📋 Running: ${suite.name}`);
  console.log(`📝 Description: ${suite.description}`);
  console.log('-'.repeat(40));

  const startTime = Date.now();
  
  try {
    const command = `npx jest src/__tests__/e2e/${suite.file} --testTimeout=${testConfig.timeout} --verbose --detectOpenHandles --forceExit`;
    
    console.log(`⚡ Executing: ${command}`);
    
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });

    const duration = Date.now() - startTime;
    
    console.log(`✅ ${suite.name} PASSED (${duration}ms)`);
    console.log(output);
    
    results.passed++;
    results.details.push({
      name: suite.name,
      status: 'PASSED',
      duration,
      output
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.log(`❌ ${suite.name} FAILED (${duration}ms)`);
    console.error(error.stdout || error.message);
    
    results.failed++;
    results.details.push({
      name: suite.name,
      status: 'FAILED',
      duration,
      error: error.stdout || error.message
    });
  }
}

async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  try {
    // Check if required dependencies are installed
    execSync('npm list jest supertest', { stdio: 'pipe' });
    console.log('✅ Test dependencies verified');
    
    // Check if test database is available
    if (process.env.NODE_ENV !== 'test') {
      console.log('⚠️  Warning: NODE_ENV is not set to "test"');
    }
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created logs directory');
    }
    
    console.log('✅ Test environment setup complete');
    
  } catch (error) {
    console.error('❌ Test environment setup failed:', error.message);
    process.exit(1);
  }
}

async function generateTestReport() {
  console.log('\n📊 Generating Test Report...');
  console.log('=' .repeat(60));
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      successRate: ((results.passed / results.total) * 100).toFixed(2) + '%'
    },
    details: results.details,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV || 'development'
    }
  };

  // Save report to file
  const reportPath = path.join(process.cwd(), 'test-reports', 'e2e-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log(`📈 Test Summary:`);
  console.log(`   Total Tests: ${report.summary.total}`);
  console.log(`   Passed: ${report.summary.passed} ✅`);
  console.log(`   Failed: ${report.summary.failed} ❌`);
  console.log(`   Success Rate: ${report.summary.successRate}`);
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return report;
}

async function runHealthCheck() {
  console.log('🏥 Running pre-test health check...');
  
  try {
    // Check if the application can start
    const { createTestApp } = require('../setup');
    const app = await createTestApp();
    
    if (app && typeof app.close === 'function') {
      await app.close();
    }
    
    console.log('✅ Application health check passed');
    
  } catch (error) {
    console.error('❌ Application health check failed:', error.message);
    console.log('💡 Make sure all dependencies are installed and configured');
    process.exit(1);
  }
}

async function main() {
  try {
    // Setup
    await setupTestEnvironment();
    await runHealthCheck();
    
    console.log(`\n🎯 Running ${testSuites.length} test suites...`);
    
    // Run each test suite
    for (const suite of testSuites) {
      await runTestSuite(suite);
    }
    
    // Generate report
    const report = await generateTestReport();
    
    // Exit with appropriate code
    if (results.failed > 0) {
      console.log('\n❌ Some tests failed. Check the report for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Test runner failed:', error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Test run interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Test run terminated');
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});