'use server';

/**
 * Invoice management functions for creating, retrieving, and updating invoices
 * @module InvoiceActions
 * @group API
 */

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError, round2 } from '../utils';
import { revalidatePath } from 'next/cache';
import { insertInvoiceSchema, updateInvoiceSchema } from '../validators';
import { z } from 'zod';

/**
 * Calculate invoice totals (without tax)
 * @param items - Array of invoice items with price and quantity
 * @returns Object containing subtotal and total as formatted strings
 */
export async function calcTotal(items: Array<{price: number, quantity?: number, qty?: number}>) {
  // Handle both old schema (InvoiceItems with qty) and new schema (items with quantity)
  const total = round2(
    items.reduce((acc, item) => {
      // Support both qty and quantity fields for backward compatibility
      const quantity = 'quantity' in item && item.quantity !== undefined ? item.quantity : (item.qty ?? 1);
      return acc + Number(item.price) * quantity;
    }, 0)
  );

  return {
    subtotal: total.toFixed(2),
    total: total.toFixed(2),
  };
}

/**
 * Retrieves all invoices where the specified user is the client
 * 
 * @param userId - The unique identifier of the client user
 * @returns Array of invoices with client, seller, and item details
 * 
 * @example
 * // In a client dashboard component
 * const incomingInvoices = await getAllIncomingInvoices(session.user.id);
 * 
 * return (
 *   <div>
 *     <h2>Your Invoices</h2>
 *     {incomingInvoices.map(invoice => (
 *       <InvoiceCard 
 *         key={invoice.id}
 *         number={invoice.invoiceNumber}
 *         seller={invoice.seller.name}
 *         amount={invoice.totalPrice}
 *         date={invoice.createdAt}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllIncomingInvoices(userId: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId: userId
      },
      include: {
        client: true,
        seller: true,
        items: true,
        payment: {
          select: {
            isPaid: true,
            paidAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the invoices to add direct isPaid and paidAt fields for easier access
    const enhancedInvoices = invoices.map(invoice => ({
      ...invoice,
      isPaid: invoice.payment?.isPaid || false,
      paidAt: invoice.payment?.paidAt || null
    }));
    
    return convertToPlainObject(enhancedInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
}

/**
 * Retrieves all invoices where the specified user is the seller
 * 
 * @param sellerId - The unique identifier of the seller user
 * @returns Array of invoices with client, seller, and item details
 * 
 * @example
 * // In a seller dashboard component
 * const outgoingInvoices = await getAllOutgoingInvoices(session.user.id);
 * 
 * return (
 *   <div>
 *     <h2>Invoices You've Sent</h2>
 *     {outgoingInvoices.map(invoice => (
 *       <InvoiceCard 
 *         key={invoice.id}
 *         number={invoice.invoiceNumber}
 *         client={invoice.client.name}
 *         amount={invoice.totalPrice}
 *         date={invoice.createdAt}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllOutgoingInvoices(sellerId: string) {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        sellerId
      },
      include: {
        client: true,
        seller: true,
        items: true,
        payment: {
          select: {
            isPaid: true,
            paidAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform the invoices to add direct isPaid and paidAt fields for easier access
    const enhancedInvoices = invoices.map(invoice => ({
      ...invoice,
      isPaid: invoice.payment?.isPaid || false,
      paidAt: invoice.payment?.paidAt || null
    }));
    
    return convertToPlainObject(enhancedInvoices);
  } catch (error) {
    console.error('Error fetching outgoing invoices:', error);
    return [];
  }
}

/**
 * Creates a new invoice with the specified client, seller, and items
 * 
 * @param data - Invoice data validated against the insert invoice schema
 * @returns Object containing success status, message, and created invoice data
 * @throws Will return error object if user is not authenticated or if validation fails
 * 
 * @example
 * // In an invoice creation form
 * async function handleSubmit(formData) {
 *   const invoiceData = {
 *     clientId: selectedClient.id,
 *     sellerId: session.user.id,
 *     invoiceItem: [
 *       {
 *         productId: selectedTask.id,
 *         name: selectedTask.name,
 *         qty: hoursWorked,
 *         price: selectedTask.price
 *       }
 *     ]
 *   };
 *   
 *   const { success, message, data } = await createInvoice(invoiceData);
 *   
 *   if (success) {
 *     router.push(`/invoice/${data.id}`);
 *     showNotification('Success', 'Invoice created successfully');
 *   } else {
 *     showNotification('Error', message);
 *   }
 * }
 */
export async function createInvoice(data: z.infer<typeof insertInvoiceSchema>) {
  try {
    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        message: 'You must be logged in to create an invoice'
      };
    }
    
    // Parse and validate input data
    const invoice = insertInvoiceSchema.parse(data);
    const { total } = await calcTotal(invoice.items);
    
    // Find a default product to use for items without a product ID
    const defaultProduct = await prisma.product.findFirst({
      select: { id: true }
    });
    
    if (!defaultProduct) {
      return {
        success: false,
        message: 'No products found in the system. Please create a product first.'
      };
    }
    
    // Find or create a default product assignment to use
    let defaultAssignmentId = null;
    
    const anyAssignment = await prisma.productAssignment.findFirst({
      where: {
        clientId: invoice.clientId,
        sellerId: invoice.sellerId,
      },
      select: { id: true }
    });
    
    if (anyAssignment) {
      defaultAssignmentId = anyAssignment.id;
    } else {
      // We need to create a new assignment
      const productStatus = await prisma.productAssignmentStatus.findFirst({
        select: { id: true }
      });
      
      if (!productStatus) {
        return {
          success: false,
          message: 'Product assignment status not found in the system. Please contact support.'
        };
      }
      
      // Create a default assignment
      const newAssignment = await prisma.productAssignment.create({
        data: {
          productId: defaultProduct.id,
          clientId: invoice.clientId,
          sellerId: invoice.sellerId,
          statusId: productStatus.id
        }
      });
      
      defaultAssignmentId = newAssignment.id;
    }
    
    // Create the invoice
    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        clientId: invoice.clientId,
        sellerId: invoice.sellerId,
        totalPrice: total
      }
    });
    
    // Create each invoice item individually
    const invoiceItems = [];
    
    for (const item of invoice.items) {
      // If product ID is missing or empty, use the default product
      const productId = (item.productId && item.productId.trim() !== '') 
        ? item.productId 
        : defaultProduct.id;
      
      // Try to find a product-specific assignment first
      let assignmentId = defaultAssignmentId;
      
      if (productId !== defaultProduct.id) {
        const productAssignment = await prisma.productAssignment.findFirst({
          where: {
            productId: productId,
            clientId: invoice.clientId,
            sellerId: invoice.sellerId
          },
          select: { id: true }
        });
        
        if (productAssignment) {
          assignmentId = productAssignment.id;
        }
      }
      
      // Check if this product assignment has already been invoiced
      const existingInvoiceItem = await prisma.invoiceItem.findFirst({
        where: {
          assignmentId: assignmentId
        },
        include: {
          invoice: {
            select: {
              invoiceNumber: true
            }
          }
        }
      });
      
      // Use the name from the form item, or fallback to default
      // If an existing invoice item exists, append "(Additional Invoice)" to the name
      let invoiceItemName = item.name || "Service";
      if (existingInvoiceItem) {
        console.warn(`Creating additional invoice for product assignment that was already invoiced in Invoice #${existingInvoiceItem.invoice.invoiceNumber}`);
        // Only append if it's not already marked as additional
        if (!invoiceItemName.includes("Additional Invoice")) {
          invoiceItemName = `${invoiceItemName} (Additional Invoice)`;
        }
      }
      
      // Create the invoice item
      const invoiceItem = await prisma.invoiceItem.create({
        data: {
          invoiceId: newInvoice.id,
          productId: productId,
          name: invoiceItemName,
          qty: item.quantity || 1,
          price: item.price,
          hours: 1,
          assignmentId: assignmentId
        }
      });
      
      invoiceItems.push(invoiceItem);
    }
    
    // Fetch the complete invoice data
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: newInvoice.id },
      include: {
        items: true,
        client: {
          select: {
            name: true,
            email: true
          }
        },
        seller: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!completeInvoice) {
      throw new Error('Failed to retrieve the created invoice');
    }
    
    // Send a notification to the client about the new invoice
    try {
      // For invoices, we need to find the right product assignment to notify about
      // This should be the primary product assignment related to this invoice
      let primaryProductAssignment = null;
      
      // Find the product assignment that this invoice is primarily for
      // First, check if we have a primary assignment indicated by the invoice items
      for (const item of invoiceItems) {
        if (item.assignmentId) {
          const productAssignment = await prisma.productAssignment.findUnique({
            where: { id: item.assignmentId },
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });
          
          if (productAssignment) {
            primaryProductAssignment = productAssignment;
            break; // Use the first valid assignment we find
          }
        }
      }
      
      // If we found a valid product assignment, send a notification
      if (primaryProductAssignment) {
        // Import the notification function dynamically to avoid circular dependencies
        const { createProductAssignmentNotification } = await import('./messages.actions');
        
        // Create notification message - only once per invoice
        await createProductAssignmentNotification(
          primaryProductAssignment.id,
          `${completeInvoice.seller.name} has issued invoice #${completeInvoice.invoiceNumber} for $${total}. Please review and process payment.`,
          'invoice-created'
        );
      }
    } catch (notificationError) {
      console.error('Error sending invoice notification:', notificationError);
      // Continue even if notification fails
    }
    
    try {
      // Move revalidation to a separate try/catch to avoid affecting the main flow
      revalidatePath('/user/dashboard/seller/invoices');
    } catch (revalidateError) {
      console.error('Error revalidating paths:', revalidateError);
      // Continue even if revalidation fails
    }
    
    return {
      success: true,
      message: 'Invoice created successfully',
      data: convertToPlainObject(completeInvoice)
    };
  } catch (error) {
    console.error('Invoice creation error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create invoice'
    };
  }
}

/**
 * Updates an existing invoice with new information
 * 
 * @param data - Updated invoice data validated against the update invoice schema
 * @returns Object containing success status, message, and updated invoice data
 * @throws Will return error object if user is not authenticated or if validation fails
 * 
 * @example
 * // In an invoice edit form
 * async function handleUpdate(formData) {
 *   const updatedData = {
 *     id: invoice.id,
 *     invoiceItem: invoice.items.map(item => ({
 *       ...item,
 *       qty: form.get(`qty-${item.id}`) || item.qty,
 *       price: form.get(`price-${item.id}`) || item.price
 *     }))
 *   };
 *   
 *   const { success, message } = await updateInvoice(updatedData);
 *   
 *   if (success) {
 *     router.refresh();
 *     showNotification('Success', message);
 *   } else {
 *     showNotification('Error', message);
 *   }
 * }
 */
export async function updateInvoice(data: z.infer<typeof updateInvoiceSchema>) {
  try {
    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        message: 'You must be logged in to update an invoice'
      };
    }
    
    const invoice = updateInvoiceSchema.parse(data);
    const { total } = await calcTotal(invoice.items);

    // Update invoice total price only, items are updated separately
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        totalPrice: total,
      },
    });
    revalidatePath('/invoices');
    revalidatePath(`/invoice/${updatedInvoice.id}`);
    return {
      success: true,
      message: 'Invoice updated successfully',
      data: convertToPlainObject(updatedInvoice)
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update invoice'
    };
  }
}

/**
 * Retrieves an invoice by its unique invoice number
 * 
 * @param invoiceNumber - The unique invoice number (e.g., INV-12345)
 * @returns The invoice object with client, seller, and item details, or null if not found
 * 
 * @example
 * // In an invoice detail component
 * const invoice = await getInvoiceByNumber('INV-12345678');
 * 
 * if (invoice) {
 *   return (
 *     <div className="invoice-details">
 *       <h1>Invoice #{invoice.invoiceNumber}</h1>
 *       <div className="parties">
 *         <div className="from">
 *           <h3>From: {invoice.seller.name}</h3>
 *           <p>{invoice.seller.email}</p>
 *         </div>
 *         <div className="to">
 *           <h3>To: {invoice.client.name}</h3>
 *           <p>{invoice.client.email}</p>
 *         </div>
 *       </div>
 *       <InvoiceItemsList items={invoice.items} />
 *       <div className="total">
 *         <h3>Total: ${invoice.totalPrice}</h3>
 *       </div>
 *     </div>
 *   );
 * }
 */
export async function getInvoiceByNumber(invoiceNumber: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            name: true,
            email: true,
          },
        },
        items: true,
        payment: {
          select: {
            isPaid: true,
            paidAt: true
          }
        }
      },
    });

    if (!invoice) return null;
    
    // Add direct isPaid and paidAt fields for easier access
    const enhancedInvoice = {
      ...invoice,
      isPaid: invoice.payment?.isPaid || false,
      paidAt: invoice.payment?.paidAt || null
    };

    return convertToPlainObject(enhancedInvoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}
