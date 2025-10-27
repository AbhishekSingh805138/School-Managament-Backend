import { 
  sanitizeString, 
  sanitizeEmail, 
  sanitizePhone, 
  sanitizeNumber, 
  sanitizeBoolean, 
  sanitizeDate, 
  sanitizeUrl, 
  sanitizeUUID, 
  sanitizeObject,
  sanitizeRequestBody,
  FIELD_DEFINITIONS
} from '../utils/sanitization';

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('should remove XSS attempts', () => {
      const maliciousInput = '<script>alert("XSS")</script>Hello World';
      const result = sanitizeString(maliciousInput);
      expect(result).toBe('Hello World');
      expect(result).not.toContain('<script>');
    });

    it('should remove null bytes', () => {
      const input = 'Hello\0World';
      const result = sanitizeString(input);
      expect(result).toBe('HelloWorld');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeString(input);
      expect(result).toBe('Hello World');
    });

    it('should handle non-string input', () => {
      expect(sanitizeString(123 as any)).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should normalize valid email', () => {
      const email = 'Test.User+tag@Example.COM';
      const result = sanitizeEmail(email);
      expect(result).toBe('testuser@example.com');
    });

    it('should remove XSS from email', () => {
      const maliciousEmail = 'test<script>alert("xss")</script>@example.com';
      const result = sanitizeEmail(maliciousEmail);
      expect(result).not.toContain('<script>');
    });

    it('should handle invalid email', () => {
      const invalidEmail = 'not-an-email';
      const result = sanitizeEmail(invalidEmail);
      expect(result).toBe('');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep valid phone characters', () => {
      const phone = '+1 (555) 123-4567';
      const result = sanitizePhone(phone);
      expect(result).toBe('+1 (555) 123-4567');
    });

    it('should remove invalid characters', () => {
      const phone = '+1<script>alert("xss")</script>(555)123-4567';
      const result = sanitizePhone(phone);
      expect(result).toBe('+1(555)123-4567');
    });
  });

  describe('sanitizeNumber', () => {
    it('should handle valid numbers', () => {
      expect(sanitizeNumber(123)).toBe(123);
      expect(sanitizeNumber('456.78')).toBe(456.78);
      expect(sanitizeNumber('123')).toBe(123);
    });

    it('should handle invalid numbers', () => {
      expect(sanitizeNumber('not-a-number')).toBe(null);
      expect(sanitizeNumber(NaN)).toBe(null);
      expect(sanitizeNumber({})).toBe(null);
    });
  });

  describe('sanitizeBoolean', () => {
    it('should handle boolean values', () => {
      expect(sanitizeBoolean(true)).toBe(true);
      expect(sanitizeBoolean(false)).toBe(false);
    });

    it('should handle string representations', () => {
      expect(sanitizeBoolean('true')).toBe(true);
      expect(sanitizeBoolean('TRUE')).toBe(true);
      expect(sanitizeBoolean('1')).toBe(true);
      expect(sanitizeBoolean('yes')).toBe(true);
      expect(sanitizeBoolean('false')).toBe(false);
      expect(sanitizeBoolean('0')).toBe(false);
      expect(sanitizeBoolean('no')).toBe(false);
    });
  });

  describe('sanitizeDate', () => {
    it('should handle valid ISO dates', () => {
      const date = '2023-12-25T10:30:00Z';
      const result = sanitizeDate(date);
      expect(result).toBe(date);
    });

    it('should handle valid date strings', () => {
      const date = '2023-12-25';
      const result = sanitizeDate(date);
      expect(result).toBe(date);
    });

    it('should reject invalid dates', () => {
      expect(sanitizeDate('not-a-date')).toBe(null);
      expect(sanitizeDate('2023-13-45')).toBe(null);
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid URLs', () => {
      const url = 'https://example.com/path';
      const result = sanitizeUrl(url);
      expect(result).toBe(url);
    });

    it('should reject invalid URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBe(null);
      expect(sanitizeUrl('ftp://example.com')).toBe(null);
      expect(sanitizeUrl('javascript:alert("xss")')).toBe(null);
    });
  });

  describe('sanitizeUUID', () => {
    it('should accept valid UUIDs', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = sanitizeUUID(uuid);
      expect(result).toBe(uuid);
    });

    it('should reject invalid UUIDs', () => {
      expect(sanitizeUUID('not-a-uuid')).toBe(null);
      expect(sanitizeUUID('123-456-789')).toBe(null);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>John',
        email: 'john@example.com',
        nested: {
          description: '<img src=x onerror=alert("xss")>',
          count: 5
        },
        array: ['<script>alert("xss")</script>item1', 'item2']
      };

      const result = sanitizeObject(maliciousObject);
      
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.nested.description).not.toContain('<img');
      expect(result.nested.count).toBe(5);
      expect(result.array[0]).toBe('item1');
      expect(result.array[1]).toBe('item2');
    });
  });

  describe('sanitizeRequestBody', () => {
    it('should sanitize based on field definitions', () => {
      const body = {
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe<img src=x onerror=alert("xss")>',
        email: 'JOHN.DOE+TAG@EXAMPLE.COM',
        phone: '+1<script>(555)</script>123-4567',
        age: '25',
        isActive: 'true'
      };

      const fieldDefs = {
        firstName: 'string',
        lastName: 'string',
        email: 'email',
        phone: 'phone',
        age: 'number',
        isActive: 'boolean'
      };

      const result = sanitizeRequestBody(body, fieldDefs);
      
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.email).toBe('johndoe@example.com');
      expect(result.phone).toBe('+1(555)123-4567');
      expect(result.age).toBe(25);
      expect(result.isActive).toBe(true);
    });
  });

  describe('XSS Attack Vectors', () => {
    const xssVectors = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<div onclick=alert("XSS")>Click me</div>',
      '<input type="text" value="" onfocus=alert("XSS") autofocus>',
      '<a href="javascript:alert(\'XSS\')">Click</a>',
      '<style>@import"javascript:alert(\'XSS\')";</style>'
    ];

    xssVectors.forEach((vector, index) => {
      it(`should neutralize XSS vector ${index + 1}: ${vector.substring(0, 30)}...`, () => {
        const result = sanitizeString(vector);
        expect(result).not.toContain('<script');
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
        expect(result).not.toContain('onclick');
        expect(result).not.toContain('onfocus');
      });
    });
  });

  describe('SQL Injection Attempts', () => {
    const sqlInjectionVectors = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "' OR 1=1 --",
      "admin'--",
      "admin'/*",
      "' OR 'x'='x",
      "'; EXEC xp_cmdshell('dir'); --"
    ];

    sqlInjectionVectors.forEach((vector, index) => {
      it(`should sanitize SQL injection vector ${index + 1}: ${vector}`, () => {
        const result = sanitizeString(vector);
        // The sanitized result should not contain the original malicious SQL
        expect(result).not.toBe(vector);
        // Should not contain common SQL injection patterns
        expect(result).not.toMatch(/DROP\s+TABLE/i);
        expect(result).not.toMatch(/UNION\s+SELECT/i);
        expect(result).not.toMatch(/INSERT\s+INTO/i);
        expect(result).not.toMatch(/EXEC\s+xp_cmdshell/i);
      });
    });
  });
});