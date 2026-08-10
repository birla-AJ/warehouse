import { z } from 'zod';

export const loginSchema = z
  .object({
    identifier: z.string().min(1, 'Enter your email or mobile number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .transform((data) => {
    const isEmail = data.identifier.includes('@');
    return {
      email: isEmail ? data.identifier : undefined,
      mobile: isEmail ? undefined : data.identifier,
      password: data.password,
    };
  });

export const otpRequestSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
});

export const otpVerifySchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token missing from the link'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
