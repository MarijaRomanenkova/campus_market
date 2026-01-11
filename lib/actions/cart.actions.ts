'use server';

/**
 * Shopping cart management functions for adding and removing invoices
 * @module CartActions
 * @group API
 */

import { cookies } from 'next/headers';
import { Invoice } from '@/types';
import { convertToPlainObject, formatError} from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { insertInvoiceSchema, insertCartSchema } from '../validators';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

/**
 * Calculates the total price for an array of invoices
 * 
 * @param invoices - Array of invoice objects with totalPrice property
 * @returns Object containing the calculated totalPrice
 */
function calcPrice(invoices: Invoice[]) {
  const totalPrice = invoices.reduce((sum, invoice) => sum + Number(invoice.totalPrice), 0);
  return { totalPrice };
}

/**
 * Adds an invoice to the user's cart
 * 
 * @param invoiceId - The unique identifier of the invoice to add
 * @returns Object containing success status, message, and updated cart data
 * 
 * @example
 * // In an invoice detail component
 * const handleAddToCart = async () => {
 *   const result = await addInvoiceToCart(invoice.id);
 *   
 *   if (result.success) {
 *     showNotification('Success', result.message);
 *   } else {
 *     showNotification('Error', result.message);
 *   }
 * };
 */
export async function addInvoiceToCart(invoiceId: string) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // Get cart
    const cart = await getMyCart();

    // Find invoice in database
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId },
    });

    if (!invoice) throw new Error('Invoice not found');

    // Check if invoice is already in the cart
    if (cart && cart.invoices.some(item => item.id === invoiceId)) {
      return {
        success: false,
        message: `Invoice #${invoice.invoiceNumber} is already in your cart`,
      };
    }

    let updatedCart;
    
    if (!cart) {
      // Create new cart object
      updatedCart = await prisma.cart.create({
        data: {
          userId,
          sessionCartId,
          invoices: {
            connect: [{ id: invoice.id }]
          },
          totalPrice: invoice.totalPrice,
        },
        include: {
          invoices: {
            include: {
              client: true
            }
          }
        }
      });
    } else {
      // Calculate new total price
      const newTotalPrice = Number(cart.totalPrice) + Number(invoice.totalPrice);
      
      // Update existing cart
      updatedCart = await prisma.cart.update({
        where: { id: cart.id },
        data: {
          invoices: {
            connect: [{ id: invoice.id }]
          },
          totalPrice: newTotalPrice,
        },
        include: {
          invoices: {
            include: {
              client: true
            }
          }
        }
      });
    }

    revalidatePath(`/invoice/${invoice.id}`);
    revalidatePath('/user/dashboard/client/cart');

    return {
      success: true,
      message: `Invoice #${invoice.invoiceNumber} added to cart`,
      cart: convertToPlainObject(updatedCart)
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

/**
 * Type definition for a cart with included invoice and client details
 */
type CartWithInvoices = Prisma.CartGetPayload<{
  include: {
    invoices: {
      include: {
        client: true
      }
    }
  }
}>;

/**
 * Retrieves the current user's cart with all invoice details
 * 
 * @returns The cart object with included invoices, or null if no cart exists
 * 
 * @example
 * // In a cart page component
 * const Cart = async () => {
 *   const cart = await getMyCart();
 *   
 *   if (!cart || cart.invoices.length === 0) {
 *     return <EmptyCart />;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Your Cart</h1>
 *       <CartItems items={cart.invoices} />
 *       <CartSummary totalPrice={cart.totalPrice} />
 *     </div>
 *   );
 * };
 */
export async function getMyCart(): Promise<CartWithInvoices | null> {
  try {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) return null;

    const cart = await prisma.cart.findFirst({
      where: { sessionCartId },
      include: {
        invoices: {
          include: {
            client: true
          }
        }
      }
    });

    // Convert Decimal values to plain JavaScript objects
    return cart ? convertToPlainObject(cart) : null;
  } catch (error) {
    console.error('Error getting cart:', error);
    return null;
  }
}

/**
 * Removes an invoice from the user's cart
 * 
 * @param invoiceId - The unique identifier of the invoice to remove
 * @returns Object containing success status, message, and updated cart data
 * 
 * @example
 * // In a cart item component
 * const CartItem = ({ invoice }) => {
 *   const handleRemove = async () => {
 *     const result = await removeInvoiceFromCart(invoice.id);
 *     
 *     if (result.success) {
 *       showNotification('Success', result.message);
 *     } else {
 *       showNotification('Error', result.message);
 *     }
 *   };
 *   
 *   return (
 *     <div className="cart-item">
 *       <p>Invoice #{invoice.invoiceNumber}</p>
 *       <p>${invoice.totalPrice}</p>
 *       <button onClick={handleRemove}>Remove</button>
 *     </div>
 *   );
 * };
 */
export async function removeInvoiceFromCart(invoiceId: string) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) throw new Error('Cart session not found');

    // Get invoice
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId },
    });
    if (!invoice) throw new Error('Invoice not found');

    // Get user cart
    const cart = await getMyCart();
    if (!cart) throw new Error('Cart not found');

    // Check if the invoice is in the cart
    if (!cart.invoices.some(item => item.id === invoiceId)) {
      return {
        success: false,
        message: `Invoice #${invoice.invoiceNumber} is not in your cart`,
      };
    }

    // Calculate new total price
    const newTotalPrice = Math.max(0, Number(cart.totalPrice) - Number(invoice.totalPrice));

    // Update cart in database
    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        invoices: {
          disconnect: [{ id: invoiceId }]
        },
        totalPrice: newTotalPrice,
      },
      include: {
        invoices: {
          include: {
            client: true
          }
        }
      }
    });

    revalidatePath(`/invoice/${invoice.id}`);
    revalidatePath('/user/dashboard/client/cart');

    return {
      success: true,
      message: `Invoice #${invoice.invoiceNumber} was removed from cart`,
      cart: convertToPlainObject(updatedCart)
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}


