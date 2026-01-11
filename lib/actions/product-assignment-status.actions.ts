'use server';

/**
 * Product assignment status management functions
 * @module ProductAssignmentStatusActions
 * @group API
 * 
 * This module provides server-side functions for managing product assignment statuses:
 * - Retrieving all available statuses
 * - Finding statuses by name
 * - Updating product assignment statuses
 */

import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';
import { serializeData } from '@/lib/actions/product-assignment.actions';

/**
 * Retrieves all product assignment statuses ordered by their defined sequence
 * 
 * @returns Array of product assignment statuses
 * 
 * @example
 * // In a status selection component
 * const StatusSelect = async () => {
 *   const statuses = await getAllProductAssignmentStatuses();
 *   
 *   return (
 *     <select>
 *       {statuses.map(status => (
 *         <option key={status.id} value={status.name}>
 *           {status.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * };
 */
export async function getAllProductAssignmentStatuses() {
  try {
    const statuses = await prisma.productAssignmentStatus.findMany({
      orderBy: { order: 'asc' }
    });
    return statuses;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a product assignment status by its name
 * 
 * @param name - The name of the status to find (case-insensitive)
 * @returns The product assignment status object
 * @throws Error if status is not found
 * 
 * @example
 * // In a status validation function
 * const validateStatus = async (statusName: string) => {
 *   try {
 *     const status = await getProductAssignmentStatusByName(statusName);
 *     return status;
 *   } catch (error) {
 *     console.error('Invalid status:', error);
 *     return null;
 *   }
 * };
 */
export async function getProductAssignmentStatusByName(name: string) {
  try {
    const status = await prisma.productAssignmentStatus.findFirst({
      where: { 
        name: name.toUpperCase() 
      }
    });
    
    if (!status) {
      throw new Error(`Status "${name}" not found`);
    }
    
    return status;
  } catch (error) {
    throw error;
  }
} 

/**
 * Updates a product assignment's status
 * 
 * @param id - The unique identifier of the product assignment
 * @param statusName - The name of the new status (e.g., 'completed')
 * @returns The updated product assignment with its new status
 * @throws Error if status is not found or update fails
 * 
 * @example
 * // In a product assignment component
 * const ProductAssignment = ({ assignment }) => {
 *   const handleStatusChange = async (newStatus: string) => {
 *     try {
 *       const updated = await updateProductAssignmentStatus(
 *         assignment.id,
 *         newStatus
 *       );
 *       // Update UI with new status
 *     } catch (error) {
 *       // Handle error
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <h3>{assignment.product.name}</h3>
 *       <StatusSelect
 *         currentStatus={assignment.status.name}
 *         onChange={handleStatusChange}
 *       />
 *     </div>
 *   );
 * };
 */
export async function updateProductAssignmentStatus(id: string, statusName: string) {
  try {
    // Find the status by name
    const status = await getProductAssignmentStatusByName(statusName);
    
    if (!status) {
      throw new Error(`Status "${statusName}" not found`);
    }
    
    // Update the product assignment with the new status
    const updatedAssignment = await prisma.productAssignment.update({
      where: { id },
      data: {
        statusId: status.id,
        // If status is completed, set completedAt to now
        ...(statusName.toLowerCase() === 'completed' && { completedAt: new Date() })
      },
      include: {
        status: true
      }
    });
    
    // Revalidate relevant paths to reflect the changes
    revalidatePath('/dashboard');
    revalidatePath(`/product-assignments/${id}`);
    
    // Serialize data to handle Decimal values
    return await serializeData(updatedAssignment);
  } catch (error) {
    console.error('Error updating product assignment status:', error);
    throw error;
  }
}
