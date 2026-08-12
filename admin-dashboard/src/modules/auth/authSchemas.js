import { z } from 'zod';

// zod schemas live outside React's render tree, so they can't call the
// useTranslation() hook directly. Instead, `.message` here is an i18n KEY
// (e.g. 'auth.identifierRequired'), not literal English text — components
// translate it at display time via t(errors.field.message). See
// LoginPage.jsx etc. for the render-time t() call.

export const loginSchema = z
  .object({
    identifier: z.string().min(1, 'auth.identifierRequired'),
    password: z.string().min(6, 'auth.passwordTooShort'),
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
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'auth.invalidMobile'),
});

export const otpVerifySchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'auth.invalidMobile'),
  otp: z.string().length(6, 'auth.invalidOtpLength'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'auth.resetTokenMissing'),
    newPassword: z.string().min(8, 'auth.passwordMinLength'),
    confirmPassword: z.string().min(1, 'auth.confirmPasswordRequired'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'auth.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });
