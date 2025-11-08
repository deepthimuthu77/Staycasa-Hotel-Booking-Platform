// src/lib/schemas.ts
import { z } from 'zod';

/**
 * (REMOVED) Schema for the first step of the authentication flow (AuthOtpFlow.tsx).
 */
// export const emailSchema = z.object({ ... });

/**
 * (REMOVED) Schema for the second step of the authentication flow (AuthOtpFlow.tsx).
 */
// export const otpSchema = z.object({ ... });

/**
 * Schema for the Sign In form (AuthForm.tsx).
 * (No changes)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

/**
 * (UPDATED) Schema for the FIRST step of Sign Up (AuthForm.tsx).
 */
export const signupEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  // TODO: Add a real captcha validation schema
  captcha: z.string().optional(),
});

/**
 * (NEW) Schema for the SECOND step of Sign Up (AuthForm.tsx).
 */
export const signupVerifySchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  otp: z
    .string()
    .min(1, 'Code is required')
    .length(6, 'The code must be 6 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // Error will be attached to this field
});


/**
 * (REMOVED) Schema for the Create Password page (CreatePasswordPage.tsx).
 * This page is no longer needed for sign-up.
 */
// export const createPasswordSchema = z.object({ ... });

/**
 * Schema for the Reset Password page (ResetPasswordPage.tsx).
 * (No changes)
 */
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  otp: z
    .string()
    .min(1, 'Code is required')
    .length(6, 'The code must be 6 digits'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


/**
 * Schema for the User Profile form (AccountPage.tsx).
 * (No changes)
 */
export const profileSchema = z.object({
  // ... (no changes)
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(
      /^[+]?[0-9]{10,15}$/,
      'Must be a valid 10-15 digit phone number'
    )
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(500, 'Bio must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  date_of_birth: z
    .string() // HTML date inputs provide 'YYYY-MM-DD' strings
    .optional()
    .or(z.literal('')),
  language: z
    .string()
    .max(10, 'Language code is too long')
    .optional()
    .or(z.literal('')),
  currency: z
    .string()
    .length(3, 'Must be a 3-letter currency code (e.g., INR)')
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for the Review form (ReviewModal in MyAccomodationsPage.tsx).
 * (No changes)
 */
export const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a star rating.'),
  title: z
    .string()
    .max(100, 'Title must be 100 characters or less')
    .optional(),
  comment: z
    .string()
    .max(1000, 'Comment must be 1000 characters or less')
    .optional(),
});