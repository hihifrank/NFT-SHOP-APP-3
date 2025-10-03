import request from 'supertest';
import express from 'express';
import DataPrivacyProtection from '../middleware/dataPrivacy';
import DataPrivacyService from '../services/DataPrivacyService';
import privacyRoutes from '../routes/privacy';

describe('Data Privacy Protection', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/privacy', privacyRoutes);
  });

  describe('Data Encryption', () => {
    it('should encrypt and decrypt data correctly', () => {
      const originalData = 'sensitive user information';
      
      const encrypted = DataPrivacyProtection.encryptData(originalData);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalData);
      expect(encrypted.split(':')).toHaveLength(2); // IV:encrypted

      const decrypted = DataPrivacyProtection.decryptData(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should handle encryption errors gracefully', () => {
      expect(() => {
        DataPrivacyProtection.decryptData('invalid:encrypted:data');
      }).toThrow('Failed to decrypt data');
    });
  });

  describe('Data Hashing', () => {
    it('should hash data consistently', () => {
      const data = 'test@example.com';
      const hash1 = DataPrivacyProtection.hashData(data);
      const hash2 = DataPrivacyProtection.hashData(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
      expect(hash1).not.toBe(data);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = DataPrivacyProtection.hashData('data1');
      const hash2 = DataPrivacyProtection.hashData('data2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('IP Anonymization', () => {
    it('should anonymize IPv4 addresses', () => {
      const ipv4 = '192.168.1.100';
      const anonymized = DataPrivacyProtection.anonymizeIP(ipv4);
      
      expect(anonymized).toBe('192.168.1.0');
    });

    it('should anonymize IPv6 addresses', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const anonymized = DataPrivacyProtection.anonymizeIP(ipv6);
      
      expect(anonymized).toBe('2001:0db8:85a3:0000::0000:0000:0000:0000');
    });
  });

  describe('Data Sanitization', () => {
    let testApp: express.Application;

    beforeEach(() => {
      testApp = express();
      testApp.use(express.json());
      testApp.use(DataPrivacyProtection.sanitizeResponse);
      
      testApp.get('/test', (req, res) => {
        res.json({
          email: 'user@example.com',
          phone: '+1234567890',
          password: 'secret123',
          apiKey: 'api_key_123',
          normalData: 'this is fine',
        });
      });
    });

    it('should sanitize sensitive data in responses', async () => {
      const response = await request(testApp)
        .get('/test')
        .expect(200);

      expect(response.body.email).toBe('u***@example.com');
      expect(response.body.phone).toBe('******7890');
      expect(response.body.password).toBe('[REDACTED]');
      expect(response.body.apiKey).toBe('[REDACTED]');
      expect(response.body.normalData).toBe('this is fine');
    });
  });

  describe('Privacy Headers', () => {
    let testApp: express.Application;

    beforeEach(() => {
      testApp = express();
      testApp.use(DataPrivacyProtection.addPrivacyHeaders);
      
      testApp.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });
    });

    it('should add privacy-related headers', async () => {
      const response = await request(testApp)
        .get('/test')
        .expect(200);

      expect(response.headers['x-privacy-policy']).toBe('/privacy-policy');
      expect(response.headers['x-data-retention']).toBe('2-years');
      expect(response.headers['x-gdpr-compliant']).toBe('true');
      expect(response.headers['x-hk-privacy-compliant']).toBe('true');
    });
  });

  describe('Data Retention', () => {
    it('should correctly identify expired data', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 800); // 800 days ago
      
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 100); // 100 days ago

      expect(DataPrivacyProtection.isDataRetentionExpired(oldDate, 730)).toBe(true);
      expect(DataPrivacyProtection.isDataRetentionExpired(recentDate, 730)).toBe(false);
    });
  });

  describe('Compliance Report', () => {
    it('should generate comprehensive compliance report', () => {
      const report = DataPrivacyProtection.generateComplianceReport();
      
      expect(report.gdprCompliant).toBe(true);
      expect(report.hkPrivacyCompliant).toBe(true);
      expect(report.dataEncryption.enabled).toBe(true);
      expect(report.dataRetention.automaticDeletion).toBe(true);
      expect(report.userRights.dataAccess).toBe(true);
      expect(report.userRights.dataErasure).toBe(true);
      expect(report.consentManagement.explicitConsent).toBe(true);
      expect(report.securityMeasures.dataEncryption).toBe(true);
      expect(report.timestamp).toBeDefined();
    });
  });
});

describe('Data Privacy Service', () => {
  describe('User Data Export', () => {
    it('should export user data successfully', async () => {
      const userId = 'test-user-123';
      const result = await DataPrivacyService.exportUserData(userId);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.personalInfo.userId).toBe(userId);
      expect(result.data.exportMetadata.exportFormat).toBe('JSON');
      expect(result.data.exportMetadata.legalBasis).toContain('GDPR Article 20');
    });
  });

  describe('User Data Deletion', () => {
    it('should delete user data successfully', async () => {
      const userId = 'test-user-123';
      const result = await DataPrivacyService.deleteUserData(userId, 'USER_REQUEST');
      
      expect(result.success).toBe(true);
      expect(result.deletedItems).toBeDefined();
      expect(result.deletedItems?.length).toBeGreaterThan(0);
      expect(result.deletedItems).toContain('Personal information');
    });
  });

  describe('User Data Anonymization', () => {
    it('should anonymize user data successfully', async () => {
      const userId = 'test-user-123';
      const result = await DataPrivacyService.anonymizeUserData(userId);
      
      expect(result.success).toBe(true);
      expect(result.anonymizedItems).toBeDefined();
      expect(result.anonymizedItems?.length).toBeGreaterThan(0);
      expect(result.anonymizedItems).toContain('Email addresses');
    });
  });

  describe('Consent Management', () => {
    it('should update user consent successfully', async () => {
      const userId = 'test-user-123';
      const consentData = {
        dataProcessing: true,
        marketing: false,
        analytics: true,
        thirdPartySharing: false,
        consentDate: new Date(),
        ipAddress: '192.168.1.100',
      };

      const result = await DataPrivacyService.updateUserConsent(userId, consentData);
      
      expect(result.success).toBe(true);
    });

    it('should get user consent successfully', async () => {
      const userId = 'test-user-123';
      const result = await DataPrivacyService.getUserConsent(userId);
      
      expect(result.success).toBe(true);
      expect(result.consent).toBeDefined();
      expect(result.consent.userId).toBeDefined();
      expect(typeof result.consent.dataProcessing).toBe('boolean');
    });
  });

  describe('Data Cleanup', () => {
    it('should cleanup expired data successfully', async () => {
      const result = await DataPrivacyService.cleanupExpiredData();
      
      expect(result.success).toBe(true);
      expect(typeof result.cleanedItems).toBe('number');
    });
  });

  describe('Privacy Report', () => {
    it('should generate privacy report successfully', async () => {
      const result = await DataPrivacyService.generatePrivacyReport();
      
      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report.gdprCompliant).toBe(true);
      expect(result.report.statistics).toBeDefined();
    });
  });
});

describe('Privacy API Routes', () => {
  let apiApp: express.Application;

  beforeEach(() => {
    apiApp = express();
    apiApp.use(express.json());
    apiApp.use('/api/v1/privacy', privacyRoutes);
  });

  describe('POST /api/v1/privacy/export', () => {
    it('should export user data via API', async () => {
      const response = await request(apiApp)
        .post('/api/v1/privacy/export')
        .send({ userId: 'test-user-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.exportDate).toBeDefined();
    });

    it('should reject request without userId', async () => {
      const response = await request(apiApp)
        .post('/api/v1/privacy/export')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/privacy/delete', () => {
    it('should delete user data via API', async () => {
      const response = await request(apiApp)
        .post('/api/v1/privacy/delete')
        .send({ 
          userId: 'test-user-123',
          confirmDeletion: true,
          reason: 'USER_REQUEST'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deletedItems).toBeDefined();
      expect(response.body.deletionDate).toBeDefined();
    });

    it('should reject request without confirmation', async () => {
      const response = await request(apiApp)
        .post('/api/v1/privacy/delete')
        .send({ 
          userId: 'test-user-123',
          confirmDeletion: false
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/privacy/consent', () => {
    it('should update consent via API', async () => {
      const response = await request(apiApp)
        .post('/api/v1/privacy/consent')
        .send({
          userId: 'test-user-123',
          dataProcessing: true,
          marketing: false,
          analytics: true,
          thirdPartySharing: false
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.consentDate).toBeDefined();
    });
  });

  describe('GET /api/v1/privacy/consent/:userId', () => {
    it('should get consent status via API', async () => {
      const response = await request(apiApp)
        .get('/api/v1/privacy/consent/test-user-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.consent).toBeDefined();
    });
  });

  describe('POST /api/v1/privacy/cleanup', () => {
    it('should cleanup expired data via API', async () => {
      const response = await request(apiApp)
        .post('/api/v1/privacy/cleanup')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cleanupDate).toBeDefined();
    });
  });

  describe('GET /api/v1/privacy/report', () => {
    it('should generate privacy report via API', async () => {
      const response = await request(apiApp)
        .get('/api/v1/privacy/report')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.report).toBeDefined();
      expect(response.body.report.gdprCompliant).toBe(true);
    });
  });
});