import { redirect } from 'next/navigation';
import { requireAuth, requireAdmin } from '@/lib/auth-guard';
import { auth } from '@/auth';

// Mock dependencies
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Auth Guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('requireAuth', () => {
    it('should not redirect if user is authenticated', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ 
        user: { id: 'user-123', role: 'user' } 
      });
      
      // Act
      await requireAuth();
      
      // Assert
      expect(redirect).not.toHaveBeenCalled();
    });
    
    it('should redirect to sign-in if user is not authenticated', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue(null);
      
      // Act
      await requireAuth();
      
      // Assert
      expect(redirect).toHaveBeenCalledWith('/sign-in');
    });
  });
  
  describe('requireAdmin', () => {
    it('should not redirect if user is an admin', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ 
        user: { id: 'admin-123', role: 'admin' } 
      });
      
      // Act
      await requireAdmin();
      
      // Assert
      expect(redirect).not.toHaveBeenCalled();
    });
    
    it('should redirect to unauthorized if user is not an admin', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ 
        user: { id: 'user-123', role: 'user' } 
      });
      
      // Act
      await requireAdmin();
      
      // Assert
      expect(redirect).toHaveBeenCalledWith('/unauthorized');
    });
  });
  
  describe('edge cases', () => {
    it('should handle when auth throws an error', async () => {
      // Arrange
      (auth as jest.Mock).mockRejectedValue(new Error('Auth service error'));
      
      // Act & Assert
      await expect(requireAuth()).rejects.toThrow('Auth service error');
    });
    
    it('should redirect if user exists but has no role', async () => {
      // Arrange
      (auth as jest.Mock).mockResolvedValue({ 
        user: { id: 'user-123' } // Missing role
      });
      
      // Act
      await requireAdmin();
      
      // Assert
      expect(redirect).toHaveBeenCalledWith('/unauthorized');
    });
  });
  
  describe('session token handling', () => {
    it('should check token expiration', async () => {
      // This would require additional setup based on how you handle tokens
      // Mocking a token that's expired, etc.
    });
  });
});
