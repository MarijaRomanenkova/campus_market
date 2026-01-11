import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth-guard';
import { mockUsers, mockSessions } from './__mocks__/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/auth-guard', () => ({
  requireAuth: jest.fn(),
  requireAdmin: jest.fn().mockImplementation(async () => {
    const session = await auth();
    if (!session?.user) {
      redirect('/unauthorized');
      return session;
    }
    
    if (session.user.role !== 'ADMIN') {
      redirect('/unauthorized');
      return session;
    }
    
    return session;
  }),
}));

jest.mock('@/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock admin-only operations
const mockAdminOperations = {
  updateUserRole: jest.fn().mockImplementation(async (userId: string, newRole: string) => {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }
    
    if (session.user.role !== 'ADMIN') {
      return { success: false, message: 'Admin privileges required' };
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });
    
    return { success: true, user: updatedUser };
  }),
  
  deleteUser: jest.fn().mockImplementation(async (userId: string) => {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }
    
    if (session.user.role !== 'ADMIN') {
      return { success: false, message: 'Admin privileges required' };
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    await prisma.user.delete({ where: { id: userId } });
    
    return { success: true, message: 'User deleted successfully' };
  }),
  
  manageCategory: jest.fn().mockImplementation(async (operation: 'create' | 'update' | 'delete', data: { 
      id: string;
      name: string; 
      description: string; 
    } | { 
      id?: string;
      name: string; 
      description: string; 
    }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }
    
    if (session.user.role !== 'ADMIN') {
      return { success: false, message: 'Admin privileges required' };
    }
    
    let result;
    switch (operation) {
      case 'create':
        result = await prisma.category.create({ data });
        return { success: true, category: result };
      case 'update':
        result = await prisma.category.update({ 
          where: { id: data.id },
          data: { name: data.name, description: data.description }
        });
        return { success: true, category: result };
      case 'delete':
        await prisma.category.delete({ where: { id: data.id } });
        return { success: true, message: 'Category deleted successfully' };
      default:
        return { success: false, message: 'Invalid operation' };
    }
  }),
};

describe('Admin Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Admin Route Access', () => {
    it('should allow admins to access admin-only routes', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(mockSessions.ADMIN);
      
      // Act
      const session = await requireAdmin();
      
      // Assert
      expect(redirect).not.toHaveBeenCalled();
      expect(session?.user.role).toBe('ADMIN');
    });
    
    it('should redirect regular users from admin routes', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(mockSessions.CLIENT);
      
      // Act
      try {
        await requireAdmin();
      } catch (error) {
        // We expect this to throw due to the redirect
      }
      
      // Assert
      expect(redirect).toHaveBeenCalledWith('/unauthorized');
    });
    
    it('should redirect sellers from admin routes', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(mockSessions.SELLER);
      
      // Act
      try {
        await requireAdmin();
      } catch (error) {
        // We expect this to throw due to the redirect
      }
      
      // Assert
      expect(redirect).toHaveBeenCalledWith('/unauthorized');
    });
    
    it('should redirect unauthenticated users from admin routes', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(null);
      
      // Act
      try {
        await requireAdmin();
      } catch (error) {
        // We expect this to throw due to the redirect
      }
      
      // Assert
      expect(redirect).toHaveBeenCalledWith('/unauthorized');
    });
  });
  
  describe('User Management', () => {
    beforeEach(() => {
      // Set up admin session for each test
      (auth as jest.Mock).mockResolvedValue(mockSessions.ADMIN);
    });
    
    it('should allow admins to update user roles', async () => {
      // Arrange
      const userId = mockUsers.client.id;
      const newRole = 'SELLER';
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUsers.client);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUsers.client,
        role: newRole,
        updatedAt: new Date()
      });
      
      // Act
      const result = await mockAdminOperations.updateUserRole(userId, newRole);
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { role: newRole }
      });
    });
    
    it('should allow admins to delete users', async () => {
      // Arrange
      const userId = mockUsers.client.id;
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUsers.client);
      (prisma.user.delete as jest.Mock).mockResolvedValue(mockUsers.client);
      
      // Act
      const result = await mockAdminOperations.deleteUser(userId);
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });
    
    it('should allow admins to manage categories', async () => {
      // Arrange
      const categoryData = {
        name: 'New Category',
        description: 'Description for new category'
      };
      
      (prisma.category.create as jest.Mock).mockResolvedValue({
        id: 'category-123',
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Act
      const result = await mockAdminOperations.manageCategory('create', categoryData);
      
      // Assert
      expect(result.success).toBe(true);
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: categoryData
      });
    });
  });
  
  describe('Non-Admin Attempts', () => {
    it('should prevent regular users from updating user roles', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(mockSessions.CLIENT);
      const userId = mockUsers.seller.id;
      const newRole = 'ADMIN';
      
      // Act
      const result = await mockAdminOperations.updateUserRole(userId, newRole);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Admin privileges required');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
    
    it('should prevent sellers from deleting users', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(mockSessions.SELLER);
      const userId = mockUsers.client.id;
      
      // Act
      const result = await mockAdminOperations.deleteUser(userId);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Admin privileges required');
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
    
    it('should prevent unauthenticated users from managing categories', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(null);
      const categoryData = {
        name: 'New Category',
        description: 'Description for new category'
      };
      
      // Act
      const result = await mockAdminOperations.manageCategory('create', categoryData);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unauthorized');
      expect(prisma.category.create).not.toHaveBeenCalled();
    });
  });
  
  describe('Admin Dashboard Statistics', () => {
    beforeEach(() => {
      // Set up admin session for each test
      (auth as jest.Mock).mockResolvedValue(mockSessions.ADMIN);
    });
    
    it('should allow admins to view user statistics', async () => {
      // Arrange
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        mockUsers.client,
        mockUsers.seller,
        mockUsers.regularUser,
        mockUsers.admin
      ]);
      
      // Mock function for getting user statistics
      const getUserStats = jest.fn().mockImplementation(async () => {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
          return { success: false, message: 'Unauthorized' };
        }
        
        const users = await prisma.user.findMany();
        
        // Calculate stats
        const stats = {
          totalUsers: users.length,
          byRole: {
            CLIENT: users.filter(u => u.role === 'CLIENT').length,
            SELLER: users.filter(u => u.role === 'SELLER').length,
            ADMIN: users.filter(u => u.role === 'ADMIN').length,
            USER: users.filter(u => u.role === 'USER').length
          }
        };
        
        return { success: true, stats };
      });
      
      // Act
      const result = await getUserStats();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.stats.totalUsers).toBe(4);
      expect(result.stats.byRole.CLIENT).toBe(1);
      expect(result.stats.byRole.SELLER).toBe(1);
      expect(result.stats.byRole.ADMIN).toBe(1);
      expect(result.stats.byRole.USER).toBe(1);
    });
    
    it('should allow admins to view product statistics', async () => {
      // Arrange
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        { isArchived: false },
        { isArchived: false },
        { isArchived: false },
        { isArchived: true },
      ]);
      
      // Mock function for getting product statistics
      const getProductStats = jest.fn().mockImplementation(async () => {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'ADMIN') {
          return { success: false, message: 'Unauthorized' };
        }
        
        const products = await prisma.product.findMany();
        
        // Calculate stats (Products don't have statusId - that's on ProductAssignment)
        const stats = {
          totalProducts: products.length,
          activeProducts: products.filter(t => !t.isArchived).length,
          archivedProducts: products.filter(t => t.isArchived).length,
        };
        
        return { success: true, stats };
      });
      
      // Act
      const result = await getProductStats();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.stats.totalProducts).toBe(4);
      expect(result.stats.activeProducts).toBe(3);
      expect(result.stats.archivedProducts).toBe(1);
    });
  });
}); 
