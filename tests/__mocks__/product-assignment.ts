// Mock product assignment data and functions for testing

import { z } from 'zod';
import { insertProductAssignmentSchema } from '@/lib/validators';

// UUID helper for predictable test IDs
const generateTestId = (prefix: string = 'test') => `${prefix}-${Math.floor(Math.random() * 10000)}`;
const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock status data
export const mockProductAssignmentStatuses = {
  inProgress: {
    id: generateUuid(),
    name: 'IN_PROGRESS',
    description: 'Product assignment is in progress',
    color: '#3b82f6',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  completed: {
    id: generateUuid(),
    name: 'COMPLETED',
    description: 'Product assignment has been completed',
    color: '#10b981',
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  accepted: {
    id: generateUuid(),
    name: 'ACCEPTED',
    description: 'Product assignment has been accepted by client',
    color: '#4ade80',
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// Mock users for testing
export const mockUsers = {
  client: {
    id: generateUuid(),
    name: 'Test Client',
    email: 'client@example.com',
    role: 'CLIENT'
  },
  seller: {
    id: generateUuid(),
    name: 'Test Seller',
    email: 'seller@example.com',
    role: 'SELLER'
  },
  admin: {
    id: generateUuid(),
    name: 'Test Admin',
    email: 'admin@example.com',
    role: 'ADMIN'
  }
};

// Mock product
export const mockProduct = {
  id: generateUuid(),
  name: 'Test Product',
  description: 'Description for test product',
  price: 100,
  images: ['image1.jpg', 'image2.jpg'],
  categoryId: generateUuid(),
  createdById: mockUsers.client.id,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Base mock product assignment
export const mockProductAssignment = {
  id: generateUuid(),
  productId: mockProduct.id,
  clientId: mockUsers.client.id,
  sellerId: mockUsers.seller.id,
  statusId: mockProductAssignmentStatuses.inProgress.id,
  createdAt: new Date(),
  completedAt: null,
  product: {
    name: mockProduct.name,
    price: mockProduct.price,
    description: mockProduct.description
  },
  seller: {
    name: mockUsers.seller.name,
    email: mockUsers.seller.email
  },
  client: {
    name: mockUsers.client.name,
    email: mockUsers.client.email
  },
  status: mockProductAssignmentStatuses.inProgress
};

// Mock functions for product assignment operations

// Create product assignment
export const createProductAssignment = jest.fn().mockImplementation(
  async (data: z.infer<typeof insertProductAssignmentSchema>) => {
    // Validate required fields
    if (!data.productId || !data.sellerId || !data.clientId) {
      return {
        success: false,
        message: 'Missing required fields'
      };
    }

    // Mock creation behavior - always sets to IN_PROGRESS status
    const assignment = {
      id: generateTestId('assignment'),
      productId: data.productId,
      sellerId: data.sellerId,
      clientId: data.clientId,
      statusId: mockProductAssignmentStatuses.inProgress.id,
      createdAt: new Date(),
      completedAt: null,
      product: {
        name: 'Mock Product Name'
      },
      seller: {
        name: 'Mock Seller Name'
      }
    };

    return {
      success: true,
      message: 'Product assigned successfully',
      data: assignment
    };
  }
);

// Update product assignment status
export const updateProductAssignmentStatus = jest.fn().mockImplementation(
  async (id: string, statusName: string) => {
    // Check if status exists
    const normalizedStatus = statusName.toUpperCase();
    const statusEntry = Object.values(mockProductAssignmentStatuses).find(
      s => s.name === normalizedStatus
    );

    if (!statusEntry) {
      throw new Error(`Status "${statusName}" not found`);
    }

    // Mock permission check logic
    if (statusName === 'COMPLETED' && mockProductAssignment.sellerId !== mockUsers.seller.id) {
      throw new Error('Only the assigned seller can mark a product as completed');
    }

    // Create updated assignment object
    const updatedAssignment = {
      ...mockProductAssignment,
      statusId: statusEntry.id,
      status: {
        ...statusEntry
      },
      completedAt: normalizedStatus === 'COMPLETED' ? new Date() : null
    };

    return updatedAssignment;
  }
);

// Get product assignment by ID
export const getProductAssignmentById = jest.fn().mockImplementation(
  async (id: string) => {
    if (id === generateUuid()) {
      return null;
    }
    
    return {
      ...mockProductAssignment,
      id
    };
  }
);

// Accept product assignment - client specific action
export const acceptProductAssignment = jest.fn().mockImplementation(
  async (id: string, userId: string) => {
    // Check if the assignment exists
    const nonExistentId = generateUuid();
    if (id === nonExistentId) {
      return {
        success: false,
        message: 'Product assignment not found'
      };
    }

    // Check if the user is the client
    if (userId !== mockUsers.client.id) {
      return {
        success: false,
        message: 'Only the client can accept this product'
      };
    }

    // Check if the status is completed
    if (mockProductAssignment.status.name !== 'COMPLETED') {
      return {
        success: false,
        message: 'Only completed products can be accepted'
      };
    }

    // Mock successful acceptance
    const acceptedAssignment = {
      ...mockProductAssignment,
      statusId: mockProductAssignmentStatuses.accepted.id,
      status: mockProductAssignmentStatuses.accepted
    };

    return {
      success: true,
      message: 'Product accepted successfully',
      data: acceptedAssignment
    };
  }
);

// Mock functions to be exported for product assignment Status API
export const mockProductAssignmentStatusAPI = {
  getAllProductAssignmentStatuses: jest.fn().mockResolvedValue(
    Object.values(mockProductAssignmentStatuses)
  ),
  
  getProductAssignmentStatusByName: jest.fn().mockImplementation(
    async (name: string) => {
      const statusEntry = Object.values(mockProductAssignmentStatuses).find(
        s => s.name === name.toUpperCase()
      );
      
      if (!statusEntry) {
        throw new Error(`Status "${name}" not found`);
      }
      
      return statusEntry;
    }
  ),
  
  updateProductAssignmentStatus
};

// Mock Prisma client for product assignments
export const mockPrismaProductAssignment = {
  productAssignment: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.id === 'non-existent') {
        return null;
      }
      return { ...mockProductAssignment, id: where.id };
    }),
    findFirst: jest.fn().mockImplementation(({ where }) => {
      if (where?.id === 'non-existent') return null;
      return { ...mockProductAssignment, ...where };
    }),
    findMany: jest.fn().mockResolvedValue([mockProductAssignment]),
    create: jest.fn().mockImplementation(({ data }) => ({
      ...mockProductAssignment,
      ...data,
      id: generateTestId('assignment')
    })),
    update: jest.fn().mockImplementation(({ where, data }) => ({
      ...mockProductAssignment,
      ...data,
      id: where.id
    })),
    delete: jest.fn().mockResolvedValue(mockProductAssignment)
  },
  productAssignmentStatus: {
    findFirst: jest.fn().mockImplementation(({ where }) => {
      const statusName = where?.name;
      if (!statusName) return mockProductAssignmentStatuses.inProgress;
      
      const status = Object.values(mockProductAssignmentStatuses).find(
        s => s.name === statusName
      );
      
      return status || null;
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (!where?.id) return null;
      
      const status = Object.values(mockProductAssignmentStatuses).find(
        s => s.id === where.id
      );
      
      return status || null;
    }),
    findMany: jest.fn().mockResolvedValue(Object.values(mockProductAssignmentStatuses))
  }
};

// Helper for mocking authenticated sessions
export const mockAuthSession = (role: 'CLIENT' | 'SELLER' | 'ADMIN' = 'CLIENT') => {
  const userMap = {
    'CLIENT': mockUsers.client,
    'SELLER': mockUsers.seller,
    'ADMIN': mockUsers.admin
  };
  
  return {
    user: userMap[role]
  };
};

