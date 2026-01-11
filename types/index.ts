import { z } from 'zod';
import {
  insertProductSchema,
  insertCartSchema,
  insertInvoiceSchema,
  paymentResultSchema,
  invoiceSchema,
} from '@/lib/validators';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Core application types
 * @packageDocumentation
 */

/**
 * User information with authentication details and profile
 */
export interface Product {
  /** Product ID */
  id: string;
  /** Product name */
  name: string;
  /** Product description */
  description?: string | null;
  /** Product price */
  price: number;
  /** Product images */
  images: string[];
  /** Product category ID */
  categoryId: string;
  /** Product created at timestamp */
  createdAt: Date;
  /** Product updated at timestamp */
  updatedAt?: Date;
  /** Whether product is archived */
  isArchived: boolean;
  /** When product was archived */
  archivedAt?: Date | null;
  /** Product author */
  author?: {
    id?: string;
    name?: string;
    email?: string;
    clientRating?: number | null;
  };
  /** Product category */
  category?: {
    id: string;
    name: string;
  };
}

export type Cart = {
  /** Unique identifier */
  id: string;
  /** User identifier */
  userId?: string;
  /** Session cart identifier */
  sessionCartId: string;
  /** Invoices associated with the cart */
  invoices: Invoice[];
  /** Total price of the cart */
  totalPrice: string | Decimal;
  /** Creation date */
  createdAt: Date;
};

export type Payment = {
  /** Unique identifier */
  id: string;
  /** Creation date */
  createdAt: Date;
  /** Payment status */
  isPaid: boolean;
  /** Date of payment */
  paidAt: Date | null;
  /** Total price */
  totalPrice: string;
  /** Tax price */
  taxPrice: string;
  /** Payment method */
  paymentMethod: string;
  /** User information */
  user: {
    /** User name */
    name: string;
    /** User email */
    email: string;
  };
  /** Invoices associated with the payment */
  invoices: {
    /** Invoice identifier */
    id: string;
    /** Invoice number */
    invoiceNumber: string;
    /** Total price of the invoice */
    totalPrice: number;
    /** Client information */
    client: {
      /** Client name */
      name: string;
    };
  }[];
  /** Payment result details */
  paymentResult?: {
    /** Unique identifier */
    id: string;
    /** Payment status */
    status: string;
    /** Payment amount */
    amount: string;
    /** Email address */
    email_address: string;
    /** Creation date */
    created_at: string;
  };
};

export type PaymentResult = {
  /** Unique identifier */
  id: string;
  /** Payment status */
  status: string;
  /** Email address */
  email_address: string;
  /** Price paid */
  pricePaid: string;
  /** Payment amount */
  amount: string;
  /** Creation date */
  created_at: string;
};

export type UpdatePaymentToPaidParams = {
  /** Payment identifier */
  paymentId: string;
  /** Payment result details */
  paymentResult: PaymentResult;
};

export type InvoiceItem = {
  /** Unique identifier */
  id: string;
  /** Item name */
  name: string;
  /** Product identifier */
  productId: string;
  /** Item price */
  price: string | Decimal;
  /** Item quantity */
  qty?: number;
  /** Item hours */
  hours?: number;
  /** Item description */
  description?: string;
  /** Invoice identifier */
  invoiceId: string;
};

export type Invoice = {
  /** Unique identifier */
  id: string;
  /** Invoice number */
  invoiceNumber: string;
  /** Total price */
  totalPrice: string | Decimal;
  /** Client identifier */
  clientId: string;
  /** Seller identifier */
  sellerId: string;
  /** Client information */
  client: {
    /** Client name */
    name: string;
    /** Client email */
    email: string;
  };
  /** Seller information */
  seller: {
    /** Seller name */
    name: string;
    /** Seller email */
    email: string;
  };
  /** Invoice items */
  items: InvoiceItem[];
  /** Creation date */
  createdAt: Date;
  /** Payment status */
  isPaid?: boolean;
  /** Date of payment */
  paidAt?: Date | null;
};

export type InvoiceItems = {
  /** Item name */
  name: string;
  /** Product identifier */
  productId: string;
  /** Item price */
  price: string;
  /** Item quantity */
  qty?: number;
};

export type InvoiceItemsArray = InvoiceItems[];

export type CartActionResponse = {
  /** Success status */
  success: boolean;
  /** Response message */
  message?: string;
  /** Cart information */
  cart?: Cart;
}

export type Category = {
  /** Unique identifier */
  id: string;
  /** Category name */
  name: string;
  /** Category description */
  description: string | null;
  /** Count of products in the category */
  _count: {
    products: number;
  };
};

export interface ExtendedUser {
  /** Unique identifier */
  id: string;
  /** Display name */
  name?: string | null;
  /** Email address */
  email?: string | null;
  /** User image */
  image?: string | null;
  /** User role */
  role?: string;
  /** Full name */
  fullName?: string | null;
  /** Phone number */
  phoneNumber?: string | null;
  /** Company identifier */
  companyId?: string | null;
  /** User address */
  address?: Record<string, unknown> | string | null;
  /** Client rating */
  clientRating?: number | null;
  /** Seller rating */
  sellerRating?: number | null;
}

// Note: ProductWithOwner interface and normalizeProductOwner function were removed (April 2025) 
// after standardizing on createdById across the database schema and application code.

export interface ProductAssignment {
  /** Product Assignment ID */
  id: string;
  /** Product Assignment Status */
  status: { name: string };
  /** Associated Product */
  product: {
    id: string;
    name: string;
    description: string;
    dueDate: string | null;
  };
  /** Client who requested the product */
  client: {
    id?: string;
    name: string;
    email: string;
    image: string | null;
  };
  /** Seller assigned to the product */
  seller?: {
    id?: string;
    name: string;
    email: string;
    image: string | null;
  };
  /** IDs for references */
  clientId?: string;
  sellerId?: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Completion timestamp */
  completedAt?: string | null;
  /** Invoice information */
  invoices: ProductAssignmentInvoice[];
  /** Associated conversation */
  conversation: { id: string } | null;
  /** Reviews array from database */
  reviews?: Array<{
    rating: number;
    description: string;
    createdAt: string | Date;
    reviewType: {
      name: string;
    };
  }>;
  /** Whether client review of seller exists */
  wasReviewed?: boolean;
  /** Client review rating (1-5) */
  reviewRating?: number;
  /** Client review feedback text */
  reviewFeedback?: string;
  /** Whether seller review of client exists */
  wasClientReviewed?: boolean;
  /** Seller review rating of client (1-5) */
  clientReviewRating?: number;
  /** Seller review feedback of client */
  clientReviewFeedback?: string;
}

/**
 * Simplified invoice type used in product assignment contexts
 */
export interface ProductAssignmentInvoice {
  /** Unique identifier */
  id: string;
  /** Invoice status */
  status: string;
  /** Invoice amount */
  amount: number;
  /** Creation date */
  createdAt: string;
}

