'use server';

/**
 * Product assignment management functions for creating, retrieving, updating and deleting product assignments
 * @module ProductAssignmentActions
 * @group API
 * 
 * This module provides server-side functions for managing product assignments, including:
 * - Creating and updating product assignments
 * - Managing product assignment statuses
 * - Handling client and seller reviews
 * - Processing product completion and acceptance
 * - Managing invoice relationships
 * - Calculating and updating user ratings
 */

import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { insertProductAssignmentSchema } from '@/lib/validators';
import { z } from 'zod';
import { auth } from '@/auth';

/**
 * Type guard to check if an object is a Prisma Decimal
 * 
 * @param value - The value to check
 * @returns True if the value is a Prisma Decimal object
 */
function isDecimal(value: unknown): value is { toString(): string } {
  return (
    typeof value === 'object' && 
    value !== null && 
    'constructor' in value && 
    value.constructor !== null &&
    typeof value.constructor === 'function' &&
    value.constructor.name === 'Decimal' &&
    typeof (value as { toString?: () => string }).toString === 'function'
  );
}

/**
 * Helper function to serialize data and convert Decimal objects to regular numbers
 * 
 * @param data - The data to serialize
 * @returns The serialized data with Decimal values converted to numbers
 * 
 * @example
 * // Convert Prisma data with Decimal values to plain objects
 * const productData = await prisma.product.findUnique({
 *   where: { id: productId }
 * });
 * const serializedData = await serializeData(productData);
 */
export async function serializeData(data: unknown): Promise<unknown> {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Check if it's a Prisma Decimal type
  if (isDecimal(data)) {
    return parseFloat(data.toString());
  }
  
  // If it's an array, process each item
  if (Array.isArray(data)) {
    return await Promise.all((data as unknown[]).map((item: unknown) => serializeData(item)));
  }
  
  // If it's an object, process each property
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, unknown> = {};
    const obj = data as Record<string, unknown>;
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = await serializeData(obj[key]);
      }
    }
    return result;
  }
  
  // For primitive types, return as is
  return data;
}

/**
 * Type definition for product assignments with detailed seller view information
 * Includes product details, client information, status, and invoice data
 * 
 * @typedef {Object} ProductAssignmentWithSellerDetails
 * @property {Object} product - Product details including name, price, and category
 * @property {Object} client - Client information including name and email
 * @property {Object} status - Assignment status with name and color
 * @property {Array} invoiceItems - Related invoice items with payment status
 */
type ProductAssignmentWithSellerDetails = Prisma.ProductAssignmentGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
        price: true;
        description: true;
        category: {
          select: {
            name: true;
          };
        };
      };
    };
    client: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    seller: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    status: {
      select: {
        name: true;
        color: true;
      };
    };
    invoiceItems: {
      include: {
        invoice: {
          select: {
            id: true;
            invoiceNumber: true;
            paymentId: true;
            payment: {
              select: {
                isPaid: true;
              };
            };
          };
        };
      };
    };
  };
}>;

/**
 * Paginated list of product assignments for seller view
 * 
 * @typedef {Object} ProductAssignmentSellerList
 * @property {Array<ProductAssignmentWithSellerDetails>} data - Array of product assignments
 * @property {number} totalPages - Total number of pages
 */
type ProductAssignmentSellerList = {
  /** Array of product assignments with detailed information */
  data: ProductAssignmentWithSellerDetails[];
  /** Total number of pages */
  totalPages: number;
};

/**
 * Type definition for product assignments with client view information
 * Includes minimal product details, seller name, and status
 * 
 * @typedef {Object} ProductAssignmentWithClientDetails
 * @property {Object} product - Product details including name and price
 * @property {Object} seller - Seller's basic information
 * @property {Object} status - Assignment status with name and color
 */
type ProductAssignmentWithClientDetails = Prisma.ProductAssignmentGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
        price: true;
        description: true;
        category: {
          select: {
            name: true;
          };
        };
      };
    };
    seller: {
      select: {
        id: true;
        name: true;
      };
    };
    status: {
      select: {
        name: true;
        color: true;
      };
    };
  };
}>;

/**
 * Paginated list of product assignments for client view
 * 
 * @typedef {Object} ProductAssignmentClientList
 * @property {Array<ProductAssignmentWithClientDetails>} data - Array of product assignments
 * @property {number} totalPages - Total number of pages
 */
type ProductAssignmentClientList = {
  /** Array of product assignments with client-focused information */
  data: ProductAssignmentWithClientDetails[];
  /** Total number of pages */
  totalPages: number;
};

/**
 * Retrieves all product assignments for a specific seller
 * 
 * @param sellerId - The unique identifier of the seller
 * @returns Paginated list of product assignments with details relevant to sellers
 * 
 * @example
 * // In a seller dashboard component
 * const { data: assignments, totalPages } = await getAllProductAssignmentsBySellerId(user.id);
 * return (
 *   <div>
 *     {assignments.map(assignment => (
 *       <AssignmentCard 
 *         key={assignment.id}
 *         productName={assignment.product.name}
 *         clientName={assignment.client.name}
 *         status={assignment.status.name}
 *         price={assignment.product.price}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllProductAssignmentsBySellerId(
  sellerId: string
): Promise<ProductAssignmentSellerList> {
  const assignments = await prisma.productAssignment.findMany({
    where: { sellerId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          category: {
            select: {
              name: true
            }
          }
        }
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          clientRating: true
        }
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      status: {
        select: {
          name: true,
          color: true
        }
      },
      invoiceItems: {
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              paymentId: true,
              payment: {
                select: {
                  isPaid: true
                }
              }
            }
          }
        }
      },
      reviews: {
        select: {
          rating: true,
          description: true,
          reviewerId: true,
          reviewType: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Enhance the data with review flags
  const enhancedAssignments = assignments.map(assignment => {
    const clientReview = assignment.reviews?.find(
      review => review.reviewType.name === 'Client Review'
    );
    
    const sellerReview = assignment.reviews?.find(
      review => review.reviewType.name === 'Seller Review' && 
      review.reviewerId === sellerId
    );
    
    return {
      ...assignment,
      sellerId: assignment.sellerId, // Explicitly ensure sellerId is included
      clientId: assignment.clientId, // Explicitly ensure clientId is included
      wasReviewed: !!clientReview,
      wasClientReviewed: !!sellerReview
    };
  });

  const plainData = convertToPlainObject(enhancedAssignments);

  return {
    data: plainData,
    totalPages: Math.ceil(assignments.length / 10)
  };
}

/**
 * Retrieves all product assignments for a specific client
 * 
 * @param clientId - The unique identifier of the client
 * @returns Paginated list of product assignments with details relevant to clients
 * 
 * @example
 * // In a client dashboard component
 * const { data: assignments } = await getAllProductAssignmentsByClientId(user.id);
 * return (
 *   <div>
 *     {assignments.map(assignment => (
 *       <ProductCard 
 *         key={assignment.id}
 *         productName={assignment.product.name}
 *         sellerName={assignment.seller.name}
 *         status={assignment.status.name}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllProductAssignmentsByClientId(
  clientId: string
): Promise<ProductAssignmentClientList> {
  const assignments = await prisma.productAssignment.findMany({
    where: { clientId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
          category: {
            select: {
              name: true
            }
          }
        }
      },
      seller: {
        select: {
          id: true,
          name: true
        }
      },
      status: {
        select: {
          name: true,
          color: true
        }
      },
      reviews: {
        select: {
          rating: true,
          description: true,
          reviewerId: true,
          reviewType: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Enhance the data with review flags
  const enhancedAssignments = assignments.map(assignment => {
    const clientReview = assignment.reviews?.find(
      review => review.reviewType.name === 'Client Review' && 
      review.reviewerId === clientId
    );
    
    const sellerReview = assignment.reviews?.find(
      review => review.reviewType.name === 'Seller Review'
    );
    
    return {
      ...assignment,
      wasReviewed: !!clientReview,
      wasClientReviewed: !!sellerReview
    };
  });

  // Serialize the data to convert Decimal types to regular numbers
  const serializedData = await serializeData(enhancedAssignments) as ProductAssignmentWithClientDetails[];

  return {
    data: serializedData,
    totalPages: Math.ceil(assignments.length / 10)
  };
}

/**
 * Retrieves a single product assignment by its ID with comprehensive details
 * 
 * @param id - The unique identifier of the product assignment
 * @returns Object containing success status, message, and product assignment data if found
 * 
 * @example
 * // In a product assignment detail component
 * const { success, data, message } = await getProductAssignmentById('assignment-123');
 * 
 * if (success) {
 *   return (
 *     <div>
 *       <h1>{data.product.name}</h1>
 *       <p>Client: {data.client.name}</p>
 *       <p>Seller: {data.seller.name}</p>
 *       <StatusBadge status={data.status.name} color={data.status.color} />
 *     </div>
 *   );
 * } else {
 *   return <ErrorMessage message={message} />;
 * }
 */
export async function getProductAssignmentById(id: string) {
  try {
    // First fetch the product assignment with basic information
    const assignment = await prisma.productAssignment.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
            images: true,
            category: {
              select: {
                name: true
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        status: {
          select: {
            name: true,
            color: true
          }
        },
        invoiceItems: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                paymentId: true,
                payment: {
                  select: {
                    isPaid: true
                  }
                }
              }
            }
          }
        },
        // Include reviews related to this assignment
        reviews: {
          select: {
            rating: true,
            description: true,
            createdAt: true,
            reviewType: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return {
        success: false,
        message: 'Product assignment not found'
      };
    }
    
    // Add wasReviewed flag and review data
    const clientReview = assignment.reviews?.find(
      (review: { reviewType: { name: string } }) => review.reviewType.name === 'Client Review'
    );
    
    // Find seller review of client if exists
    const sellerReview = assignment.reviews?.find(
      (review: { reviewType: { name: string } }) => review.reviewType.name === 'Seller Review'
    );
    
    // Format dates to ensure they're proper ISO strings
    const enhancedAssignment = {
      ...assignment,
      createdAt: assignment.createdAt.toISOString(),
      // No updatedAt in the response, so set it to the createdAt for consistency
      updatedAt: assignment.createdAt.toISOString(),
      wasReviewed: !!clientReview,
      reviewRating: clientReview?.rating || null,
      reviewFeedback: clientReview?.description || null,
      wasClientReviewed: !!sellerReview,
      clientReviewRating: sellerReview?.rating || null, 
      clientReviewFeedback: sellerReview?.description || null,
      sellerId: assignment.seller?.id,
      clientId: assignment.client.id,
      reviews: assignment.reviews // Keep the reviews array for referencing in the UI
    };
    
    // Serialize the data to convert any Decimal types to regular numbers
    const serializedData = await serializeData(enhancedAssignment);

    return {
      success: true,
      data: serializedData
    };
  } catch (error) {
    console.error('Error fetching product assignment:', error);
    return {
      success: false,
      message: 'Failed to fetch product assignment'
    };
  }
}

/**
 * Creates a new product assignment
 * 
 * @param data - Product assignment data including product ID, seller ID, client ID, and status ID
 * @returns Object containing success status, message, and the created assignment data
 * 
 * @example
 * // In a product assignment form component
 * async function handleSubmit(formData) {
 *   const assignmentData = {
 *     productId: formData.productId,
 *     sellerId: selectedContractor.id,
 *     clientId: currentUser.id,
 *     statusId: openStatusId
 *   };
 *   
 *   const { success, message, data } = await createProductAssignment(assignmentData);
 *   
 *   if (success) {
 *     router.push(`/assignments/${data.id}`);
 *   } else {
 *     setError(message);
 *   }
 * }
 */
export async function createProductAssignment(
  data: z.infer<typeof insertProductAssignmentSchema>
) {
  try {
    // Get the IN_PROGRESS status ID
    const inProgressStatus = await prisma.productAssignmentStatus.findFirst({
      where: { name: 'IN_PROGRESS' }
    });

    if (!inProgressStatus) {
      throw new Error('IN_PROGRESS status not found');
    }

    const assignment = await prisma.productAssignment.create({
      data: {
        productId: data.productId,
        sellerId: data.sellerId,
        clientId: data.clientId,
        statusId: inProgressStatus.id
      },
      include: {
        seller: {
          select: { name: true }
        },
        product: {
          select: { name: true }
        }
      }
    });

    // Create a notification in the messenger
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { createProductAssignmentNotification } = await import('./messages.actions');
      
      // Create notification message
      await createProductAssignmentNotification(
        assignment.id,
        `Product "${assignment.product.name}" is assigned to ${assignment.seller.name}`,
        'status-update'
      );
    } catch (error) {
      console.error('Failed to send assignment notification message:', error);
      // Don't throw here, just log - we still want to create the assignment even if notification fails
    }

    revalidatePath('/user/dashboard/client/product');
    revalidatePath('/user/dashboard/messages');
    
    return {
      success: true,
      message: 'Product assigned successfully',
      data: assignment
    };
  } catch (error) {
    console.error('Error creating product assignment:', error);
    return {
      success: false,
      message: 'Failed to assign product'
    };
  }
}

/**
 * Updates a product assignment's status
 * 
 * @param id - The product assignment ID
 * @param statusId - The new status ID
 * @returns Result with success status and message
 * 
 * @example
 * // In a product status update component
 * const handleStatusChange = async (newStatusId) => {
 *   const result = await updateProductAssignment(productId, newStatusId);
 *   
 *   if (result.success) {
 *     showNotification('Success', result.message);
 *     refreshProductStatus();
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function updateProductAssignment(id: string, statusId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Get status details to create appropriate message
    const status = await prisma.productAssignmentStatus.findUnique({
      where: { id: statusId },
      select: { name: true }
    });

    if (!status) {
      throw new Error('Status not found');
    }

    const updatedAssignment = await prisma.productAssignment.update({
      where: {
        id,
        sellerId: session.user.id, // Ensure only the assigned seller can update
      },
      data: {
        statusId,
        completedAt: new Date(),
      },
      include: {
        seller: {
          select: { name: true }
        },
        product: {
          select: { name: true }
        }
      }
    });

    // If marked as completed, send notification to client
    if (status.name === 'COMPLETED') {
      try {
        // Import the notification function dynamically to avoid circular dependencies
        const { createProductAssignmentNotification } = await import('./messages.actions');
        
        // Create notification message
        await createProductAssignmentNotification(
          id,
          `${updatedAssignment.seller.name} has marked product "${updatedAssignment.product.name}" as completed. Please review and accept it.`,
          'status-update'
        );
      } catch (error) {
        console.error('Failed to send notification message:', error);
        // Don't throw here, just log - we still want to update the status even if notification fails
      }
    }

    revalidatePath('/user/dashboard/seller/assignments');
    
    return {
      success: true,
      message: 'Product assignment updated successfully',
      data: updatedAssignment
    };
  } catch (error) {
    console.error('[PRODUCT_ASSIGNMENT_UPDATE]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update product assignment' 
    };
  }
}

/**
 * Adds or updates a review from a client for a product assignment
 * 
 * @param id - The product assignment ID
 * @param rating - The rating (1-5)
 * @param feedback - Optional review feedback text
 * @returns Result with success status and message
 * 
 * @example
 * // In a product review form
 * const handleReviewSubmit = async (formData) => {
 *   const result = await markProductAsReviewed(
 *     productId,
 *     parseInt(formData.rating),
 *     formData.feedback
 *   );
 *   
 *   if (result.success) {
 *     showNotification('Success', 'Review submitted successfully');
 *     router.push('/dashboard/products');
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function markProductAsReviewed(id: string, rating: number, feedback?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Fetch the product assignment to verify the client is the one reviewing
    const productAssignment = await prisma.productAssignment.findUnique({
      where: { id },
      select: { 
        clientId: true,
        sellerId: true,
        product: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          where: {
            reviewType: {
              name: 'Client Review'
            },
            reviewerId: session.user.id
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!productAssignment) {
      throw new Error('Product assignment not found');
    }

    if (productAssignment.clientId !== session.user.id) {
      throw new Error('Only the client can review this product');
    }

    // Get the review type ID for client reviews
    let reviewType = await prisma.reviewType.findFirst({
      where: { name: 'Client Review' },
      select: { id: true }
    });

    // If review type doesn't exist, create it
    if (!reviewType) {
      reviewType = await prisma.reviewType.create({
        data: {
          name: 'Client Review',
          description: 'Review from a client to a seller'
        },
        select: { id: true }
      });
    }

    // Check if a review already exists
    let review;
    let message = 'Review submitted successfully';
    
    if (productAssignment.reviews.length > 0) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: productAssignment.reviews[0].id },
        data: {
          rating,
          description: feedback || 'No feedback provided'
        }
      });
      message = 'Review updated successfully';
    } else {
      // Create a new review
      review = await prisma.review.create({
        data: {
          assignmentId: id,
          reviewerId: session.user.id, // Client is the reviewer
          revieweeId: productAssignment.sellerId, // Student is being reviewed
          rating,
          title: 'Product Review',
          description: feedback || 'No feedback provided',
          typeId: reviewType.id
        }
      });
    }

    // Update seller rating
    await updateSellerRating(productAssignment.sellerId);
    
    // Send notification to seller about the review
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { createProductAssignmentNotification } = await import('./messages.actions');
      
      // Truncate feedback if it's too long (limit to 150 characters)
      const truncatedFeedback = feedback && feedback.length > 150 
        ? `${feedback.substring(0, 147)}...` 
        : feedback || 'No feedback provided';
      
      // Create stars representation
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      
      // Create notification message with different text for new vs updated reviews
      const actionText = productAssignment.reviews.length > 0 ? 'updated their review' : 'submitted a review';
      
      await createProductAssignmentNotification(
        id,
        `${productAssignment.client.name} has ${actionText} for product "${productAssignment.product.name}". Rating: ${stars} (${rating}/5). Feedback: "${truncatedFeedback}"`,
        'review-submitted',
        {
          reviewRating: rating,
          reviewFeedback: truncatedFeedback
        }
      );
    } catch (error) {
      console.error('Failed to send review notification message:', error);
      // Don't throw here, just log - we still want to create the review even if notification fails
    }

    revalidatePath('/user/dashboard/client/product-assignments');
    
    return {
      success: true,
      message,
      data: review
    };
  } catch (error) {
    console.error('[PRODUCT_ASSIGNMENT_REVIEW]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to submit review' 
    };
  }
}

/**
 * Updates the average rating for a seller based on their product reviews
 * 
 * @param sellerId - The ID of the seller to update
 * @returns The updated average rating or null if no reviews exist
 * 
 * @example
 * // After submitting a seller review
 * await updateSellerRating(productAssignment.sellerId);
 */
async function updateSellerRating(sellerId: string) {
  // Calculate average rating
  const reviews = await prisma.review.findMany({
    where: { revieweeId: sellerId },
    select: { rating: true }
  });
  
  if (reviews.length === 0) return;
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Update the seller's rating
  await prisma.user.update({
    where: { id: sellerId },
    data: {
      sellerRating: averageRating,
      numReviews: reviews.length
    }
  });
}

/**
 * Accepts a product assignment and marks it as completed
 * 
 * @param id - The product assignment ID
 * @returns Result with success status and message
 * 
 * @example
 * // In a product acceptance component
 * const handleAcceptProduct = async () => {
 *   const result = await acceptProductAssignment(productId);
 *   
 *   if (result.success) {
 *     showNotification('Success', 'Product accepted successfully');
 *     refreshProductStatus();
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function acceptProductAssignment(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // First get the product assignment to verify it's completed and the user is the client
    const productAssignment = await prisma.productAssignment.findUnique({
      where: { id },
      include: {
        status: true,
        product: {
          select: {
            name: true
          }
        },
        client: {
          select: {
            name: true
          }
        }
      }
    });

    if (!productAssignment) {
      throw new Error('Product assignment not found');
    }

    if (productAssignment.clientId !== session.user.id) {
      throw new Error('Only the client can accept this product');
    }

    if (productAssignment.status.name !== 'COMPLETED') {
      throw new Error('Only completed products can be accepted');
    }

    // Get the ACCEPTED status ID
    let acceptedStatus = await prisma.productAssignmentStatus.findFirst({
      where: { name: 'ACCEPTED' }
    });

    // If ACCEPTED status doesn't exist, throw an error
    if (!acceptedStatus) {
      throw new Error('ACCEPTED status not found in the database');
    }

    // Update the product assignment status
    const updatedAssignment = await prisma.productAssignment.update({
      where: { id },
      data: {
        statusId: acceptedStatus.id,
      },
    });

    // Send notification to seller about product acceptance
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { createProductAssignmentNotification } = await import('./messages.actions');
      
      // Create notification message
      await createProductAssignmentNotification(
        id,
        `${productAssignment.client.name} has accepted the completed product "${productAssignment.product.name}". The product is now marked as accepted.`,
        'status-update'
      );
    } catch (error) {
      console.error('Failed to send product acceptance notification message:', error);
      // Don't throw here, just log - we still want to update the status even if notification fails
    }

    revalidatePath('/user/dashboard/client/product-assignments');
    
    return {
      success: true,
      message: 'Product accepted successfully',
      data: await serializeData(updatedAssignment)
    };
  } catch (error) {
    console.error('[PRODUCT_ASSIGNMENT_ACCEPT]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to accept product' 
    };
  }
}

/**
 * Retrieves the invoice history for a product assignment
 * 
 * @param assignmentId - The product assignment ID
 * @returns Object containing invoiced status and array of related invoices
 * 
 * @example
 * // In a product invoice history component
 * const ProductInvoiceHistory = async ({ assignmentId }) => {
 *   const { invoiced, invoices } = await getProductAssignmentInvoiceHistory(assignmentId);
 *   
 *   return (
 *     <div>
 *       <h3>Invoice History</h3>
 *       {invoiced ? (
 *         <ul>
 *           {invoices.map(invoice => (
 *             <li key={invoice.id}>
 *               Invoice #{invoice.invoiceNumber} - {formatDate(invoice.createdAt)}
 *             </li>
 *           ))}
 *         </ul>
 *       ) : (
 *         <p>No invoices found</p>
 *       )}
 *     </div>
 *   );
 * };
 */
export async function getProductAssignmentInvoiceHistory(assignmentId: string): Promise<{
  invoiced: boolean;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    createdAt: Date;
  }>;
}> {
  try {
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        assignmentId: assignmentId,
      },
      select: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        invoice: {
          createdAt: 'desc'
        }
      }
    });

    if (invoiceItems.length === 0) {
      return { 
        invoiced: false,
        invoices: []
      };
    }

    // Create a map to track unique invoices by ID
    const uniqueInvoices = new Map();
    
    // Process each invoice item and only keep unique invoices
    invoiceItems.forEach(item => {
      // Safety check: ensure invoice exists and has required fields
      if (item.invoice && item.invoice.id && !uniqueInvoices.has(item.invoice.id)) {
        uniqueInvoices.set(item.invoice.id, {
          id: item.invoice.id,
          invoiceNumber: item.invoice.invoiceNumber || '',
          createdAt: item.invoice.createdAt
        });
      }
    });

    const invoicesArray = Array.from(uniqueInvoices.values());
    
    if (invoicesArray.length === 0) {
      return { 
        invoiced: false,
        invoices: []
      };
    }

    return {
      invoiced: true,
      invoices: invoicesArray
    };
  } catch (error) {
    console.error('[GET_PRODUCT_ASSIGNMENT_INVOICE_HISTORY]', error);
    return { 
      invoiced: false,
      invoices: []
    };
  }
}

/**
 * Checks if a product assignment has been invoiced
 * 
 * @param assignmentId - The product assignment ID
 * @returns Object containing invoiced status and invoice details if found
 * 
 * @example
 * // In a product action button component
 * const ProductActions = async ({ assignmentId }) => {
 *   const { invoiced, invoiceNumber } = await isProductAssignmentInvoiced(assignmentId);
 *   
 *   return (
 *     <div>
 *       {invoiced ? (
 *         <p>Invoiced: #{invoiceNumber}</p>
 *       ) : (
 *         <button onClick={handleCreateInvoice}>Create Invoice</button>
 *       )}
 *     </div>
 *   );
 * };
 */
export async function isProductAssignmentInvoiced(assignmentId: string): Promise<{
  invoiced: boolean;
  invoiceNumber?: string;
  invoiceId?: string;
}> {
  try {
    const invoiceHistory = await getProductAssignmentInvoiceHistory(assignmentId);
    
    if (!invoiceHistory.invoiced || invoiceHistory.invoices.length === 0) {
      return { invoiced: false };
    }

    // Return the most recent invoice (should be the first one since we sort by descending date)
    const latestInvoice = invoiceHistory.invoices[0];
    return {
      invoiced: true,
      invoiceNumber: latestInvoice.invoiceNumber,
      invoiceId: latestInvoice.id
    };
  } catch (error) {
    console.error('[IS_PRODUCT_ASSIGNMENT_INVOICED]', error);
    return { invoiced: false };
  }
}

/**
 * Retrieves a product assignment by invoice number
 * 
 * @param invoiceNumber - The invoice number to search for
 * @returns Object containing success status and product assignment ID if found
 * 
 * @example
 * // In an invoice detail component
 * const InvoiceDetails = async ({ invoiceNumber }) => {
 *   const { success, productAssignmentId } = await getProductAssignmentByInvoiceNumber(invoiceNumber);
 *   
 *   if (success && productAssignmentId) {
 *     return <ProductAssignmentDetails id={productAssignmentId} />;
 *   }
 *   
 *   return <p>No product assignment found for this invoice</p>;
 * };
 */
export async function getProductAssignmentByInvoiceNumber(invoiceNumber: string): Promise<{
  success: boolean;
  productAssignmentId?: string;
  message?: string;
}> {
  try {
    // Find the invoice item linked to this invoice number
    const invoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        invoice: {
          invoiceNumber: invoiceNumber
        }
      },
      select: {
        assignmentId: true
      }
    });

    if (!invoiceItem) {
      return { 
        success: false,
        message: 'No product assignment found for this invoice'
      };
    }

    return {
      success: true,
      productAssignmentId: invoiceItem.assignmentId
    };
  } catch (error) {
    console.error('[GET_PRODUCT_ASSIGNMENT_BY_INVOICE_NUMBER]', error);
    return { 
      success: false,
      message: 'Error finding product assignment for invoice'
    };
  }
}

/**
 * Adds or updates a review from a seller for a client
 * 
 * @param id - The product assignment ID
 * @param rating - The rating (1-5)
 * @param feedback - Optional review feedback text
 * @returns Result with success status and message
 * 
 * @example
 * // In a client review form
 * const handleClientReview = async (formData) => {
 *   const result = await markClientAsReviewed(
 *     productId,
 *     parseInt(formData.rating),
 *     formData.feedback
 *   );
 *   
 *   if (result.success) {
 *     showNotification('Success', 'Client review submitted');
 *     router.push('/dashboard/clients');
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function markClientAsReviewed(id: string, rating: number, feedback?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Fetch the product assignment to verify the seller is the one reviewing
    const productAssignment = await prisma.productAssignment.findUnique({
      where: { id },
      select: { 
        clientId: true,
        sellerId: true,
        product: {
          select: {
            id: true,
            name: true
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        },
        seller: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          where: {
            reviewType: {
              name: 'Seller Review'
            },
            reviewerId: session.user.id
          },
          select: {
            id: true
          }
        }
      }
    });

    if (!productAssignment) {
      throw new Error('Product assignment not found');
    }

    if (productAssignment.sellerId !== session.user.id) {
      throw new Error('Only the seller can review this client');
    }

    // Get the review type ID for seller reviews
    let reviewType = await prisma.reviewType.findFirst({
      where: { name: 'Seller Review' },
      select: { id: true }
    });

    // If review type doesn't exist, create it
    if (!reviewType) {
      reviewType = await prisma.reviewType.create({
        data: {
          name: 'Seller Review',
          description: 'Review from a seller to a client'
        },
        select: { id: true }
      });
    }

    // Check if a review already exists
    let review;
    let message = 'Review submitted successfully';
    
    if (productAssignment.reviews.length > 0) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: productAssignment.reviews[0].id },
        data: {
          rating,
          description: feedback || 'No feedback provided'
        }
      });
      message = 'Review updated successfully';
    } else {
      // Create a new review
      review = await prisma.review.create({
        data: {
          assignmentId: id,
          reviewerId: session.user.id, // Seller is the reviewer
          revieweeId: productAssignment.clientId, // Client is being reviewed
          rating,
          title: 'Client Review',
          description: feedback || 'No feedback provided',
          typeId: reviewType.id
        }
      });
    }

    // Update client rating
    await updateClientRating(productAssignment.clientId);
    
    // Send notification to client about the review
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { createProductAssignmentNotification } = await import('./messages.actions');
      
      // Truncate feedback if it's too long (limit to 150 characters)
      const truncatedFeedback = feedback && feedback.length > 150 
        ? `${feedback.substring(0, 147)}...` 
        : feedback || 'No feedback provided';
      
      // Create stars representation
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      
      // Create notification message with different text for new vs updated reviews
      const actionText = productAssignment.reviews.length > 0 ? 'updated their review' : 'submitted a review';
      
      await createProductAssignmentNotification(
        id,
        `${productAssignment.seller.name} has ${actionText} for you on product "${productAssignment.product.name}". Rating: ${stars} (${rating}/5). Feedback: "${truncatedFeedback}"`,
        'review-submitted',
        {
          reviewRating: rating,
          reviewFeedback: truncatedFeedback
        }
      );
    } catch (error) {
      console.error('Failed to send review notification message:', error);
      // Don't throw here, just log - we still want to create the review even if notification fails
    }

    revalidatePath('/user/dashboard/seller/assignments');
    
    return {
      success: true,
      message,
      data: review
    };
  } catch (error) {
    console.error('[CLIENT_REVIEW]', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to submit review' 
    };
  }
}

/**
 * Updates the average rating for a client based on their product reviews
 * 
 * @param clientId - The ID of the client to update
 * @returns The updated average rating or null if no reviews exist
 * 
 * @example
 * // After submitting a client review
 * await updateClientRating(productAssignment.clientId);
 */
async function updateClientRating(clientId: string) {
  // Calculate average rating
  const reviews = await prisma.review.findMany({
    where: { 
      revieweeId: clientId,
      reviewType: {
        name: 'Seller Review'
      }
    },
    select: { rating: true }
  });
  
  if (reviews.length === 0) return;
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // Update the client's rating
  await prisma.user.update({
    where: { id: clientId },
    data: {
      clientRating: averageRating,
      numReviews: reviews.length
    }
  });
}

/**
 * Retrieves the client's review of a product assignment
 * 
 * @param id - The product assignment ID
 * @returns Object containing success status and review details if found
 * 
 * @example
 * // In a product review display component
 * const ProductReview = async ({ productId }) => {
 *   const { success, review } = await getClientReviewOfProduct(productId);
 *   
 *   if (success && review) {
 *     return (
 *       <div>
 *         <h3>Client Review</h3>
 *         <Rating value={review.rating} readOnly />
 *         <p>{review.feedback}</p>
 *       </div>
 *     );
 *   }
 *   
 *   return <p>No review yet</p>;
 * };
 */
export async function getClientReviewOfProduct(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const assignment = await prisma.productAssignment.findUnique({
      where: { id },
      include: {
        reviews: {
          where: {
            reviewType: {
              name: 'Client Review'
            }
          },
          select: {
            rating: true,
            description: true,
            createdAt: true
          }
        }
      }
    });

    if (!assignment) {
      return { success: false, message: 'Product assignment not found' };
    }

    if (assignment.reviews.length === 0) {
      return { success: false, message: 'No review found' };
    }

    return {
      success: true,
      data: {
        rating: assignment.reviews[0].rating,
        feedback: assignment.reviews[0].description
      }
    };
  } catch (error) {
    console.error('[GET_CLIENT_REVIEW]', error);
    return { success: false, message: 'Failed to fetch review' };
  }
}

/**
 * Retrieves the seller's review of a client for a product assignment
 * 
 * @param id - The product assignment ID
 * @returns Object containing success status and review details if found
 * 
 * @example
 * // In a client review display component
 * const ClientReview = async ({ productId }) => {
 *   const { success, review } = await getContractorReviewOfClient(productId);
 *   
 *   if (success && review) {
 *     return (
 *       <div>
 *         <h3>Seller's Review</h3>
 *         <Rating value={review.rating} readOnly />
 *         <p>{review.feedback}</p>
 *       </div>
 *     );
 *   }
 *   
 *   return <p>No review yet</p>;
 * };
 */
export async function getContractorReviewOfClient(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    const assignment = await prisma.productAssignment.findUnique({
      where: { id },
      include: {
        reviews: {
          where: {
            reviewType: {
              name: 'Seller Review'
            }
          },
          select: {
            rating: true,
            description: true,
            createdAt: true
          }
        }
      }
    });

    if (!assignment) {
      return { success: false, message: 'Product assignment not found' };
    }

    if (assignment.reviews.length === 0) {
      return { success: false, message: 'No review found' };
    }

    return {
      success: true,
      data: {
        rating: assignment.reviews[0].rating,
        feedback: assignment.reviews[0].description
      }
    };
  } catch (error) {
    console.error('[GET_CONTRACTOR_REVIEW]', error);
    return { success: false, message: 'Failed to fetch review' };
  }
} 

/**
 * Gets the ID of the "Completed" product assignment status
 * 
 * @returns The ID and name of the completed status
 */
export async function getCompletedProductAssignmentStatus() {
  const status = await prisma.productAssignmentStatus.findFirst({
    where: {
      name: 'Completed'
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!status) {
    throw new Error('Completed status not found');
  }

  return status;
}
