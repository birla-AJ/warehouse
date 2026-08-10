import { describe, it, expect } from 'vitest';
import { loginSchema, otpRequestSchema, resetPasswordSchema } from './authSchemas';

describe('loginSchema', () => {
  it('routes an identifier containing @ to the email field', () => {
    const result = loginSchema.parse({ identifier: 'owner@example.com', password: 'password123' });
    expect(result.email).toBe('owner@example.com');
    expect(result.mobile).toBeUndefined();
  });

  it('routes a plain identifier to the mobile field', () => {
    const result = loginSchema.parse({ identifier: '9876543210', password: 'password123' });
    expect(result.mobile).toBe('9876543210');
    expect(result.email).toBeUndefined();
  });

  it('rejects a password under 6 characters', () => {
    expect(() => loginSchema.parse({ identifier: '9876543210', password: '123' })).toThrow();
  });
});

describe('otpRequestSchema', () => {
  it('rejects a mobile number that does not start with 6-9', () => {
    expect(() => otpRequestSchema.parse({ mobile: '1234567890' })).toThrow();
  });

  it('accepts a valid 10-digit mobile number', () => {
    expect(() => otpRequestSchema.parse({ mobile: '9876543210' })).not.toThrow();
  });
});

describe('resetPasswordSchema', () => {
  it('rejects mismatched passwords', () => {
    expect(() =>
      resetPasswordSchema.parse({ token: 't', newPassword: 'password123', confirmPassword: 'different123' }),
    ).toThrow();
  });

  it('accepts matching passwords over 8 characters', () => {
    expect(() =>
      resetPasswordSchema.parse({ token: 't', newPassword: 'password123', confirmPassword: 'password123' }),
    ).not.toThrow();
  });
});
