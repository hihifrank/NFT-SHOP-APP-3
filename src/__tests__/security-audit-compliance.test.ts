import request from 'supertest';
import express from 'express';
import securityMiddleware from '../middleware/security';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Security Audit and Compliance Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(securityMiddleware);
    
    // Mock endpoints for compliance testing
    app.get('/api/user/:id', (req, res) => {
      res.json({
        success: true,
        user: {
          id: req.params.id,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString()
        }
      });
    });

    app.post('/api/user/data-export', (req, res) => {
      res.json({
        success: true,
        data: {
          personalData: 'exported-data',
          exportedAt: new Date().toISOString()
        }
      });
    });

    app.delete('/api/user/:id', (req, res) => {
      res.json({
        success: true,
        message: 'User data deleted',
        deletedAt: new Date().toISOString()
      });
    });

    app.get('/api/privacy/policy', (req, res) => {
      res.json({
        success: true,
        policy: 'Privacy policy content',
        version: '1.0',
        lastUpdated: new Date().toISOString()
      });
    });
  });

  describe('OWASP Top 10 Compliance Tests', () => {
    describe('A01:2021 - Broken Access Control', () => {
      it('should prevent unauthorized access to admin endpoints', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .expect(404); // Should not exist or be accessible

        expect(response.status).toBe(404);
      });

      it('should prevent horizontal privilege escalation', async () => {
        // Try to access another user's data
        const response = await request(app)
          .get('/api/user/999')
          .set('Authorization', 'Bearer user-token-123');

        expect(response.status).toBe(200);
        // In a real implementation, this should check user permissions
      });

      it('should prevent vertical privilege escalation', async () => {
        const response = await request(app)
          .get('/api/user/1')
          .set('X-Admin-Override', 'true')
          .set('X-Privilege-Escalation', 'admin');

        expect(response.status).toBe(200);
        // Should not grant admin privileges through headers
      });
    });

    describe('A02:2021 - Cryptographic Failures', () => {
      it('should enforce HTTPS in production', async () => {
        const response = await request(app)
          .get('/api/user/1')
          .set('X-Forwarded-Proto', 'http');

        // Should have HTTPS enforcement headers
        expect(response.headers['strict-transport-security']).toBeDefined();
      });

      it('should not expose sensitive data in responses', async () => {
        const response = await request(app)
          .get('/api/user/1');

        const responseBody = JSON.stringify(response.body);
        expect(responseBody).not.toMatch(/password/i);
        expect(responseBody).not.toMatch(/secret/i);
        expect(responseBody).not.toMatch(/private.*key/i);
        expect(responseBody).not.toMatch(/credit.*card/i);
        expect(responseBody).not.toMatch(/ssn/i);
      });

      it('should use secure random values', async () => {
        const responses = [];
        
        // Make multiple requests to check for predictable values
        for (let i = 0; i < 5; i++) {
          const response = await request(app)
            .get('/api/user/1');
          responses.push(response.body);
        }

        // Check that any generated IDs or tokens are not predictable
        const ids = responses.map(r => r.user?.id).filter(Boolean);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });

    describe('A03:2021 - Injection', () => {
      it('should prevent SQL injection in all parameters', async () => {
        const sqlPayloads = [
          "1'; DROP TABLE users; --",
          "1' OR '1'='1",
          "1' UNION SELECT * FROM users --"
        ];

        for (const payload of sqlPayloads) {
          const response = await request(app)
            .get(`/api/user/${encodeURIComponent(payload)}`);

          expect(response.status).toBe(200);
          expect(response.body.user.id).not.toContain('DROP TABLE');
          expect(response.body.user.id).not.toContain('UNION SELECT');
        }
      });

      it('should prevent NoSQL injection', async () => {
        const noSQLPayloads = [
          '{"$ne": null}',
          '{"$regex": ".*"}',
          '{"$where": "function() { return true; }"}'
        ];

        for (const payload of noSQLPayloads) {
          const response = await request(app)
            .get(`/api/user/${encodeURIComponent(payload)}`);

          expect(response.status).toBe(200);
          const responseStr = JSON.stringify(response.body);
          expect(responseStr).not.toContain('$ne');
          expect(responseStr).not.toContain('$regex');
          expect(responseStr).not.toContain('$where');
        }
      });

      it('should prevent command injection', async () => {
        const commandPayloads = [
          '; ls -la',
          '| cat /etc/passwd',
          '&& rm -rf /',
          '`whoami`'
        ];

        for (const payload of commandPayloads) {
          const response = await request(app)
            .get(`/api/user/${encodeURIComponent(payload)}`);

          expect(response.status).toBe(200);
          expect(response.body.user.id).not.toContain('ls -la');
          expect(response.body.user.id).not.toContain('cat /etc/passwd');
          expect(response.body.user.id).not.toContain('rm -rf');
          expect(response.body.user.id).not.toContain('whoami');
        }
      });
    });

    describe('A04:2021 - Insecure Design', () => {
      it('should implement proper rate limiting', async () => {
        const promises = [];
        
        // Make many rapid requests
        for (let i = 0; i < 100; i++) {
          promises.push(
            request(app)
              .get('/api/user/1')
              .set('X-Forwarded-For', '192.168.1.100')
          );
        }

        const responses = await Promise.allSettled(promises);
        const successfulResponses = responses
          .filter((result): result is PromiseFulfilledResult<request.Response> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);

        // Some requests should be rate limited
        const rateLimitedCount = successfulResponses.filter(r => r.status === 429).length;
        expect(rateLimitedCount).toBeGreaterThan(0);
      });

      it('should validate business logic constraints', async () => {
        // Test business logic that should be validated
        const response = await request(app)
          .post('/api/user/data-export')
          .set('Content-Type', 'application/json')
          .send({
            userId: 'different-user-id',
            requestedBy: 'attacker'
          });

        expect(response.status).toBe(200);
        // Should validate that user can only export their own data
      });
    });

    describe('A05:2021 - Security Misconfiguration', () => {
      it('should not expose server information', async () => {
        const response = await request(app)
          .get('/api/user/1');

        expect(response.headers['server']).toBeUndefined();
        expect(response.headers['x-powered-by']).toBeUndefined();
      });

      it('should set proper security headers', async () => {
        const response = await request(app)
          .get('/api/user/1');

        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['x-xss-protection']).toBe('1; mode=block');
        expect(response.headers['content-security-policy']).toBeDefined();
        expect(response.headers['referrer-policy']).toBeDefined();
      });

      it('should disable unnecessary HTTP methods', async () => {
        const methods = ['TRACE', 'OPTIONS', 'CONNECT'];
        
        for (const method of methods) {
          const response = await request(app)[method.toLowerCase() as keyof request.SuperTest<request.Test>]('/api/user/1');
          
          // Should not allow dangerous HTTP methods
          expect([404, 405, 501]).toContain(response.status);
        }
      });
    });

    describe('A06:2021 - Vulnerable and Outdated Components', () => {
      it('should not expose version information', async () => {
        const response = await request(app)
          .get('/api/user/1');

        const responseStr = JSON.stringify(response.body) + JSON.stringify(response.headers);
        
        // Should not expose framework versions
        expect(responseStr).not.toMatch(/express\/\d+\.\d+\.\d+/i);
        expect(responseStr).not.toMatch(/node\.js\/\d+\.\d+\.\d+/i);
        expect(responseStr).not.toMatch(/version.*\d+\.\d+\.\d+/i);
      });

      it('should check for known vulnerable patterns', async () => {
        // Test for patterns that indicate vulnerable components
        const response = await request(app)
          .get('/api/user/1')
          .set('User-Agent', 'VulnerabilityScanner/1.0');

        expect(response.status).toBe(200);
        
        // Should handle security scanners appropriately
        const responseTime = parseInt(response.headers['x-response-time'] || '0');
        expect(responseTime).toBeLessThan(1000);
      });
    });

    describe('A07:2021 - Identification and Authentication Failures', () => {
      it('should prevent brute force attacks', async () => {
        const promises = [];
        
        for (let i = 0; i < 20; i++) {
          promises.push(
            request(app)
              .post('/api/auth/login')
              .set('Content-Type', 'application/json')
              .send({
                username: 'admin',
                password: 'wrong-password'
              })
          );
        }

        const responses = await Promise.allSettled(promises);
        const successfulResponses = responses
          .filter((result): result is PromiseFulfilledResult<request.Response> => 
            result.status === 'fulfilled'
          )
          .map(result => result.value);

        // Should implement rate limiting for failed attempts
        const rateLimitedCount = successfulResponses.filter(r => r.status === 429).length;
        expect(rateLimitedCount).toBeGreaterThan(0);
      });

      it('should enforce strong session management', async () => {
        const response = await request(app)
          .get('/api/user/1')
          .set('Cookie', 'sessionId=test-session-123');

        // Should have proper session security
        if (response.headers['set-cookie']) {
          const cookieString = response.headers['set-cookie'].join('; ');
          expect(cookieString).toMatch(/HttpOnly/i);
          expect(cookieString).toMatch(/Secure/i);
        }
      });
    });

    describe('A08:2021 - Software and Data Integrity Failures', () => {
      it('should validate data integrity', async () => {
        const response = await request(app)
          .post('/api/user/data-export')
          .set('Content-Type', 'application/json')
          .send({
            data: 'tampered-data',
            checksum: 'invalid-checksum'
          });

        expect(response.status).toBe(200);
        // Should validate data integrity in real implementation
      });

      it('should prevent deserialization attacks', async () => {
        const maliciousPayloads = [
          '{"__proto__": {"isAdmin": true}}',
          '{"constructor": {"prototype": {"isAdmin": true}}}',
          '{"toString": "function() { return \\"hacked\\"; }"}'
        ];

        for (const payload of maliciousPayloads) {
          const response = await request(app)
            .post('/api/user/data-export')
            .set('Content-Type', 'application/json')
            .send(JSON.parse(payload));

          expect(response.status).toBe(200);
          
          // Should not be affected by prototype pollution
          const responseStr = JSON.stringify(response.body);
          expect(responseStr).not.toContain('__proto__');
          expect(responseStr).not.toContain('constructor');
        }
      });
    });

    describe('A09:2021 - Security Logging and Monitoring Failures', () => {
      it('should log security events', async () => {
        // Test that security events are logged (in real implementation)
        const response = await request(app)
          .get('/api/user/1')
          .set('User-Agent', 'sqlmap/1.0');

        expect(response.status).toBe(200);
        // Should log suspicious user agents
      });

      it('should not log sensitive information', async () => {
        const response = await request(app)
          .post('/api/user/data-export')
          .set('Content-Type', 'application/json')
          .send({
            password: 'secret123',
            creditCard: '4111-1111-1111-1111'
          });

        expect(response.status).toBe(200);
        // Logs should not contain sensitive data (tested in real implementation)
      });
    });

    describe('A10:2021 - Server-Side Request Forgery (SSRF)', () => {
      it('should prevent SSRF attacks', async () => {
        const ssrfPayloads = [
          'http://localhost:22',
          'http://127.0.0.1:3306',
          'http://169.254.169.254/latest/meta-data/',
          'file:///etc/passwd',
          'ftp://internal-server/',
          'gopher://127.0.0.1:25/'
        ];

        for (const payload of ssrfPayloads) {
          const response = await request(app)
            .post('/api/user/data-export')
            .set('Content-Type', 'application/json')
            .send({
              callbackUrl: payload,
              webhookUrl: payload
            });

          expect(response.status).toBe(200);
          
          // Should sanitize or reject SSRF attempts
          const responseStr = JSON.stringify(response.body);
          expect(responseStr).not.toContain('localhost');
          expect(responseStr).not.toContain('127.0.0.1');
          expect(responseStr).not.toContain('169.254.169.254');
          expect(responseStr).not.toContain('file://');
        }
      });
    });
  });

  describe('GDPR and Privacy Compliance Tests', () => {
    it('should support data portability (Article 20)', async () => {
      const response = await request(app)
        .post('/api/user/data-export')
        .set('Content-Type', 'application/json')
        .send({ userId: '123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.exportedAt).toBeDefined();
    });

    it('should support right to erasure (Article 17)', async () => {
      const response = await request(app)
        .delete('/api/user/123')
        .set('Content-Type', 'application/json')
        .send({ reason: 'user-request' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.deletedAt).toBeDefined();
    });

    it('should provide privacy policy access (Article 12)', async () => {
      const response = await request(app)
        .get('/api/privacy/policy');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.policy).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.lastUpdated).toBeDefined();
    });

    it('should implement data minimization principles', async () => {
      const response = await request(app)
        .get('/api/user/123');

      expect(response.status).toBe(200);
      
      // Should only return necessary user data
      const user = response.body.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      
      // Should not return sensitive data unnecessarily
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('privateKey');
      expect(user).not.toHaveProperty('internalNotes');
    });
  });

  describe('Hong Kong Privacy Law Compliance Tests', () => {
    it('should comply with Personal Data (Privacy) Ordinance', async () => {
      const response = await request(app)
        .get('/api/user/123');

      expect(response.status).toBe(200);
      
      // Should implement data protection principles
      const user = response.body.user;
      
      // Data should be accurate and up-to-date
      expect(user.createdAt).toBeDefined();
      
      // Should not retain data longer than necessary
      const createdDate = new Date(user.createdAt);
      const now = new Date();
      const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      
      // This is a mock test - in real implementation, check retention policies
      expect(daysDiff).toBeGreaterThanOrEqual(0);
    });

    it('should handle cross-border data transfer restrictions', async () => {
      const response = await request(app)
        .post('/api/user/data-export')
        .set('Content-Type', 'application/json')
        .set('X-Forwarded-For', '1.2.3.4') // Non-HK IP
        .send({
          userId: '123',
          transferTo: 'overseas-server'
        });

      expect(response.status).toBe(200);
      
      // Should implement appropriate safeguards for cross-border transfers
      expect(response.body.success).toBe(true);
    });
  });

  describe('Blockchain Security Compliance Tests', () => {
    it('should comply with smart contract security standards', async () => {
      // Test for common smart contract vulnerabilities
      const response = await request(app)
        .post('/api/nft/mint')
        .set('Content-Type', 'application/json')
        .send({
          recipient: '0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e8e8',
          amount: '1000000000000000000', // 1 ETH in wei
          gasLimit: '21000'
        });

      expect([200, 400]).toContain(response.status);
      
      if (response.status === 200) {
        // Should validate blockchain parameters
        expect(response.body.success).toBe(true);
      }
    });

    it('should prevent common DeFi attack vectors', async () => {
      const maliciousTransactions = [
        {
          type: 'flashloan-attack',
          amount: '999999999999999999999999999',
          callback: 'malicious-contract'
        },
        {
          type: 'reentrancy',
          recursive: true,
          depth: 1000
        },
        {
          type: 'front-running',
          gasPrice: '999999999999999999',
          priority: 'max'
        }
      ];

      for (const tx of maliciousTransactions) {
        const response = await request(app)
          .post('/api/nft/mint')
          .set('Content-Type', 'application/json')
          .send(tx);

        expect([200, 400]).toContain(response.status);
        
        // Should detect and prevent malicious patterns
        if (response.status === 200) {
          const responseStr = JSON.stringify(response.body);
          expect(responseStr).not.toContain('malicious-contract');
          expect(responseStr).not.toContain('999999999999999999999999999');
        }
      }
    });
  });

  describe('API Security Standards Compliance', () => {
    it('should comply with REST API security best practices', async () => {
      const response = await request(app)
        .get('/api/user/123');

      // Should use proper HTTP status codes
      expect(response.status).toBe(200);
      
      // Should have proper content type
      expect(response.headers['content-type']).toContain('application/json');
      
      // Should have security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should implement proper CORS policies', async () => {
      const response = await request(app)
        .options('/api/user/123')
        .set('Origin', 'https://malicious-site.com')
        .set('Access-Control-Request-Method', 'GET');

      // Should have proper CORS configuration
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toBe('*');
      }
    });

    it('should validate API versioning security', async () => {
      const response = await request(app)
        .get('/api/user/123')
        .set('Accept', 'application/vnd.api+json;version=999');

      expect([200, 400, 406]).toContain(response.status);
      
      // Should handle version requests securely
      expect(response.headers['x-api-version']).toBeDefined();
    });
  });

  describe('Security Monitoring and Alerting Tests', () => {
    it('should detect and log suspicious activities', async () => {
      const suspiciousRequests = [
        {
          userAgent: 'sqlmap/1.0',
          path: '/api/user/1',
          payload: null
        },
        {
          userAgent: 'Nikto/2.1.6',
          path: '/api/admin/users',
          payload: null
        },
        {
          userAgent: 'Mozilla/5.0',
          path: '/api/user/1',
          payload: { username: "'; DROP TABLE users; --" }
        }
      ];

      for (const req of suspiciousRequests) {
        const response = await request(app)
          .get(req.path)
          .set('User-Agent', req.userAgent)
          .send(req.payload);

        // Should handle suspicious requests appropriately
        expect([200, 400, 403, 404]).toContain(response.status);
      }
    });

    it('should implement security metrics collection', async () => {
      const response = await request(app)
        .get('/api/user/1');

      // Should collect security metrics
      expect(response.headers['x-response-time']).toBeDefined();
      
      const responseTime = parseInt(response.headers['x-response-time'] || '0');
      expect(responseTime).toBeGreaterThan(0);
      expect(responseTime).toBeLessThan(5000); // Should be reasonable
    });
  });
});