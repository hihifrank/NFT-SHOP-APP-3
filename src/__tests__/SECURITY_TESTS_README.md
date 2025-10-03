# Security Testing Suite

This comprehensive security testing suite implements vulnerability scanning and penetration testing for the Hong Kong Retail NFT Platform. The tests cover all major security aspects including OWASP Top 10, GDPR compliance, and blockchain-specific security concerns.

## Overview

The security testing suite consists of four main components:

1. **Vulnerability Scanning** - Automated detection of common security vulnerabilities
2. **Penetration Testing** - Simulated attacks to test system defenses
3. **Compliance Testing** - Verification of regulatory and standards compliance
4. **Comprehensive Security Tests** - End-to-end security validation

## Test Files

### Core Test Files

- `security-vulnerability-scan.test.ts` - Basic vulnerability scanning tests
- `security-penetration-test.test.ts` - Advanced penetration testing scenarios
- `security-audit-compliance.test.ts` - Compliance and audit tests
- `security-comprehensive.test.ts` - Comprehensive security validation

### Supporting Files

- `security-test-runner.js` - Test orchestration and reporting
- `security-config.ts` - Configuration and utilities
- `SECURITY_TESTS_README.md` - This documentation file

## Security Test Categories

### 1. Vulnerability Scanning Tests

#### SQL Injection Tests
- Basic SQL injection patterns
- Union-based SQL injection
- Boolean-based blind SQL injection
- Time-based blind SQL injection
- Error-based SQL injection
- Second-order SQL injection
- Stored procedure attacks

#### Cross-Site Scripting (XSS) Tests
- Reflected XSS
- Stored XSS
- DOM-based XSS
- Filter evasion techniques
- Event handler injection
- CSS injection
- SVG-based XSS
- Data URI XSS
- Polyglot payloads

#### Command Injection Tests
- Basic command injection
- Advanced command injection
- Windows command injection
- Encoded command injection

#### Path Traversal Tests
- Basic path traversal
- Encoded path traversal
- Absolute path traversal
- Null byte injection

#### NoSQL Injection Tests
- MongoDB injection patterns
- Complex NoSQL injection
- JavaScript injection in NoSQL

### 2. Penetration Testing

#### Authentication Bypass Tests
- JWT manipulation attempts
- SQL injection in auth headers
- NoSQL injection in authentication
- Path traversal in auth
- Command injection in auth
- XSS in auth headers
- Session fixation attacks
- Privilege escalation attempts

#### Advanced Attack Simulations
- Time-based blind SQL injection
- Boolean-based blind SQL injection
- Union-based SQL injection with error handling
- Second-order SQL injection
- Stored procedure attacks
- Advanced XSS filter evasion
- CSRF attacks
- File upload security tests
- Business logic attacks
- Race condition attacks
- Integer overflow attacks
- Price manipulation attacks

#### Blockchain-Specific Tests
- Smart contract interaction attacks
- Reentrancy attack patterns
- Wallet address validation
- Transaction parameter validation
- Gas manipulation tests

### 3. Compliance Testing

#### OWASP Top 10 (2021) Compliance
- **A01:2021 - Broken Access Control**
- **A02:2021 - Cryptographic Failures**
- **A03:2021 - Injection**
- **A04:2021 - Insecure Design**
- **A05:2021 - Security Misconfiguration**
- **A06:2021 - Vulnerable and Outdated Components**
- **A07:2021 - Identification and Authentication Failures**
- **A08:2021 - Software and Data Integrity Failures**
- **A09:2021 - Security Logging and Monitoring Failures**
- **A10:2021 - Server-Side Request Forgery (SSRF)**

#### GDPR Compliance Tests
- Data portability (Article 20)
- Right to erasure (Article 17)
- Privacy policy access (Article 12)
- Data minimization principles
- Consent management
- Data retention policies

#### Hong Kong Privacy Law Compliance
- Personal Data (Privacy) Ordinance compliance
- Cross-border data transfer restrictions
- Data protection principles

#### Blockchain Security Standards
- Smart contract security standards
- DeFi attack vector prevention
- NFT security best practices

### 4. Comprehensive Security Tests

#### Automated Security Scanning
- Security header validation
- Common attack pattern detection
- Fuzzing attack handling
- Performance security tests
- ReDoS (Regular Expression DoS) prevention
- High-frequency request handling
- Memory exhaustion prevention

#### API Security
- Rate limiting and abuse prevention
- Progressive rate limiting
- Bot traffic detection
- API abuse pattern prevention
- Content type validation
- Request size monitoring

#### Data Privacy and Protection
- Data anonymization
- Consent management
- Data retention policy enforcement
- Sensitive data exposure prevention

#### Security Monitoring
- Suspicious activity detection
- Security metrics collection
- Alert generation
- Integration security
- Supply chain attack prevention

## Running Security Tests

### Individual Test Suites

```bash
# Run vulnerability scanning tests
npm test security-vulnerability-scan.test.ts

# Run penetration testing
npm test security-penetration-test.test.ts

# Run compliance tests
npm test security-audit-compliance.test.ts

# Run comprehensive security tests
npm test security-comprehensive.test.ts
```

### Complete Security Test Suite

```bash
# Run all security tests with reporting
node src/__tests__/security-test-runner.js

# Run with verbose output
NODE_ENV=test node src/__tests__/security-test-runner.js
```

### Test Configuration

The security tests can be configured through `security-config.ts`:

```typescript
export const securityConfig = {
  timeout: 300000, // 5 minutes per test suite
  vulnerabilityScanning: {
    enabled: true,
    payloadSets: ['sql-injection', 'xss', 'command-injection'],
    maxPayloadSize: 10000
  },
  penetrationTesting: {
    enabled: true,
    aggressiveMode: false,
    targetEndpoints: ['/api/auth/*', '/api/user/*']
  },
  compliance: {
    owasp: true,
    gdpr: true,
    hongKongPrivacy: true
  }
};
```

## Security Test Results

### Test Output

The security test runner generates comprehensive reports including:

- Test execution summary
- Vulnerability findings
- Compliance status
- Security recommendations
- Detailed issue descriptions

### Report Generation

Security test reports are generated in JSON format and include:

```json
{
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00.000Z",
    "testRunner": "SecurityTestRunner",
    "version": "1.0.0"
  },
  "summary": {
    "totalTests": 4,
    "passed": 3,
    "failed": 1,
    "criticalIssues": 0,
    "warnings": 2
  },
  "recommendations": [
    {
      "priority": "HIGH",
      "category": "RATE_LIMITING",
      "description": "Configure proper rate limiting",
      "action": "Implement progressive rate limiting"
    }
  ],
  "complianceStatus": {
    "owasp": "COMPLIANT",
    "gdpr": "PARTIAL",
    "hongKongPrivacy": "COMPLIANT"
  }
}
```

## Security Test Payloads

The test suite includes comprehensive payload collections:

### SQL Injection Payloads
- Basic injection patterns
- Union-based attacks
- Blind injection techniques
- Time-based attacks
- Error-based attacks

### XSS Payloads
- Script injection
- Event handler injection
- CSS-based XSS
- SVG injection
- Filter evasion techniques

### Command Injection Payloads
- Unix/Linux commands
- Windows commands
- Encoded payloads

### Path Traversal Payloads
- Directory traversal
- Encoded traversal
- Null byte injection

## Security Assertions

The test suite provides security-specific assertions:

```typescript
// Assert no SQL injection vulnerabilities
SecurityAssertions.assertNoSQLInjection(response);

// Assert no XSS vulnerabilities
SecurityAssertions.assertNoXSS(response);

// Assert proper security headers
SecurityAssertions.assertSecurityHeaders(headers);

// Assert no sensitive data exposure
SecurityAssertions.assertNoSensitiveDataExposure(response);
```

## Best Practices

### Test Development
1. Use realistic attack payloads
2. Test both positive and negative cases
3. Validate security controls are working
4. Test edge cases and boundary conditions
5. Include performance impact testing

### Test Execution
1. Run security tests in isolated environment
2. Use dedicated test data
3. Monitor system resources during testing
4. Review test results thoroughly
5. Address critical issues immediately

### Continuous Security Testing
1. Integrate security tests into CI/CD pipeline
2. Run security tests on every deployment
3. Monitor for new vulnerability patterns
4. Update test payloads regularly
5. Conduct periodic manual security reviews

## Security Requirements Coverage

The security tests validate compliance with requirements:

- **Requirement 6.1**: NFT交易安全性 - Blockchain transaction security
- **Requirement 6.2**: 用戶身份驗證 - User authentication and authorization
- **Requirement 6.3**: 數據隱私保護 - Data privacy protection

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout values in configuration
   - Check system resources
   - Reduce payload size or count

2. **False Positives**
   - Review test assertions
   - Update payload patterns
   - Adjust sensitivity settings

3. **Performance Issues**
   - Run tests sequentially instead of parallel
   - Reduce concurrent request count
   - Monitor memory usage

### Debug Mode

Enable verbose logging for detailed test execution:

```bash
DEBUG=security-tests node src/__tests__/security-test-runner.js
```

## Security Test Maintenance

### Regular Updates
- Update vulnerability payloads monthly
- Review and update compliance tests quarterly
- Add new attack patterns as they emerge
- Update security assertions based on findings

### Payload Management
- Maintain payload effectiveness
- Remove outdated attack patterns
- Add emerging threat patterns
- Validate payload accuracy

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run security tests
        run: node src/__tests__/security-test-runner.js
      - name: Upload security report
        uses: actions/upload-artifact@v2
        with:
          name: security-report
          path: src/__tests__/security-test-report.json
```

## Conclusion

This comprehensive security testing suite provides thorough validation of the Hong Kong Retail NFT Platform's security posture. Regular execution of these tests helps ensure the platform remains secure against evolving threats and maintains compliance with relevant regulations and standards.

For questions or issues with the security tests, please refer to the project documentation or contact the security team.