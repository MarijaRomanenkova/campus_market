/**
 * Application Constants
 * @module Lib/Constants
 * 
 * This module defines application-wide constants used throughout the codebase.
 * Constants are categorized by function and provide default values when environment variables are not set.
 */

/**
 * Application name - Used for branding, email sender name, and metadata
 * @type {string}
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Campmar";

/**
 * Application description - Used for SEO and metadata
 * @type {string}
 */
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Campus Market is a second-hand items marketplace for students to trade their used items in dormitories.";

/**
 * Server URL - Base URL for the application
 * @type {string}
 */
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

/**
 * Maximum number of products to display in the latest products section
 * @type {number}
 */
export const LATEST_TASKS_LIMIT = Number(process.env.LATEST_TASKS_LIMIT) || 12;

/**
 * Default values for the sign-in form
 * @type {Object}
 */
export const signInDefaultValues = {
  email: '',
  password: '',
};

/**
 * Default values for the sign-up form
 * @type {Object}
 */
export const signUpDefaultValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

/**
 * Default values for the shipping address form
 * @type {Object}
 */
export const shippingAddressDefaultValues = {
  fullName: '',
  streetAddress: '',
  city: '',
  postalCode: '',
  country: '',
};

/**
 * Available payment methods for the application
 * @type {string[]}
 */
export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(', ').map(method => method.toUpperCase())
  : ['PAYPAL', 'STRIPE'];

/**
 * Default payment method for new users
 * @type {string}
 */
export const DEFAULT_PAYMENT_METHOD =
  (process.env.DEFAULT_PAYMENT_METHOD || 'PayPal').toUpperCase();

/**
 * Number of items to display per page in paginated lists
 * @type {number}
 */
export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 12;

/**
 * Default values for the product creation form
 * @type {Object}
 */
export const productDefaultValues = {
  name: '',
  slug: '',
  categoryId: '',  // Changed from category
  images: [] as string[],  // Added type annotation
  description: '',
  price: 0
};

/**
 * Available user roles in the application
 * @type {string[]}
 */
export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(', ')
  : ['admin', 'user'];

/**
 * Email address used as the sender for system emails
 * @type {string}
 */
export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

