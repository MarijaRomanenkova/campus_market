'use server'; 

/**
 * Product management functions for creating, retrieving, updating and deleting products
 * @module ProductActions
 * @group API
 * 
 * This module provides server-side functions for handling product operations including:
 * - Creating and updating products
 * - Managing product assignments
 * - Retrieving product listings with filtering and pagination
 * - Archiving products
 */

import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { Prisma, Product as PrismaProduct } from '@prisma/client';
import { Product } from '@/types';
import { auth } from '@/auth';

// Define a type that includes exactly what Prisma returns with relations
type ProductWithRelations = {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  images: string[];
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;  // Explicitly include updatedAt
  isArchived: boolean;
  archivedAt: Date | null;
  category?: { id: string; name: string };
  createdBy?: { 
    id: string; 
    name: string; 
    email: string;
    clientRating?: number | null;
  };
};

/**
 * Parameters for retrieving and filtering products
 */
type GetAllProductsParams = {
  /** Search query to filter products by name */
  query?: string;
  /** Category name to filter products by */
  category?: string;
  /** Price range to filter products by (format: 'min-max') */
  price?: string;
  /** Sort order for returned products */
  sort?: 'newest' | 'lowest' | 'highest';
  /** Page number for pagination */
  page?: number;
};

/**
 * Retrieves the most recent products
 * 
 * @returns Array of the latest 12 products with author information
 * @throws Will throw an error if the database operation fails
 * 
 * @example
 * try {
 *   const latestProducts = await getLatestProducts();
 *   // Display products to the user
 * } catch (error) {
 *   console.error('Failed to load latest products');
 * }
 */
export async function getLatestProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isArchived: false
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            clientRating: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 12
    });

    // Make TypeScript happy by ensuring all required fields exist
    return products.map(product => {
      // Create a properly typed object with all required Product fields
      const productWithRelations = product as unknown as ProductWithRelations;
      
      return {
        id: productWithRelations.id,
        name: productWithRelations.name,
        description: productWithRelations.description,
        price: Number(productWithRelations.price),
        images: productWithRelations.images,
        categoryId: productWithRelations.categoryId,
        createdAt: productWithRelations.createdAt,
        updatedAt: productWithRelations.updatedAt,
        isArchived: productWithRelations.isArchived,
        archivedAt: productWithRelations.archivedAt,
        author: productWithRelations.createdBy ? {
          id: productWithRelations.createdBy.id,
          name: productWithRelations.createdBy.name,
          email: productWithRelations.createdBy.email,
          clientRating: productWithRelations.createdBy.clientRating !== null && productWithRelations.createdBy.clientRating !== undefined
            ? Number(productWithRelations.createdBy.clientRating)
            : null
        } : undefined,
        category: productWithRelations.category ? {
          id: productWithRelations.category.id,
          name: productWithRelations.category.name
        } : undefined
      } satisfies Product;
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a single product by its unique ID
 * 
 * @param productId - The product's unique identifier
 * @returns The product with creator information or null if not found
 * 
 * @example
 * const product = await getProductById('product-123');
 * if (product) {
 *   // Handle product data
 * }
 */
export async function getProductById(productId: string) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return null;
    }
    
    const product = await prisma.product.findFirst({
      where: { id: productId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            clientRating: true
          }
        },
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!product) return null;

    // Cast to ProductWithRelations to ensure consistent typing
    const productWithRelations = product as unknown as ProductWithRelations;
    
    // Map the product to the expected format with author property instead of createdBy
    return {
      id: productWithRelations.id,
      name: productWithRelations.name,
      description: productWithRelations.description,
      price: Number(productWithRelations.price),
      images: productWithRelations.images,
      categoryId: productWithRelations.categoryId,
      createdAt: productWithRelations.createdAt,
      updatedAt: productWithRelations.updatedAt,
      isArchived: productWithRelations.isArchived,
      archivedAt: productWithRelations.archivedAt,
      author: productWithRelations.createdBy ? {
        id: productWithRelations.createdBy.id,
        name: productWithRelations.createdBy.name,
        email: productWithRelations.createdBy.email,
        clientRating: productWithRelations.createdBy.clientRating !== null && productWithRelations.createdBy.clientRating !== undefined
          ? Number(productWithRelations.createdBy.clientRating)
          : null
      } : undefined,
      category: productWithRelations.category ? {
        id: productWithRelations.category.id,
        name: productWithRelations.category.name
      } : undefined
    } satisfies Product;
  } catch (error) {
    return null;
  }
}

/**
 * Retrieves products with filtering, sorting and pagination
 * 
 * @param options - Query parameters for filtering products
 * @param options.query - Text to search in product names
 * @param options.category - Category name to filter by
 * @param options.price - Price range in format 'min-max'
 * @param options.sort - Sort order (newest, lowest price, highest price)
 * @param options.page - Page number for pagination
 * @returns Paginated list of products and total pages
 * 
 * @example
 * const { data, totalPages } = await getAllProducts({
 *   category: 'Cleaning',
 *   sort: 'lowest',
 *   page: 1
 * });
 */
export async function getAllProducts({
  query = 'all',
  category = 'all',
  price = 'all',
  sort = 'newest',
  page = 1,
}: GetAllProductsParams) {
  try {
    const conditions: Prisma.ProductWhereInput = {
      isArchived: false
    };
    
    // Category filter
    if (category !== 'all') {
      const categoryRecord = await prisma.category.findFirst({
        where: { name: category }
      });
      
      if (categoryRecord) {
        conditions['categoryId'] = categoryRecord.id;
      }
    }

    // Price filter
    if (price !== 'all') {
      const [min, max] = price.split('-').map(Number);
      conditions['price'] = {
        gte: min,
        lte: max,
      };
    }

    // Search query
    if (query !== 'all') {
      conditions.name = {
        contains: query,
        mode: 'insensitive'
      };
    }

    // Get products with conditions
    const products = await prisma.product.findMany({
      where: conditions,
      orderBy: [
        ...(sort === 'newest' ? [{ createdAt: 'desc' as const }] : []),
        ...(sort === 'lowest' ? [{ price: 'asc' as const }] : []),
        ...(sort === 'highest' ? [{ price: 'desc' as const }] : []),
      ],
      include: {
        category: true, // Include full category to get id
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            clientRating: true
          }
        }
      }
    });

    // Map products to the expected format
    return {
      data: products.map(product => {
        // Use the same type casting approach as other functions
        const productWithRelations = product as unknown as ProductWithRelations;
        
        return {
          id: productWithRelations.id,
          name: productWithRelations.name,
          description: productWithRelations.description,
          price: Number(productWithRelations.price),
          images: productWithRelations.images,
          categoryId: productWithRelations.categoryId,
          createdAt: productWithRelations.createdAt,
          updatedAt: productWithRelations.updatedAt,
          isArchived: productWithRelations.isArchived,
          archivedAt: productWithRelations.archivedAt,
          author: productWithRelations.createdBy ? {
            id: productWithRelations.createdBy.id,
            name: productWithRelations.createdBy.name,
            email: productWithRelations.createdBy.email,
            clientRating: productWithRelations.createdBy.clientRating !== null && productWithRelations.createdBy.clientRating !== undefined
              ? Number(productWithRelations.createdBy.clientRating)
              : null
          } : undefined,
          category: productWithRelations.category ? {
            id: productWithRelations.category.id,
            name: productWithRelations.category.name
          } : undefined
        };
      }),
      totalPages: Math.ceil(products.length / PAGE_SIZE)
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      data: [],
      totalPages: 0
    };
  }
}

/**
 * Deletes a product by its ID
 * 
 * @param id - The product's unique identifier
 * @returns Result with success status and message
 * 
 * @example
 * const result = await deleteProduct('product-123');
 * if (result.success) {
 *   showNotification(result.message);
 * }
 */
export async function deleteProduct(id: string) {
  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExists) throw new Error('product not found');

    await prisma.product.delete({ where: { id } });

    revalidatePath('/user/dashboard/client/product');

    return {
      success: true,
      message: 'product deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Creates a new product
 * 
 * @param formData - Form data containing product details
 * @returns Object containing success status, message, and product ID if successful
 * 
 * @example
 * // In a product creation form
 * const handleSubmit = async (formData: FormData) => {
 *   const result = await createProduct(formData);
 *   if (result.success) {
 *     router.push(`/product/${result.data}`);
 *   } else {
 *     showError(result.message);
 *   }
 * };
 */
export async function createProduct(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    const productData = {
      name: formData.get('name') as string,
      categoryId: formData.get('categoryId') as string,
      images: formData.getAll('images') as string[],
      description: formData.get('description') as string,
      price: formData.get('price') as string,
    };

    const validatedData = insertProductSchema.parse(productData);

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
    });

    revalidatePath('/products');

    return {
      success: true,
      message: 'Product created successfully',
      data: product.id,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Updates an existing product
 * 
 * @param data - Product data with updated fields
 * @returns Result with success status and message
 * 
 * @example
 * const result = await updateProduct({
 *   id: 'product-123',
 *   name: 'Updated Product Name',
 *   price: 250
 * });
 */
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const product = updateProductSchema.parse(data);
    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });

    if (!productExists) throw new Error('Product not found');

    await prisma.product.update({
      where: { id: product.id },
      data: product,
    });

    revalidatePath('/user/dashboard/client/product');

    return {
      success: true,
      message: 'Product updated successfully',
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
 * // In a category filter component
 * const categories = await getAllCategories();
 * 
 * return (
 *   <div>
 *     <h3>Categories</h3>
 *     {categories.map(category => (
 *       <CategoryItem
 *         key={category.id}
 *         name={category.name}
 *         count={category._count.products}
 *       />
 *     ))}
 *   </div>
 * );
 */
export async function getAllCategories() {
  try {
    // Check Prisma's connection status properly
    try {
      // A simple query to test the connection
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      // If the above query fails, try to reconnect
      await prisma.$connect();
    }
    
    const data = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return an empty array instead of throwing
    return [];
  }
}

type ProductsWithPagination = {
  data: Product[];
  totalPages: number;
};

export async function getAllProductsByClientId(clientId: string): Promise<ProductsWithPagination> {
  const where: Prisma.ProductWhereInput = {
    isArchived: false,
    OR: [
      { createdById: clientId },
      {
        assignments: {
          some: {
            clientId: clientId
          }
        }
      }
    ]
  };

  const products = await prisma.product.findMany({
    where,
    include: {
      assignments: true,
      category: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          clientRating: true
        }
      }
    }
  });
  
  return {
    data: products.map(product => {
      // Create a properly typed object with all required Product fields
      const productWithRelations = product as unknown as ProductWithRelations;
      
      return {
        id: productWithRelations.id,
        name: productWithRelations.name,
        description: productWithRelations.description,
        price: Number(productWithRelations.price),
        images: productWithRelations.images,
        categoryId: productWithRelations.categoryId,
        createdAt: productWithRelations.createdAt,
        updatedAt: productWithRelations.updatedAt,
        isArchived: productWithRelations.isArchived,
        archivedAt: productWithRelations.archivedAt,
        author: productWithRelations.createdBy ? {
          id: productWithRelations.createdBy.id,
          name: productWithRelations.createdBy.name,
          email: productWithRelations.createdBy.email,
          clientRating: productWithRelations.createdBy.clientRating !== null && productWithRelations.createdBy.clientRating !== undefined
            ? Number(productWithRelations.createdBy.clientRating)
            : null
        } : undefined,
        category: productWithRelations.category ? {
          id: productWithRelations.category.id,
          name: productWithRelations.category.name
        } : undefined
      } as Product;
    }),
    totalPages: Math.ceil(products.length / 10)
  };
}

// Check if the current user owns the product
export const checkProductOwnership = async (
  productId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Clear any cached product data first
    await prisma.$queryRaw`SELECT pg_advisory_unlock_all()`;  // If using PostgreSQL
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { createdById: true }
    });

    return product?.createdById === userId;
  } catch (error) {
    return false;
  }
};

/**
 * Get product statistics for admin dashboard
 * Returns the count of open products and weekly product creation data
 */
export async function getProductStatistics() {
  try {
    // Get count of open products with error handling
    let openProductsCount = 0;
    try {
      openProductsCount = await prisma.product.count({
        where: {
          assignments: {
            some: {
              status: {
                name: 'OPEN'
              }
            }
          }
        }
      });
    } catch (countError) {
      console.error('Error counting open products:', countError);
      // Continue with zero count if this query fails
    }

    // Get weekly product creation data for the last 8 weeks
    const now = new Date();
    const eightWeeksAgo = new Date(now.getTime() - (8 * 7 * 24 * 60 * 60 * 1000));

    // Define a type for the weekly products data
    type WeeklyProductItem = {
      createdAt: Date;
      _count: {
        id: number;
      };
    };

    let weeklyProducts: Array<{createdAt: Date, _count: {id: number}}> = [];
    try {
      const result = await prisma.product.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: eightWeeksAgo
          }
        },
        _count: {
          id: true
        }
      });
      
      weeklyProducts = result.map(item => ({
        createdAt: new Date(item.createdAt),
        _count: {
          id: item._count.id
        }
      }));
    } catch (groupError) {
      console.error('Error getting weekly product data:', groupError);
      // Continue with empty array if this query fails
    }

    // Process weekly data
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now.getTime() - ((7 - i) * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const productsInWeek = weeklyProducts.filter(product => {
        try {
          const productDate = new Date(product.createdAt);
          return productDate >= weekStart && productDate < weekEnd;
        } catch (error) {
          return false;
        }
      });

      const totalProducts = productsInWeek.reduce((sum, product) => sum + product._count.id, 0);
      
      return {
        week: `Week ${i + 1}`,
        totalProducts
      };
    });

    return {
      openProductsCount,
      weeklyData
    };
  } catch (error) {
    console.error('Error getting product statistics:', error);
    // Return default values instead of throwing
    return {
      openProductsCount: 0,
      weeklyData: Array.from({ length: 8 }, (_, i) => ({
        week: `Week ${i + 1}`,
        totalProducts: 0
      }))
    };
  }
}

/**
 * Archives a product
 * 
 * @param productId - The ID of the product to archive
 * @returns Result with success status and message
 * 
 * @example
 * const result = await archiveProduct('product-123');
 * if (result.success) {
 *   // Handle success
 * }
 */
export async function archiveProduct(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    // Check if product exists and user owns it
    const productExists = await prisma.product.findFirst({
      where: { 
        id: productId,
        createdById: session.user.id 
      },
    });

    if (!productExists) {
      throw new Error('Product not found or unauthorized');
    }

    // Update product to archived status
    await prisma.product.update({
      where: { id: productId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    // Send notifications to any sellers who have conversations about this product
    try {
      // Import the notification function dynamically to avoid circular dependencies
      const { sendProductArchivedNotifications } = await import('./messages.actions');
      
      // Send notifications about the archived product
      await sendProductArchivedNotifications(productId);
    } catch (error) {
      console.error('Failed to send product archived notifications:', error);
      // Don't throw here, just log - we still want to archive the product even if notifications fail
    }

    revalidatePath('/user/dashboard/client/product');

    return {
      success: true,
      message: 'Product archived successfully',
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to archive product' 
    };
  }
}
