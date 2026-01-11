// Mock Prisma client for testing

// Define the PrismaClient type first with all needed models
type PrismaClient = {
  user: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  invoice: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  invoiceItem: {
    findFirst: jest.Mock;
    create: jest.Mock;
  };
  product: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
  };
  productAssignment: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
  };
  productAssignmentStatus: {
    findFirst: jest.Mock;
  };
  conversation: {
    create: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
  };
  message: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
  payment: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
    aggregate: jest.Mock;
  };
  cart: {
    update: jest.Mock;
  };
  $transaction: <T>(callback: (prisma: PrismaClient) => T) => T;
  $queryRaw: jest.Mock;
};

// Then use the type to define the prisma object
export const prisma: PrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn()
  },
  invoice: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  invoiceItem: {
    findFirst: jest.fn(),
    create: jest.fn()
  },
  product: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn()
  },
  productAssignment: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn()
  },
  productAssignmentStatus: {
    findFirst: jest.fn()
  },
  conversation: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn()
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  payment: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn()
  },
  cart: {
    update: jest.fn()
  },
  $transaction: jest.fn(<T>(callback: (prisma: PrismaClient) => T): T => callback(prisma as PrismaClient)),
  $queryRaw: jest.fn().mockImplementation(() => Promise.resolve([{
    month: '01/23',
    totalSales: 1000
  }]))
}; 

// Add a mock checkPrismaConnection function for tests
export async function checkPrismaConnection(): Promise<boolean> {
  return true; // Always return true in tests
}

export default prisma; 
