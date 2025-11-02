// src/lib/schemas.ts
import { z } from 'zod';

/**
 * Schema for the first step of the authentication flow (AuthOtpFlow.tsx).
 * Validates that the user has entered a valid email.
 */
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

/**
 * Schema for the second step of the authentication flow (AuthOtpFlow.tsx).
 * Validates that the user has entered a 6-digit OTP code.
 */
export const otpSchema = z.object({
  otp: z
    .string()
    .min(1, 'Code is required')
    .length(6, 'The code must be 6 digits'),
});

/**
 * Schema for the User Profile form (AccountPage.tsx).
 * Validates all the user's personal details and preferences.
 * We use .optional() and .or(z.literal('')) to allow fields
 * to be empty, which matches the database's nullable columns.
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
 * Validates the review's star rating, title, and comment.
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