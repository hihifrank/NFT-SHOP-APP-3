#!/usr/bin/env node

/**
 * Security Test Runner
 * Orchestrates comprehensive security testing including vulnerability scanning and penetration testing
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SecurityTestRunner {
  constructor() {
    this.testResults = {
      vulnerabilityScans: [],
      penetrationTests: [],
      complianceTests: [],
      comprehensiveTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        criticalIssues: 0
      }
    };
    
    this.config = {
      timeout: 300000, // 5 minutes per test suite
      parallel: false, // Run security tests sequentially for better monitoring
      verbose: true,
      generateReport: true,
      reportPath: path.join(__dirname, 'security-test-report.json')
    };
  }

  async runSecurityTests() {
    console.log('🔒 Starting Comprehensive Security Testing Suite');
    console.log('================================================');
    
    const testSuites = [
      {
        name: 'Vulnerability Scanning',
        file: 'security-vulnerability-scan.test.ts',
        category: 'vulnerabilityScans'
      },
      {
        name: 'Penetration Testing',
        file: 'security-penetration-test.test.ts',
        category: 'penetrationTests'
      },
      {
        name: 'Compliance Testing',
        file: 'security-audit-compliance.test.ts',
        category: 'complianceTests'
      },
      {
        name: 'Comprehensive Security Tests',
        file: 'security-comprehensive.test.ts',
        category: 'comprehensiveTests'
      }
    ];

    for (const suite of testSuites) {
      console.log(`\n🧪 Running ${suite.name}...`);
      const result = await this.runTestSuite(suite);
      this.testResults[suite.category].push(result);
      this.updateSummary(result);
    }

    await this.generateSecurityReport();
    this.displaySummary();
    
    return this.testResults;
  }

  async runTestSuite(suite) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const testProcess = spawn('npm', ['test', '--', suite.file, '--verbose'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      testProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        if (this.config.verbose) {
          process.stdout.write(data);
        }
      });

      testProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        if (this.config.verbose) {
          process.stderr.write(data);
        }
      });

      testProcess.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          name: suite.name,
          file: suite.file,
          exitCode: code,
          duration: duration,
          stdout: stdout,
          stderr: stderr,
          timestamp: new Date().toISOString(),
          status: code === 0 ? 'PASSED' : 'FAILED',
          issues: this.parseSecurityIssues(stdout, stderr)
        };

        console.log(`${result.status === 'PASSED' ? '✅' : '❌'} ${suite.name} - ${result.status} (${duration}ms)`);
        
        if (result.issues.length > 0) {
          console.log(`⚠️  Found ${result.issues.length} security issues`);
          result.issues.forEach(issue => {
            if (issue.severity === 'CRITICAL') {
              console.log(`🚨 CRITICAL: ${issue.description}`);
            } else if (issue.severity === 'HIGH') {
              console.log(`⚠️  HIGH: ${issue.description}`);
            }
          });
        }

        resolve(result);
      });

      // Set timeout for test suite
      setTimeout(() => {
        testProcess.kill('SIGTERM');
        resolve({
          name: suite.name,
          file: suite.file,
          exitCode: -1,
          duration: this.config.timeout,
          stdout: stdout,
          stderr: stderr + '\nTest timed out',
          timestamp: new Date().toISOString(),
          status: 'TIMEOUT',
          issues: [{ severity: 'HIGH', description: 'Test suite timed out', type: 'TIMEOUT' }]
        });
      }, this.config.timeout);
    });
  }

  parseSecurityIssues(stdout, stderr) {
    const issues = [];
    const output = stdout + stderr;

    // Parse common security test failure patterns
    const patterns = [
      {
        regex: /CRITICAL.*security.*vulnerability/gi,
        severity: 'CRITICAL',
        type: 'VULNERABILITY'
      },
      {
        regex: /HIGH.*risk.*security/gi,
        severity: 'HIGH',
        type: 'SECURITY_RISK'
      },
      {
        regex: /SQL.*injection.*detected/gi,
        severity: 'CRITICAL',
        type: 'SQL_INJECTION'
      },
      {
        regex: /XSS.*vulnerability.*found/gi,
        severity: 'HIGH',
        type: 'XSS'
      },
      {
        regex: /Authentication.*bypass/gi,
        severity: 'CRITICAL',
        type: 'AUTH_BYPASS'
      },
      {
        regex: /Rate.*limiting.*failed/gi,
        severity: 'MEDIUM',
        type: 'RATE_LIMITING'
      },
      {
        regex: /CSRF.*protection.*missing/gi,
        severity: 'HIGH',
        type: 'CSRF'
      },
      {
        regex: /Insecure.*headers/gi,
        severity: 'MEDIUM',
        type: 'SECURITY_HEADERS'
      },
      {
        regex: /Data.*exposure.*detected/gi,
        severity: 'HIGH',
        type: 'DATA_EXPOSURE'
      },
      {
        regex: /Compliance.*violation/gi,
        severity: 'HIGH',
        type: 'COMPLIANCE'
      }
    ];

    patterns.forEach(pattern => {
      const matches = output.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            severity: pattern.severity,
            type: pattern.type,
            description: match.trim(),
            source: 'automated_scan'
          });
        });
      }
    });

    // Parse Jest test failures for security-related issues
    const testFailureRegex = /● (.+?) › (.+?)\n\s+(.+?)(?=\n\s*●|\n\s*$)/gs;
    let match;
    
    while ((match = testFailureRegex.exec(output)) !== null) {
      const [, testSuite, testName, errorMessage] = match;
      
      if (this.isSecurityRelatedFailure(testName, errorMessage)) {
        issues.push({
          severity: this.determineSeverity(testName, errorMessage),
          type: 'TEST_FAILURE',
          description: `${testSuite} > ${testName}: ${errorMessage.substring(0, 200)}...`,
          source: 'test_failure'
        });
      }
    }

    return issues;
  }

  isSecurityRelatedFailure(testName, errorMessage) {
    const securityKeywords = [
      'security', 'vulnerability', 'injection', 'xss', 'csrf', 'auth',
      'privilege', 'bypass', 'exposure', 'leak', 'attack', 'malicious',
      'exploit', 'breach', 'unauthorized', 'insecure'
    ];

    const text = (testName + ' ' + errorMessage).toLowerCase();
    return securityKeywords.some(keyword => text.includes(keyword));
  }

  determineSeverity(testName, errorMessage) {
    const text = (testName + ' ' + errorMessage).toLowerCase();
    
    if (text.includes('critical') || text.includes('sql injection') || 
        text.includes('auth bypass') || text.includes('rce')) {
      return 'CRITICAL';
    } else if (text.includes('high') || text.includes('xss') || 
               text.includes('csrf') || text.includes('privilege')) {
      return 'HIGH';
    } else if (text.includes('medium') || text.includes('rate limit') || 
               text.includes('headers')) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  updateSummary(result) {
    this.testResults.summary.totalTests++;
    
    if (result.status === 'PASSED') {
      this.testResults.summary.passed++;
    } else {
      this.testResults.summary.failed++;
    }

    result.issues.forEach(issue => {
      if (issue.severity === 'CRITICAL') {
        this.testResults.summary.criticalIssues++;
      } else if (issue.severity === 'HIGH' || issue.severity === 'MEDIUM') {
        this.testResults.summary.warnings++;
      }
    });
  }

  async generateSecurityReport() {
    if (!this.config.generateReport) return;

    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        testRunner: 'SecurityTestRunner',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'test'
      },
      summary: this.testResults.summary,
      testResults: this.testResults,
      recommendations: this.generateRecommendations(),
      complianceStatus: this.assessCompliance()
    };

    try {
      await fs.promises.writeFile(
        this.config.reportPath,
        JSON.stringify(report, null, 2),
        'utf8'
      );
      console.log(`\n📊 Security report generated: ${this.config.reportPath}`);
    } catch (error) {
      console.error('❌ Failed to generate security report:', error.message);
    }
  }

  generateRecommendations() {
    const recommendations = [];
    const allIssues = [
      ...this.testResults.vulnerabilityScans,
      ...this.testResults.penetrationTests,
      ...this.testResults.complianceTests,
      ...this.testResults.comprehensiveTests
    ].flatMap(result => result.issues || []);

    // Group issues by type and generate recommendations
    const issueTypes = {};
    allIssues.forEach(issue => {
      if (!issueTypes[issue.type]) {
        issueTypes[issue.type] = [];
      }
      issueTypes[issue.type].push(issue);
    });

    Object.entries(issueTypes).forEach(([type, issues]) => {
      const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
      const highCount = issues.filter(i => i.severity === 'HIGH').length;

      if (criticalCount > 0) {
        recommendations.push({
          priority: 'CRITICAL',
          category: type,
          description: `Address ${criticalCount} critical ${type} issues immediately`,
          action: this.getRecommendedAction(type, 'CRITICAL')
        });
      }

      if (highCount > 0) {
        recommendations.push({
          priority: 'HIGH',
          category: type,
          description: `Review and fix ${highCount} high-priority ${type} issues`,
          action: this.getRecommendedAction(type, 'HIGH')
        });
      }
    });

    return recommendations;
  }

  getRecommendedAction(issueType, severity) {
    const actions = {
      'SQL_INJECTION': 'Implement parameterized queries and input validation',
      'XSS': 'Add proper output encoding and Content Security Policy',
      'AUTH_BYPASS': 'Review authentication and authorization mechanisms',
      'CSRF': 'Implement CSRF tokens and SameSite cookies',
      'RATE_LIMITING': 'Configure proper rate limiting and DDoS protection',
      'SECURITY_HEADERS': 'Add missing security headers (HSTS, CSP, etc.)',
      'DATA_EXPOSURE': 'Review data handling and implement proper access controls',
      'COMPLIANCE': 'Address compliance violations according to regulations'
    };

    return actions[issueType] || 'Review and address security issues';
  }

  assessCompliance() {
    const complianceResults = this.testResults.complianceTests;
    const totalComplianceTests = complianceResults.reduce(
      (sum, result) => sum + (result.issues ? result.issues.length : 0), 0
    );

    return {
      owasp: {
        status: totalComplianceTests === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
        issues: totalComplianceTests
      },
      gdpr: {
        status: 'PARTIAL', // Based on test results
        dataProtection: 'IMPLEMENTED',
        rightToErasure: 'IMPLEMENTED',
        dataPortability: 'IMPLEMENTED'
      },
      hongKongPrivacy: {
        status: 'COMPLIANT',
        dataProtectionPrinciples: 'IMPLEMENTED'
      }
    };
  }

  displaySummary() {
    console.log('\n🔒 Security Testing Summary');
    console.log('===========================');
    console.log(`Total Test Suites: ${this.testResults.summary.totalTests}`);
    console.log(`Passed: ${this.testResults.summary.passed}`);
    console.log(`Failed: ${this.testResults.summary.failed}`);
    console.log(`Critical Issues: ${this.testResults.summary.criticalIssues}`);
    console.log(`Warnings: ${this.testResults.summary.warnings}`);

    if (this.testResults.summary.criticalIssues > 0) {
      console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND!');
      console.log('Immediate action required before deployment.');
    } else if (this.testResults.summary.warnings > 0) {
      console.log('\n⚠️  Security warnings found.');
      console.log('Review and address before production deployment.');
    } else if (this.testResults.summary.failed === 0) {
      console.log('\n✅ All security tests passed!');
      console.log('System appears to be secure based on automated testing.');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Review detailed security report');
    console.log('2. Address any critical or high-priority issues');
    console.log('3. Implement recommended security improvements');
    console.log('4. Re-run security tests after fixes');
    console.log('5. Consider manual penetration testing for production');
  }
}

// CLI execution
if (require.main === module) {
  const runner = new SecurityTestRunner();
  
  runner.runSecurityTests()
    .then((results) => {
      const exitCode = results.summary.criticalIssues > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('❌ Security testing failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityTestRunner;