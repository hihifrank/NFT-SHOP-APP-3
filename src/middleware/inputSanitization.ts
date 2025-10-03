import { Request, Response, NextFunction } from 'express';
import { body, param, query, ValidationChain } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

// Input sanitization and SQL injection prevention
class InputSanitization {
  // Sanitize HTML content to prevent XSS
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
    });
  }

  // Remove SQL injection patterns
  static sanitizeSQL(input: string): string {
    if (typeof input !== 'string') return input;
    
    // Remove common SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\b(CHAR|NCHAR|VARCHAR|NVARCHAR)\s*\()/gi,
      /(\b(CAST|CONVERT|SUBSTRING|ASCII|CHAR_LENGTH)\s*\()/gi,
    ];

    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized.trim();
  }

  // Sanitize NoSQL injection patterns
  static sanitizeNoSQL(input: any): any {
    if (typeof input === 'string') {
      // Remove MongoDB injection patterns
      const noSQLPatterns = [
        /\$where/gi,
        /\$regex/gi,
        /\$ne/gi,
        /\$gt/gi,
        /\$lt/gi,
        /\$in/gi,
        /\$nin/gi,
        /\$exists/gi,
        /\$type/gi,
      ];

      let sanitized = input;
      noSQLPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
      });

      return sanitized;
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          // Recursively sanitize object properties
          sanitized[key] = InputSanitization.sanitizeNoSQL(input[key]);
        }
      }
      return sanitized;
    }

    return input;
  }

  // General input sanitization middleware
  static sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = InputSanitization.deepSanitize(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = InputSanitization.deepSanitize(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = InputSanitization.deepSanitize(req.params);
    }

    next();
  };

  // Deep sanitization for nested objects
  private static deepSanitize(obj: any): any {
    if (typeof obj === 'string') {
      let sanitized = obj;
      sanitized = InputSanitization.sanitizeHTML(sanitized);
      sanitized = InputSanitization.sanitizeSQL(sanitized);
      sanitized = InputSanitization.sanitizeNoSQL(sanitized);
      return sanitized;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => InputSanitization.deepSanitize(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = InputSanitization.deepSanitize(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  }

  // Validation chains for common input types
  static walletAddressValidation(): ValidationChain {
    return body('walletAddress')
      .isLength({ min: 42, max: 42 })
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Invalid wallet address format');
  }

  static emailValidation(): ValidationChain {
    return body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format');
  }

  static uuidValidation(field: string): ValidationChain {
    return param(field)
      .isUUID()
      .withMessage(`Invalid ${field} format`);
  }

  static stringValidation(field: string, minLength = 1, maxLength = 255): ValidationChain {
    return body(field)
      .isString()
      .isLength({ min: minLength, max: maxLength })
      .trim()
      .escape()
      .withMessage(`${field} must be a string between ${minLength} and ${maxLength} characters`);
  }

  static numberValidation(field: string, min = 0, max = Number.MAX_SAFE_INTEGER): ValidationChain {
    return body(field)
      .isNumeric()
      .isFloat({ min, max })
      .withMessage(`${field} must be a number between ${min} and ${max}`);
  }

  static booleanValidation(field: string): ValidationChain {
    return body(field)
      .isBoolean()
      .withMessage(`${field} must be a boolean value`);
  }

  // Specific validation for blockchain-related inputs
  static transactionHashValidation(): ValidationChain {
    return body('transactionHash')
      .matches(/^0x[a-fA-F0-9]{64}$/)
      .withMessage('Invalid transaction hash format');
  }

  static tokenIdValidation(): ValidationChain {
    return body('tokenId')
      .isNumeric()
      .isInt({ min: 0 })
      .withMessage('Token ID must be a positive integer');
  }

  // Pagination validation
  static paginationValidation(): ValidationChain[] {
    return [
      query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Page must be between 1 and 1000'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    ];
  }

  // Geographic coordinates validation
  static coordinatesValidation(): ValidationChain[] {
    return [
      body('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
      body('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
    ];
  }

  // File upload validation
  static fileValidation(allowedTypes: string[], maxSize: number): ValidationChain {
    return body('file')
      .custom((value, { req }) => {
        if (!req.file) {
          throw new Error('No file uploaded');
        }

        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }

        if (req.file.size > maxSize) {
          throw new Error(`File too large. Maximum size: ${maxSize} bytes`);
        }

        return true;
      });
  }
}

export default InputSanitization;