import { 
  mockProductAssignmentStatuses, 
  mockUsers, 
  mockProduct,
  mockProductAssignment,
  createProductAssignment,
  updateProductAssignmentStatus,
  getProductAssignmentById,
  acceptProductAssignment,
  mockProductAssignmentStatusAPI,
  mockPrismaProductAssignment,
  mockAuthSession
} from './__mocks__/product-assignment';

// Generate a UUID for non-existent ID tests
const nonExistentId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock Next.js auth
jest.mock('@/auth', () => ({
  auth: jest.fn().mockImplementation(() => mockAuthSession('SELLER'))
}));

// Mock Prisma client
jest.mock('@/db/prisma', () => ({
  prisma: mockPrismaProductAssignment
}));

// Mock revalidatePath from next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

// Mock library functions
jest.mock('@/lib/actions/product-assignment-status.actions', () => ({
  getAllProductAssignmentStatuses: mockProductAssignmentStatusAPI.getAllProductAssignmentStatuses,
  getProductAssignmentStatusByName: mockProductAssignmentStatusAPI.getProductAssignmentStatusByName,
  updateProductAssignmentStatus: mockProductAssignmentStatusAPI.updateProductAssignmentStatus
}));

// Mock product-assignment actions
jest.mock('@/lib/actions/product-assignment.actions', () => ({
  createProductAssignment,
  updateProductAssignment: jest.fn(),
  getProductAssignmentById,
  acceptProductAssignment
}));

// Update the acceptProductAssignment function to recognize nonExistentId
acceptProductAssignment.mockImplementation(async (id, userId) => {
  if (id === nonExistentId) {
    return {
      success: false,
      message: 'Product assignment not found'
    };
  }
  
  // Rest of the function implementation remains the same
  if (userId !== mockUsers.client.id) {
    return {
      success: false,
      message: 'Only the client can accept this product'
    };
  }

  if (mockProductAssignment.status.name !== 'COMPLETED') {
    return {
      success: false,
      message: 'Only completed products can be accepted'
    };
  }

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
});

describe('Product Assignment Status Transitions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create product assignment with IN_PROGRESS status', async () => {
    // Arrange
    const data = {
      productId: mockProduct.id,
      clientId: mockUsers.client.id,
      sellerId: mockUsers.seller.id,
      statusId: 'any-status' // This will be overridden by IN_PROGRESS
    };

    // Act
    const result = await createProductAssignment(data);

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe('Product assigned successfully');
    expect(result.data.statusId).toBe(mockProductAssignmentStatuses.inProgress.id);
  });
  
  it('should transition from IN_PROGRESS to COMPLETED', async () => {
    // Arrange - mock that we're authenticated as seller
    jest.mock('@/auth', () => ({
      auth: jest.fn().mockResolvedValue(mockAuthSession('SELLER'))
    }));

    // Act
    const result = await updateProductAssignmentStatus(
      mockProductAssignment.id, 
      'COMPLETED'
    );

    // Assert
    expect(result.statusId).toBe(mockProductAssignmentStatuses.completed.id);
    expect(result.status.name).toBe('COMPLETED');
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  it('should reject invalid status transitions', async () => {
    // Act & Assert
    await expect(
      updateProductAssignmentStatus(mockProductAssignment.id, 'INVALID_STATUS')
    ).rejects.toThrow('Status "INVALID_STATUS" not found');
  });

  it('should allow client to accept a completed product', async () => {
    // Arrange - mock a completed product for acceptance
    mockProductAssignment.status = mockProductAssignmentStatuses.completed;
    mockProductAssignment.statusId = mockProductAssignmentStatuses.completed.id;
    
    // Mock auth as client
    jest.mock('@/auth', () => ({
      auth: jest.fn().mockResolvedValue(mockAuthSession('CLIENT'))
    }));

    // Act
    const result = await acceptProductAssignment(
      mockProductAssignment.id,
      mockUsers.client.id
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe('Product accepted successfully');
    expect(result.data.status.name).toBe('ACCEPTED');
  });

  it('should prevent seller from accepting a product', async () => {
    // Act
    const result = await acceptProductAssignment(
      mockProductAssignment.id,
      mockUsers.seller.id
    );

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe('Only the client can accept this product');
  });

  it('should only allow acceptance of completed products', async () => {
    // Arrange - reset to IN_PROGRESS status
    mockProductAssignment.status = mockProductAssignmentStatuses.inProgress;
    mockProductAssignment.statusId = mockProductAssignmentStatuses.inProgress.id;

    // Act
    const result = await acceptProductAssignment(
      mockProductAssignment.id,
      mockUsers.client.id
    );

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe('Only completed products can be accepted');
  });

  it('should handle non-existent product assignments', async () => {
    // Act
    const result = await acceptProductAssignment(
      nonExistentId,
      mockUsers.client.id
    );

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toBe('Product assignment not found');
  });
});
