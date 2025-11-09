// src/lib/schemas.ts
import { z } from 'zod';

/**
 * Schema for the Sign In (Password) form (AuthForm.tsx).
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
 * Schema for the Sign In with OTP (Email) form (AuthForm.tsx).
 */
export const loginOtpEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

/**
 * Schema for the Sign In with OTP (Verify) form (AuthForm.tsx).
 */
export const loginOtpVerifySchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  otp: z
    .string()
    .min(1, 'Code is required')
    .length(6, 'The code must be 6 digits'),
});

/**
 * Schema for the FIRST step of Sign Up (AuthForm.tsx).
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
 * Schema for the SECOND step of Sign Up (AuthForm.tsx).
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
 * Schema for the "Create Password" page (CreatePasswordPage.tsx).
 * This is used after a magic link/OTP signup.
 */
export const createPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  // TODO: Add a real captcha validation schema
  captcha: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


/**
 * (NEW) Schema for the Reset Password page (ResetPasswordPage.tsx) - LOGGED OUT, STEP 1
 */
export const resetPasswordEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});


/**
 * Schema for the Reset Password page (ResetPasswordPage.tsx) - LOGGED OUT FLOW, STEP 2
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
 * (NEW) Schema for the Reset Password page (ResetPasswordPage.tsx) - LOGGED IN FLOW
 */
export const resetPasswordLoggedInSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  password: z
    .string()
    .min(8, 'New password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your new password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});


/**
 * Schema for the User Profile form (AccountPage.tsx).
 */
export const profileSchema = z.object({
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
    .string()
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