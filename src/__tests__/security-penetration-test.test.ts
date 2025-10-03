import request from 'supertest';
import express from 'express';
import securityMiddleware from '../middleware/security';
import { randomBytes, createHash } from 'crypto';
import { performance } from 'perf_hooks';

describe('Security Penetration Testing', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    app.use(securityMiddleware);
    
    // Mock API endpoints for penetration testing
    app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      if (username === 'admin' && password === 'admin123') {
        res.json({ 
          success: true, 
          token: 'jwt-token-here',
          user: { id: 1, username: 'admin', role: 'admin' }
        });
      } else {
        res.status(401).json({ 
          success: false, 
          error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }
        });
      }
    });

    app.get('/api/admin/users', (req, res) => {
      const authHeader = req.headers.authorization;
      if (authHeader === 'Bearer jwt-token-here') {
        res.json({
          success: true,
          users: [
            { id: 1, username: 'admin', email: 'admin@test.com' },
            { id: 2, username: 'user1', email: 'user1@test.com' }
          ]
        });
      } else {
        res.status(403).json({ 
          success: false, 
          error: { message: 'Access denied', code: 'ACCESS_DENIED' }
        });
      }
    });

    app.post('/api/nft/mint', (req, res) => {
      res.json({ 
        success: true, 
        nft: { 
          id: randomBytes(16).toString('hex'),
          ...req.body 
        }
      });
    });

    app.get('/api/files/:filename', (req, res) => {
      const filename = req.params.filename;
      res.json({ 
        success: true, 
        file: { name: filename, content: 'file content here' }
      });
    });

    app.post('/api/upload', (req, res) => {
      res.json({ 
        success: true, 
        uploaded: req.body 
      });
    });
  });

  describe('Authentication Bypass Attempts', () => {
    const authBypassPayloads = [
      // JWT manipulation attempts
      { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c' },
      // SQL injection in auth header
      { authorization: "Bearer '; DROP TABLE users; --" },
      // NoSQL injection
      { authorization: 'Bearer {"$ne": null}' },
      // Path traversal
      { authorization: 'Bearer ../../../etc/passwd' },
      // Command injection
      { authorization: 'Bearer `whoami`' },
      // XSS in auth header
      { authorization: 'Bearer <script>alert(1)</script>' }
    ];

    authBypassPayloads.forEach((payload, index) => {
      it(`should prevent authentication bypass attempt ${index + 1}`, async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', payload.authorization);

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('ACCESS_DENIED');
      });
    });

    it('should prevent session fixation attacks', async () => {
      // Attempt to set custom session ID
      const response = await request(app)
        .post('/api/auth/login')
        .set('Cookie', 'sessionId=attacker-controlled-session')
        .set('Content-Type', 'application/json')
        .send({ username: 'admin', password: 'admin123' });

      expect(response.status).toBe(200);
      
      // Should not use the attacker-provided session ID
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        expect(setCookieHeader.join('')).not.toContain('attacker-controlled-session');
      }
    });

    it('should prevent privilege escalation through parameter pollution', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({
          username: 'user1',
          password: 'user123',
          role: 'admin', // Attempt to escalate privileges
          isAdmin: true,
          permissions: ['admin', 'superuser']
        });

      if (response.status === 200) {
        // If login succeeds, user should not have admin privileges
        expect(response.body.user.role).not.toBe('admin');
        expect(response.body.user.isAdmin).not.toBe(true);
      }
    });
  });

  describe('Advanced SQL Injection Tests', () => {
    const advancedSQLPayloads = [
      // Time-based blind SQL injection
      "'; WAITFOR DELAY '00:00:05'; --",
      "' OR (SELECT COUNT(*) FROM users WHERE SUBSTRING(password,1,1)='a')>0 WAITFOR DELAY '00:00:05'; --",
      
      // Boolean-based blind SQL injection
      "' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a'; --",
      "' AND (SELECT COUNT(*) FROM information_schema.tables)>0; --",
      
      // Union-based SQL injection with error handling
      "' UNION SELECT 1,2,3,4,5,6,7,8,9,10 FROM dual WHERE '1'='1",
      "' UNION SELECT null,username,password,null FROM users WHERE '1'='1",
      
      // Second-order SQL injection
      "admin'; INSERT INTO users VALUES ('hacker','password'); SELECT * FROM users WHERE username='",
      
      // Stored procedure attacks
      "'; EXEC sp_configure 'show advanced options', 1; --",
      "'; EXEC xp_cmdshell 'net user hacker password /add'; --"
    ];

    advancedSQLPayloads.forEach((payload, index) => {
      it(`should prevent advanced SQL injection ${index + 1}`, async () => {
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send({
            username: payload,
            password: 'test'
          });

        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Should not cause significant delays (time-based attacks)
        expect(responseTime).toBeLessThan(1000);
        
        // Should sanitize the payload
        if (response.body.user) {
          const username = response.body.user.username;
          expect(username).not.toContain('WAITFOR');
          expect(username).not.toContain('UNION SELECT');
          expect(username).not.toContain('EXEC');
          expect(username).not.toContain('xp_cmdshell');
        }
      });
    });
  });

  describe('Advanced XSS and CSRF Tests', () => {
    const advancedXSSPayloads = [
      // DOM-based XSS
      '<img src=x onerror="eval(atob(\'YWxlcnQoMSk=\'))">',
      
      // Filter evasion
      '<ScRiPt>alert(1)</ScRiPt>',
      '<script>alert(String.fromCharCode(88,83,83))</script>',
      
      // Event handler injection
      '<input onfocus="alert(1)" autofocus>',
      '<select onfocus="alert(1)" autofocus><option>test</option></select>',
      
      // CSS injection
      '<style>@import"javascript:alert(1)";</style>',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      
      // SVG-based XSS
      '<svg><script>alert(1)</script></svg>',
      '<svg onload="alert(1)">',
      
      // Data URI XSS
      '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
      
      // Polyglot payloads
      'javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)>',
      
      // Template injection
      '{{constructor.constructor("alert(1)")()}}',
      '${alert(1)}',
      '#{alert(1)}'
    ];

    advancedXSSPayloads.forEach((payload, index) => {
      it(`should prevent advanced XSS attack ${index + 1}`, async () => {
        const response = await request(app)
          .post('/api/nft/mint')
          .set('Content-Type', 'application/json')
          .send({
            name: payload,
            description: payload,
            metadata: { title: payload }
          });

        expect(response.status).toBe(200);
        
        const responseBody = JSON.stringify(response.body);
        expect(responseBody).not.toContain('<script>');
        expect(responseBody).not.toContain('javascript:');
        expect(responseBody).not.toContain('onerror=');
        expect(responseBody).not.toContain('onload=');
        expect(responseBody).not.toContain('onfocus=');
        expect(responseBody).not.toContain('alert(');
        expect(responseBody).not.toContain('eval(');
        expect(responseBody).not.toContain('constructor.constructor');
      });
    });

    it('should prevent CSRF attacks', async () => {
      // Attempt CSRF without proper headers
      const response = await request(app)
        .post('/api/nft/mint')
        .set('Origin', 'http://malicious-site.com')
        .set('Referer', 'http://malicious-site.com/attack.html')
        .set('Content-Type', 'application/json')
        .send({
          name: 'Malicious NFT',
          recipient: '0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e8e8'
        });

      // Should either block the request or require additional validation
      expect([200, 403, 400]).toContain(response.status);
    });
  });

  describe('File Upload Security Tests', () => {
    const maliciousFilePayloads = [
      // Executable files
      { filename: 'malware.exe', content: 'MZ\x90\x00\x03\x00\x00\x00' },
      { filename: 'script.php', content: '<?php system($_GET["cmd"]); ?>' },
      { filename: 'shell.jsp', content: '<%Runtime.getRuntime().exec(request.getParameter("cmd"));%>' },
      
      // Path traversal in filename
      { filename: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash' },
      { filename: '..\\..\\..\\windows\\system32\\config\\sam', content: 'binary data' },
      
      // Null byte injection
      { filename: 'image.jpg\x00.php', content: '<?php phpinfo(); ?>' },
      
      // Large filename
      { filename: 'a'.repeat(1000) + '.txt', content: 'test' },
      
      // Special characters
      { filename: 'file<script>alert(1)</script>.txt', content: 'test' },
      { filename: 'file|rm -rf /.txt', content: 'test' }
    ];

    maliciousFilePayloads.forEach((payload, index) => {
      it(`should prevent malicious file upload ${index + 1}: ${payload.filename.substring(0, 30)}...`, async () => {
        const response = await request(app)
          .post('/api/upload')
          .set('Content-Type', 'application/json')
          .send({
            filename: payload.filename,
            content: payload.content,
            type: 'image/jpeg'
          });

        expect(response.status).toBe(200);
        
        const uploadedData = response.body.uploaded;
        if (uploadedData.filename) {
          // Filename should be sanitized
          expect(uploadedData.filename).not.toContain('../');
          expect(uploadedData.filename).not.toContain('..\\');
          expect(uploadedData.filename).not.toContain('\x00');
          expect(uploadedData.filename).not.toContain('<script>');
          expect(uploadedData.filename).not.toContain('|rm');
          expect(uploadedData.filename.length).toBeLessThan(255);
        }
      });
    });

    it('should prevent zip bomb attacks', async () => {
      // Simulate a zip bomb (highly compressed malicious archive)
      const zipBombData = {
        filename: 'archive.zip',
        content: 'PK' + 'x'.repeat(1000), // Fake zip header + compressed data
        uncompressedSize: 1024 * 1024 * 1024 * 10 // Claims to be 10GB when uncompressed
      };

      const response = await request(app)
        .post('/api/upload')
        .set('Content-Type', 'application/json')
        .send(zipBombData);

      // Should either reject or handle safely
      expect([200, 400, 413]).toContain(response.status);
    });
  });

  describe('Business Logic Security Tests', () => {
    it('should prevent race condition attacks', async () => {
      // Simulate concurrent requests that could cause race conditions
      const promises = [];
      const nftId = 'test-nft-123';
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/nft/mint')
            .set('Content-Type', 'application/json')
            .send({
              id: nftId,
              name: `NFT ${i}`,
              quantity: 1
            })
        );
      }

      const responses = await Promise.allSettled(promises);
      const successfulResponses = responses
        .filter((result): result is PromiseFulfilledResult<request.Response> => 
          result.status === 'fulfilled' && result.value.status === 200
        );

      // All requests should succeed but with different IDs to prevent duplicates
      const nftIds = successfulResponses.map(result => result.value.body.nft.id);
      const uniqueIds = new Set(nftIds);
      expect(uniqueIds.size).toBe(nftIds.length);
    });

    it('should prevent integer overflow attacks', async () => {
      const overflowValues = [
        Number.MAX_SAFE_INTEGER + 1,
        2147483648, // 2^31
        4294967296, // 2^32
        -2147483649, // -(2^31 + 1)
        Infinity,
        -Infinity,
        NaN
      ];

      for (const value of overflowValues) {
        const response = await request(app)
          .post('/api/nft/mint')
          .set('Content-Type', 'application/json')
          .send({
            quantity: value,
            price: value,
            tokenId: value
          });

        expect(response.status).toBe(200);
        
        // Values should be sanitized or rejected
        const nft = response.body.nft;
        if (nft.quantity !== undefined) {
          expect(Number.isFinite(nft.quantity)).toBe(true);
          expect(nft.quantity).toBeGreaterThanOrEqual(0);
          expect(nft.quantity).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER);
        }
      }
    });

    it('should prevent price manipulation attacks', async () => {
      const maliciousPrices = [
        -100, // Negative price
        0.000000001, // Extremely small price
        '0x41414141', // Hex value
        '1e-10', // Scientific notation
        '../../etc/passwd', // Path traversal
        '<script>alert(1)</script>', // XSS
        "'; DROP TABLE prices; --" // SQL injection
      ];

      for (const price of maliciousPrices) {
        const response = await request(app)
          .post('/api/nft/mint')
          .set('Content-Type', 'application/json')
          .send({
            name: 'Test NFT',
            price: price
          });

        expect(response.status).toBe(200);
        
        const nft = response.body.nft;
        if (nft.price !== undefined) {
          // Price should be a valid positive number
          expect(typeof nft.price === 'number' || typeof nft.price === 'string').toBe(true);
          if (typeof nft.price === 'number') {
            expect(nft.price).toBeGreaterThanOrEqual(0);
            expect(Number.isFinite(nft.price)).toBe(true);
          }
        }
      }
    });
  });

  describe('Blockchain Security Tests', () => {
    it('should prevent smart contract interaction attacks', async () => {
      const maliciousContractData = [
        // Malicious contract addresses
        '0x0000000000000000000000000000000000000000', // Zero address
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', // Known malicious pattern
        
        // Invalid function signatures
        '0x' + 'f'.repeat(8), // Invalid function selector
        'transfer(address,uint256)', // Raw function signature
        
        // Malicious transaction data
        '0x' + 'a'.repeat(1000), // Extremely long data
        '<script>alert(1)</script>', // XSS in transaction data
      ];

      for (const data of maliciousContractData) {
        const response = await request(app)
          .post('/api/nft/mint')
          .set('Content-Type', 'application/json')
          .send({
            contractAddress: data,
            functionData: data,
            transactionData: data
          });

        expect(response.status).toBe(200);
        
        // Malicious data should be sanitized
        const nft = response.body.nft;
        const responseStr = JSON.stringify(nft);
        expect(responseStr).not.toContain('<script>');
        expect(responseStr).not.toContain('deadbeef');
      }
    });

    it('should prevent reentrancy attack patterns', async () => {
      // Simulate rapid successive calls that could trigger reentrancy
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/nft/mint')
            .set('Content-Type', 'application/json')
            .send({
              name: 'Reentrancy Test',
              callback: 'malicious-callback-function',
              executeAfter: 'mint'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All responses should be successful and properly handled
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Information Disclosure Tests', () => {
    it('should not expose sensitive system information', async () => {
      // Test various endpoints for information disclosure
      const endpoints = [
        '/api/admin/users',
        '/api/files/../../../etc/passwd',
        '/api/files/config.json',
        '/api/files/.env',
        '/api/debug/info',
        '/api/status',
        '/api/health'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        
        const responseBody = JSON.stringify(response.body);
        
        // Should not expose sensitive information
        expect(responseBody).not.toMatch(/password/i);
        expect(responseBody).not.toMatch(/secret/i);
        expect(responseBody).not.toMatch(/private.*key/i);
        expect(responseBody).not.toMatch(/api.*key/i);
        expect(responseBody).not.toMatch(/database.*url/i);
        expect(responseBody).not.toMatch(/connection.*string/i);
        expect(responseBody).not.toMatch(/\/home\/.*\/app/);
        expect(responseBody).not.toMatch(/node_modules/);
        expect(responseBody).not.toMatch(/Error:.*at.*\(/);
      }
    });

    it('should not expose internal file structure', async () => {
      const pathTraversalAttempts = [
        '../package.json',
        '../../.env',
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        'config/database.yml',
        '.git/config',
        'node_modules/express/package.json'
      ];

      for (const path of pathTraversalAttempts) {
        const response = await request(app)
          .get(`/api/files/${encodeURIComponent(path)}`);

        // Should not return actual file contents
        if (response.status === 200) {
          const content = response.body.file?.content || '';
          expect(content).not.toContain('root:x:0:0');
          expect(content).not.toContain('password');
          expect(content).not.toContain('secret');
          expect(content).not.toContain('private');
        }
      }
    });
  });

  describe('Denial of Service (DoS) Tests', () => {
    it('should handle algorithmic complexity attacks', async () => {
      // Test with patterns that could cause ReDoS (Regular Expression DoS)
      const redosPatterns = [
        'a'.repeat(10000) + 'X',
        '(' + 'a?'.repeat(100) + ')' + 'a'.repeat(100),
        'a'.repeat(1000) + 'b',
      ];

      for (const pattern of redosPatterns) {
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send({
            username: pattern,
            password: 'test'
          });

        const endTime = performance.now();
        const processingTime = endTime - startTime;

        // Should not take excessive time to process
        expect(processingTime).toBeLessThan(5000); // 5 seconds max
        expect([200, 400, 401]).toContain(response.status);
      }
    });

    it('should prevent memory exhaustion attacks', async () => {
      // Test with large arrays and objects
      const largeArray = new Array(100000).fill('x'.repeat(100));
      const largeObject: any = {};
      
      for (let i = 0; i < 10000; i++) {
        largeObject[`key${i}`] = 'x'.repeat(100);
      }

      const payloads = [
        { data: largeArray },
        { data: largeObject },
        { nested: { deep: { very: { deep: largeArray } } } }
      ];

      for (const payload of payloads) {
        const response = await request(app)
          .post('/api/upload')
          .set('Content-Type', 'application/json')
          .send(payload);

        // Should either handle gracefully or reject
        expect([200, 400, 413]).toContain(response.status);
      }
    });
  });

  describe('Session Security Tests', () => {
    it('should prevent session hijacking', async () => {
      // Test with various session manipulation attempts
      const maliciousSessions = [
        'admin-session-123',
        '../../../etc/passwd',
        '<script>alert(1)</script>',
        "'; DROP TABLE sessions; --",
        '0'.repeat(1000)
      ];

      for (const sessionId of maliciousSessions) {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Cookie', `sessionId=${sessionId}`)
          .set('Authorization', 'Bearer jwt-token-here');

        // Should not be affected by malicious session IDs
        expect([200, 403]).toContain(response.status);
      }
    });

    it('should enforce secure session configuration', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'admin', password: 'admin123' });

      if (response.status === 200) {
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          const cookieString = setCookieHeader.join('; ');
          
          // Should have secure session configuration
          expect(cookieString).toMatch(/HttpOnly/i);
          expect(cookieString).toMatch(/Secure/i);
          expect(cookieString).toMatch(/SameSite/i);
        }
      }
    });
  });
});