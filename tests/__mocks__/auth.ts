// Mock authentication data and functions for testing

import { DefaultSession } from 'next-auth';

// UUID helper
const generateUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

// Mock user roles
export type UserRole = 'CLIENT' | 'SELLER' | 'ADMIN' | 'USER'; 

// Mock users for testing
export const mockUsers = {
  client: {
    id: generateUuid(),
    name: 'Test Client',
    email: 'client@example.com',
    password: 'hashed_password_client', // In a real scenario, this would be hashed
    role: 'CLIENT',
    fullName: 'Test Client Full Name',
    phoneNumber: '123-456-7890',
    companyId: null,
    address: { street: '123 Client St', city: 'Clientville', zip: '12345' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  seller: {
    id: generateUuid(),
    name: 'Test Seller',
    email: 'seller@example.com',
    password: 'hashed_password_seller',
    role: 'SELLER',
    fullName: 'Test Seller Full Name',
    phoneNumber: '234-567-8901',
    companyId: generateUuid(),
    address: { street: '456 Seller Ave', city: 'Sellerville', zip: '23456' },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  admin: {
    id: generateUuid(),
    name: 'Test Admin',
    email: 'admin@example.com',
    password: 'hashed_password_admin',
    role: 'ADMIN',
    fullName: 'Test Admin Full Name',
    phoneNumber: '345-678-9012',
    companyId: null,
    address: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  regularUser: {
    id: generateUuid(),
    name: 'Test User',
    email: 'user@example.com',
    password: 'hashed_password_user',
    role: 'USER',
    fullName: null,
    phoneNumber: null,
    companyId: null,
    address: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

// Define Session type matching the app's expected structure
export interface MockSession extends DefaultSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    fullName?: string | null;
    phoneNumber?: string | null;
    companyId?: string | null;
    address?: Record<string, unknown> | string | null;
  }
}

// Mock session data
export const mockSessions: Record<UserRole, MockSession> = {
  CLIENT: {
    user: {
      id: mockUsers.client.id,
      name: mockUsers.client.name,
      email: mockUsers.client.email,
      role: mockUsers.client.role,
      fullName: mockUsers.client.fullName,
      phoneNumber: mockUsers.client.phoneNumber,
      companyId: mockUsers.client.companyId,
      address: mockUsers.client.address
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  },
  SELLER: {
    user: {
      id: mockUsers.seller.id,
      name: mockUsers.seller.name,
      email: mockUsers.seller.email,
      role: mockUsers.seller.role,
      fullName: mockUsers.seller.fullName,
      phoneNumber: mockUsers.seller.phoneNumber,
      companyId: mockUsers.seller.companyId,
      address: mockUsers.seller.address
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  ADMIN: {
    user: {
      id: mockUsers.admin.id,
      name: mockUsers.admin.name,
      email: mockUsers.admin.email,
      role: mockUsers.admin.role,
      fullName: mockUsers.admin.fullName,
      phoneNumber: mockUsers.admin.phoneNumber,
      companyId: mockUsers.admin.companyId,
      address: mockUsers.admin.address
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  USER: {
    user: {
      id: mockUsers.regularUser.id,
      name: mockUsers.regularUser.name,
      email: mockUsers.regularUser.email,
      role: mockUsers.regularUser.role,
      fullName: mockUsers.regularUser.fullName,
      phoneNumber: mockUsers.regularUser.phoneNumber,
      companyId: mockUsers.regularUser.companyId,
      address: mockUsers.regularUser.address
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
};

// Mock JWT tokens
export const mockJwtTokens: Record<UserRole, string> = {
  CLIENT: 'mock_jwt_token_client',
  SELLER: 'mock_jwt_token_seller',
  ADMIN: 'mock_jwt_token_admin',
  USER: 'mock_jwt_token_user'
};

// Mock auth functions
export const mockSignIn = jest.fn().mockImplementation(
  async (provider: string, credentials: { email: string; password: string; redirect?: boolean }) => {
    // Check for valid credentials
    let user = null;
    let token = null;
    
    if (credentials.email === mockUsers.client.email && credentials.password === 'password123') {
      user = mockUsers.client;
      token = mockJwtTokens.CLIENT;
    } else if (credentials.email === mockUsers.seller.email && credentials.password === 'password123') {
      user = mockUsers.seller;
      token = mockJwtTokens.SELLER;
    } else if (credentials.email === mockUsers.admin.email && credentials.password === 'password123') {
      user = mockUsers.admin;
      token = mockJwtTokens.ADMIN;
    } else if (credentials.email === mockUsers.regularUser.email && credentials.password === 'password123') {
      user = mockUsers.regularUser;
      token = mockJwtTokens.USER;
    }
    
    if (user) {
      return { 
        ok: true, 
        error: null,
        status: 200,
        url: credentials.redirect ? '/dashboard' : null 
      };
    }
    
    return { 
      ok: false, 
      error: 'Invalid credentials',
      status: 401,
      url: null 
    };
  }
);

export const mockSignOut = jest.fn().mockImplementation(
  async (options?: { redirect?: boolean; callbackUrl?: string }) => {
    return {
      ok: true,
      error: null,
      status: 200,
      url: options?.redirect ? (options.callbackUrl || '/sign-in') : null
    };
  }
);

export const mockAuth = jest.fn().mockImplementation(
  async (role?: UserRole) => {
    if (role) {
      return mockSessions[role];
    }
    return null; // No session
  }
);

// Mock Prisma adapter for user operations
export const mockPrismaAuth = {
  user: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      const { email, id } = where;
      
      if (email) {
        return Object.values(mockUsers).find(user => user.email === email) || null;
      } else if (id) {
        return Object.values(mockUsers).find(user => user.id === id) || null;
      }
      
      return null;
    }),
    findFirst: jest.fn().mockImplementation(({ where }) => {
      const { email } = where;
      
      if (email) {
        return Object.values(mockUsers).find(user => user.email === email) || null;
      }
      
      return null;
    }),
    create: jest.fn().mockImplementation(({ data }) => {
      const { email, name, password, role = 'USER' } = data;
      
      const newUser = {
        id: generateUuid(),
        email,
        name,
        password,
        role,
        fullName: null,
        phoneNumber: null,
        companyId: null,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return newUser;
    }),
    update: jest.fn().mockImplementation(({ where, data }) => {
      const { id } = where;
      const user = Object.values(mockUsers).find(user => user.id === id);
      
      if (!user) return null;
      
      return {
        ...user,
        ...data,
        updatedAt: new Date()
      };
    })
  },
  session: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      const { sessionToken } = where;
      
      if (sessionToken === mockJwtTokens.CLIENT) {
        return {
          id: generateUuid(),
          sessionToken,
          userId: mockUsers.client.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      } else if (sessionToken === mockJwtTokens.SELLER) {
        return {
          id: generateUuid(),
          sessionToken,
          userId: mockUsers.seller.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      } else if (sessionToken === mockJwtTokens.ADMIN) {
        return {
          id: generateUuid(),
          sessionToken,
          userId: mockUsers.admin.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      } else if (sessionToken === mockJwtTokens.USER) {
        return {
          id: generateUuid(),
          sessionToken,
          userId: mockUsers.regularUser.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };
      }
      
      return null;
    }),
    create: jest.fn().mockImplementation(({ data }) => {
      const { sessionToken, userId, expires } = data;
      
      return {
        id: generateUuid(),
        sessionToken,
        userId,
        expires
      };
    }),
    deleteMany: jest.fn().mockImplementation(() => {
      return { count: 1 };
    })
  }
};

// Mock for password comparison
export const mockCompare = jest.fn().mockImplementation(
  (plainPassword: string, hashedPassword: string) => {
    // In a test environment, we'll just check if the plain password is "password123"
    return Promise.resolve(plainPassword === 'password123');
  }
);

// Helper for creating an expired token
export const createExpiredSession = (role: UserRole): MockSession => {
  const baseSession = mockSessions[role];
  return {
    ...baseSession,
    expires: new Date(Date.now() - 1000).toISOString() // Expired timestamp
  };
}; 
