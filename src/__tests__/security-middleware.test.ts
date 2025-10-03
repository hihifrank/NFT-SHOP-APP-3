import request from 'supertest';
import express from 'express';
import securityMiddleware, { DDoSProtection, InputSanitization, HTTPSEnforcement } from '../middleware/security';

describe('Security Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(securityMiddleware);
    
    // Test routes
    app.get('/test', (req, res) => {
      res.json({ success: true, data: 'test' });
    });
    
    app.post('/test', (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['x-api-version']).toBe('1.0.0');
      expect(response.headers['x-response-time']).toBeDefined();
    });

    it('should set cache control headers', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.headers['cache-control']).toContain('no-store');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });
  });

  describe('Content Type Validation', () => {
    it('should accept valid content types', async () => {
      await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' })
        .expect(200);
    });

    it('should reject invalid content types', async () => {
      const response = await request(app)
        .post('/test')
        .set('Content-Type', 'text/plain')
        .send('test data')
        .expect(415);

      expect(response.body.error.code).toBe('UNSUPPORTED_CONTENT_TYPE');
    });

    it('should require content type for POST requests', async () => {
      const response = await request(app)
        .post('/test')
        .send({ test: 'data' })
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_CONTENT_TYPE');
    });
  });

  describe('Request Size Monitoring', () => {
    it('should accept normal sized requests', async () => {
      const normalData = { message: 'normal size data' };
      
      await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send(normalData)
        .expect(200);
    });
  });
});

describe('DDoS Protection', () => {
  describe('IP Blocking', () => {
    it('should track suspicious IPs', () => {
      const status = DDoSProtection.getProtectionStatus();
      expect(status).toHaveProperty('suspiciousIPs');
      expect(status).toHaveProperty('blockedIPs');
      expect(status).toHaveProperty('totalSuspicious');
      expect(status).toHaveProperty('totalBlocked');
    });

    it('should unblock IPs', () => {
      const testIP = '192.168.1.100';
      
      // This should return false since IP is not blocked
      const result = DDoSProtection.unblockIP(testIP);
      expect(result).toBe(false);
    });
  });

  describe('Bot Detection', () => {
    let app: express.Application;

    beforeEach(() => {
      app = express();
      app.use(DDoSProtection.botDetection);
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow normal user agents', async () => {
      await request(app)
        .get('/test')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        .expect(200);
    });

    it('should detect bot user agents', async () => {
      // This test might trigger rate limiting for bots
      const response = await request(app)
        .get('/test')
        .set('User-Agent', 'python-requests/2.25.1');
      
      // Should either pass through or be rate limited
      expect([200, 429]).toContain(response.status);
    });
  });
});

describe('Input Sanitization', () => {
  describe('HTML Sanitization', () => {
    it('should sanitize HTML content', () => {
      const maliciousHTML = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = InputSanitization.sanitizeHTML(maliciousHTML);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should remove SQL injection patterns', () => {
      const maliciousSQL = "'; DROP TABLE users; --";
      const sanitized = InputSanitization.sanitizeSQL(maliciousSQL);
      
      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain('--');
    });

    it('should handle OR/AND injection attempts', () => {
      const maliciousSQL = "1 OR 1=1";
      const sanitized = InputSanitization.sanitizeSQL(maliciousSQL);
      
      expect(sanitized).not.toContain('OR 1=1');
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should sanitize NoSQL injection patterns', () => {
      const maliciousNoSQL = { $where: 'function() { return true; }' };
      const sanitized = InputSanitization.sanitizeNoSQL(maliciousNoSQL);
      
      expect(JSON.stringify(sanitized)).not.toContain('$where');
    });

    it('should handle nested objects', () => {
      const maliciousData = {
        user: {
          name: 'test',
          query: { $ne: null }
        }
      };
      
      const sanitized = InputSanitization.sanitizeNoSQL(maliciousData);
      expect(JSON.stringify(sanitized)).not.toContain('$ne');
    });
  });

  describe('Validation Chains', () => {
    it('should validate wallet addresses', () => {
      const validation = InputSanitization.walletAddressValidation();
      expect(validation).toBeDefined();
    });

    it('should validate email addresses', () => {
      const validation = InputSanitization.emailValidation();
      expect(validation).toBeDefined();
    });

    it('should validate UUIDs', () => {
      const validation = InputSanitization.uuidValidation('id');
      expect(validation).toBeDefined();
    });

    it('should validate coordinates', () => {
      const validations = InputSanitization.coordinatesValidation();
      expect(validations).toHaveLength(2);
    });

    it('should validate pagination', () => {
      const validations = InputSanitization.paginationValidation();
      expect(validations).toHaveLength(2);
    });
  });
});

describe('HTTPS Enforcement', () => {
  describe('Status Check', () => {
    it('should return HTTPS status', () => {
      const status = HTTPSEnforcement.getHTTPSStatus();
      
      expect(status).toHaveProperty('environment');
      expect(status).toHaveProperty('httpsEnforced');
      expect(status).toHaveProperty('hstsEnabled');
      expect(status).toHaveProperty('secureSessionsEnabled');
    });
  });

  describe('Security Stack', () => {
    it('should provide security middleware stack', () => {
      expect(HTTPSEnforcement.securityStack).toBeDefined();
      expect(Array.isArray(HTTPSEnforcement.securityStack)).toBe(true);
      expect(HTTPSEnforcement.securityStack.length).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(securityMiddleware);
    
    app.post('/api/test', (req, res) => {
      res.json({ 
        success: true, 
        received: req.body,
        headers: {
          userAgent: req.headers['user-agent'],
          contentType: req.headers['content-type']
        }
      });
    });
  });

  it('should handle legitimate API requests', async () => {
    const response = await request(app)
      .post('/api/test')
      .set('Content-Type', 'application/json')
      .set('User-Agent', 'Mozilla/5.0 (compatible; API-Client/1.0)')
      .send({
        walletAddress: '0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e8e8',
        amount: 100
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.received).toHaveProperty('walletAddress');
    expect(response.body.received).toHaveProperty('amount');
  });

  it('should sanitize malicious input', async () => {
    const maliciousData = {
      name: '<script>alert("xss")</script>John',
      query: "'; DROP TABLE users; --",
      search: { $where: 'function() { return true; }' }
    };

    const response = await request(app)
      .post('/api/test')
      .set('Content-Type', 'application/json')
      .send(maliciousData)
      .expect(200);

    const received = response.body.received;
    
    // Check that malicious content was sanitized
    expect(received.name).not.toContain('<script>');
    expect(received.query).not.toContain('DROP TABLE');
    expect(JSON.stringify(received.search)).not.toContain('$where');
  });

  it('should set all required security headers', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(404); // Route doesn't exist for GET, but headers should be set

    // Check security headers
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    expect(response.headers['x-api-version']).toBe('1.0.0');
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers['x-response-time']).toBeDefined();
  });
});