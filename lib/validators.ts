/**
 * Data Validation Schemas Module
 * @module Lib/Validators
 * 
 * This module provides Zod validation schemas for various data structures used throughout the application.
 * Each schema defines the shape, types, and validation rules for a specific data entity or form.
 */

import { z } from 'zod';
import { formatNumberWithDecimal } from './utils';

// Create a custom currency schema type
const currency = z
  .number()
  .or(z.string())
  .pipe(
    z.coerce
      .number()
      .min(0, 'Price must be greater than 0')
      .transform((val) => Number(formatNumberWithDecimal(val)))
  );

// Invoice Items Schema
const invoiceItemsSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'Product is required'),
  description: z.string().min(1, 'Description is required').optional(),
  price: currency,
  quantity: z.number().int().positive('Quantity must be positive'),
  pricePerUnit: currency.optional(),
  totalPrice: currency.optional(),
  rate: z.string().optional(),
});

// Define constants
const PAYMENT_METHODS = ['CREDIT_CARD', 'PAYPAL', 'BANK_TRANSFER'];

/**
 * Product Insertion Schema
 * 
 * Validates data required to create a new product in the system.
 * @property {string} name - Product name (3-255 characters)
 * @property {string} categoryId - ID of the category the product belongs to
 * @property {number} price - Product price (minimum 0)
 */
export const insertProductSchema = z.object({
  name: z.string().min(3).max(255),
  categoryId: z.string().uuid('Invalid category ID'),
  images: z.array(z.string()),
  description: z.string().min(12, 'Description must be at least 12 characters'),
  price: z.coerce.number().min(0),
});

/**
 * Product Update Schema
 * 
 * Validates data for updating an existing product.
 * @property {string} id - Product ID
 * @property {string} name - Product name (3-255 characters)
 * @property {string} categoryId - ID of the category the product belongs to
 * @property {number} price - Product price (minimum 0)
 * @property {boolean} isArchived - Whether the product is archived
 * @property {Date|null} archivedAt - When the product was archived
 */
export const updateProductSchema = insertProductSchema.extend({
  id: z.string(),
  isArchived: z.boolean().optional(),
  archivedAt: z.date().nullable().optional(),
});

/**
 * Sign-In Form Schema
 * 
 * Validates user sign-in form data.
 * @property {string} email - User email address (must be valid email format)
 * @property {string} password - User password (minimum 8 characters)
 */
export const signInFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Sign-Up Form Schema
 * 
 * Validates user registration form data.
 * @property {string} name - User's full name (letters only, min 3 characters)
 * @property {string} email - User email address (must be valid email format)
 * @property {string} password - User password (min 8 chars with at least 2 numbers/special chars)
 * @property {string} confirmPassword - Confirmation password (must match password)
 */
export const signUpFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters" })
    .regex(/^[a-zA-Z\s]+$/, { 
      message: "Name can only contain letters and spaces" 
    }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .refine(
      (email) => email.endsWith('@campus.edu'),
      { message: "Please provide your student email to register" }
    ),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .refine(
      (password) => {
        // Count numbers and special characters
        const specialCharsCount = (password.match(/[0-9!@#$%^&*(),.?":{}|<>]/g) || []).length;
        return specialCharsCount >= 2;
      },
      { message: "Password must contain at least 2 numbers or special characters" }
    ),
  confirmPassword: z
    .string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

/**
 * Payment Method Schema
 * 
 * Validates the payment method selection.
 * @property {string} paymentMethod - Selected payment method (must be one of the predefined options)
 */
export const paymentMethodSchema = z.object({
  paymentMethod: z.enum(['PAYPAL', 'STRIPE']),
});

/**
 * Invoice Insertion Schema
 * 
 * Validates data required to create a new invoice.
 * @property {string} clientId - ID of the client receiving the invoice
 * @property {string} sellerId - ID of the seller issuing the invoice
 * @property {number} totalPrice - Total invoice amount
 * @property {array} items - Array of invoice line items
 */
export const insertInvoiceSchema = z.object({
  clientId: z.string(),
  sellerId: z.string(),
  totalPrice: z.coerce.number(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      productId: z.string(),
      quantity: z.coerce.number().min(1),
      price: z.coerce.number().min(0),
      name: z.string().optional(), // Invoice item name/description
    })
  ),
});

/**
 * Invoice Update Schema
 * 
 * Validates data for updating an existing invoice.
 * @property {string} id - Invoice ID
 * @property {number} totalPrice - Updated total invoice amount
 * @property {array} items - Updated array of invoice line items
 */
export const updateInvoiceSchema = z.object({
  id: z.string(),
  totalPrice: z.coerce.number(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      productId: z.string(),
      quantity: z.coerce.number().min(1),
      price: z.coerce.number().min(0),
    })
  ),
});

/**
 * Payment Update Schema
 * 
 * Validates data for updating a payment record.
 * @property {string} id - Payment ID
 * @property {string} paymentMethod - Selected payment method
 */
export const updatePaymentSchema = z.object({
  id: z.string(),
  paymentMethod: z.enum(['PAYPAL', 'STRIPE']),
});

// Schema for creating a payment
export const insertPaymentSchema = z.object({
  amount: currency,
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: 'Invalid payment method'
  }),
  invoiceIds: z.array(z.string().min(1, 'Invoice ID is required'))
});

// Schema for payment result
export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  email_address: z.string(),
  amount: currency,
  created_at: z.string()
});

/**
 * Update User Profile Schema
 * 
 * Validates data for updating a user's profile information.
 * @property {string} id - User ID
 * @property {string} name - User's updated full name
 * @property {string} email - User's updated email address (must be valid email format)
 * @property {string} role - User's role in the system
 */
export const updateUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().optional()
});

export const invoiceSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  sellerId: z.string(),
  isPaid: z.boolean(),
  paymentDueDate: z.date().or(z.string()),
  status: z.string(),
  issueDate: z.date().or(z.string()),
  items: z.array(
    z.object({
      id: z.string(),
      productId: z.string(),
      invoiceId: z.string(),
      quantity: z.number(),
      price: z.number(),
    })
  ),
});

/**
 * Cart Schema
 * 
 * Validates shopping cart data.
 * @property {string} userId - ID of the user who owns the cart
 * @property {number} totalPrice - Total price of all items in the cart
 * @property {array} items - Array of cart items with products and quantities
 */
export const cartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  sessionCartId: z.string(),
  totalPrice: z.number().or(z.string()).pipe(z.coerce.number().multipleOf(0.01)),
  createdAt: z.date().or(z.string().datetime()).default(() => new Date()),
  invoices: z.array(z.object({
    id: z.string().uuid()
  })).optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.coerce.number().min(1),
    })
  ),
});

/**
 * Insert Cart Schema
 * 
 * Validates data for creating a new shopping cart.
 * Omits certain fields that are auto-generated.
 */
export const insertCartSchema = cartSchema.omit({ 
  id: true, 
  createdAt: true,
  invoices: true 
});

/**
 * Update Cart Schema
 * 
 * Validates data for updating an existing shopping cart.
 * Makes all fields optional except essential identifiers.
 */
export const updateCartSchema = cartSchema.partial().omit({ 
  id: true, 
  createdAt: true 
});

/**
 * Update Profile Schema
 * 
 * Validates data for updating a user's profile information.
 * @property {string} name - User's display name
 * @property {string} fullName - User's complete legal name
 * @property {string} phoneNumber - User's contact phone number
 * @property {string} companyId - ID of the company the user is associated with (optional)
 * @property {string} address - User's address information (optional)
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  fullName: z.string().optional(),
  phoneNumber: z.string().optional(),
  companyId: z.string().optional(),
  address: z.string().optional(),
});

/**
 * Product Assignment Schema
 * 
 * Validates data for assigning a product to a seller.
 * @property {string} productId - ID of the product being assigned
 * @property {string} sellerId - ID of the seller receiving the assignment
 * @property {string} statusId - Status ID for the assignment
 * @property {string} clientId - ID of the client requesting the product
 */
export const insertProductAssignmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  sellerId: z.string().min(1, 'Seller is required'),
  statusId: z.string().optional(), // Optional because createProductAssignment sets it internally to IN_PROGRESS
  clientId: z.string().min(1, 'Client is required'),
});

/**
 * Update Product Assignment Schema
 * 
 * Validates data for updating an existing product assignment.
 * Makes all fields from the insertion schema optional.
 */
export const updateProductAssignmentSchema = insertProductAssignmentSchema.partial();

/**
 * Category Schema
 * 
 * Validates data for creating and updating product categories.
 * @property {string} name - Category name (must be unique)
 * @property {string} description - Optional category description
 */
export const insertCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});
