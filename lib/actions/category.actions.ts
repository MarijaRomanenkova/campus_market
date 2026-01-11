'use server';

/**
 * Category management functions for product categorization
 * @module CategoryActions
 * @group API
 * 
 * This module provides server-side functions for handling category operations including:
 * - Creating and updating categories
 * - Retrieving category listings
 * - Managing category assignments for products
 */

import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { formatError } from '../utils';
import { insertCategorySchema } from '../validators';

/**
 * Retrieves all product categories ordered alphabetically by name
 * 
 * @returns Array of category objects with id and name properties
 * 
 * @example
 * // In a category dropdown component
 * const CategorySelector = async () => {
 *   const categories = await getCategories();
 *   
 *   return (
 *     <select>
 *       <option value="">Select a category</option>
 *       {categories.map(category => (
 *         <option key={category.id} value={category.id}>
 *           {category.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * };
 */
export async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  return categories;
} 

/**
 * Creates a new product category
 * 
 * @param formData - Form data containing category details
 * @returns Result with success status and message
 * 
 * @example
 * // In a category creation form
 * const handleSubmit = async (formData: FormData) => {
 *   const result = await createCategory(formData);
 *   if (result.success) {
 *     router.push('/admin/categories');
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function createCategory(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      throw new Error('Only admins can create categories');
    }

    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };

    const validatedData = insertCategorySchema.parse(categoryData);

    const category = await prisma.category.create({
      data: validatedData,
    });

    revalidatePath('/admin/categories');
    return {
      success: true,
      message: 'Category created successfully',
      data: category.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Updates an existing product category
 * 
 * @param categoryId - The ID of the category to update
 * @param formData - Form data containing updated category details
 * @returns Result with success status and message
 * 
 * @example
 * // In a category edit form
 * const handleSubmit = async (formData: FormData) => {
 *   const result = await updateCategory(categoryId, formData);
 *   if (result.success) {
 *     router.push('/admin/categories');
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function updateCategory(categoryId: string, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      throw new Error('Only admins can update categories');
    }

    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };

    const validatedData = insertCategorySchema.parse(categoryData);

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: validatedData,
    });

    revalidatePath('/admin/categories');
    return {
      success: true,
      message: 'Category updated successfully',
      data: category.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Retrieves all categories with product counts
 * 
 * @returns Array of categories with their product counts
 * 
 * @example
 * // In a category listing component
 * const categories = await getAllCategories();
 * 
 * return (
 *   <div>
 *     <h2>Categories</h2>
 *     {categories.map(category => (
 *       <CategoryCard
 *         key={category.id}
 *         name={category.name}
 *         description={category.description}
 *         productCount={category._count.products}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Retrieves a single category by ID
 * 
 * @param categoryId - The ID of the category to retrieve
 * @returns Category data or null if not found
 * 
 * @example
 * // In a category detail page
 * const category = await getCategoryById(categoryId);
 * if (category) {
 *   return (
 *     <CategoryDetail
 *       name={category.name}
 *       description={category.description}
 *       productCount={category._count.products}
 *     />
 *   );
 * }
 */
export async function getCategoryById(categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return category;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
} 
