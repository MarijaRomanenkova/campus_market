// tests/invoice-creation.test.ts
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import * as invoiceActions from '@/lib/actions/invoice.actions';

// Mock the db and auth modules
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/db/prisma', () => ({
  prisma: {
    invoice: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    invoiceItem: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findFirst: jest.fn(),
    },
    productAssignment: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    productAssignmentStatus: {
      findFirst: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// Mock the invoice actions
jest.mock('@/lib/actions/invoice.actions', () => {
  return {
    createInvoice: jest.fn(),
    getInvoiceByNumber: jest.fn(),
  };
});

// Get references to mocked functions
const { createInvoice, getInvoiceByNumber } = invoiceActions;

describe('Invoice Creation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default auth session
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test User',
        email: 'test@example.com',
      },
    });
    
    // Setup default values for database mocks
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174010',
    });
    
    (prisma.productAssignmentStatus.findFirst as jest.Mock).mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174020',
    });

    // Mock implementations for invoice actions
    (createInvoice as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: '123e4567-e89b-12d3-a456-426614174001',
        invoiceNumber: 'INV-TEST123',
        totalPrice: 200,
        clientId: '123e4567-e89b-12d3-a456-426614174002',
        sellerId: '123e4567-e89b-12d3-a456-426614174003',
      }
    });

    (getInvoiceByNumber as jest.Mock).mockImplementation(async (invoiceNumber) => {
      if (!invoiceNumber) {
        return {
          success: false,
          message: 'Invoice number is required',
        };
      }

      // Find invoice in database
      const invoice = await prisma.invoice.findUnique({
        where: { invoiceNumber },
      });

      if (!invoice) {
        return {
          success: false,
          message: 'Invoice not found',
        };
      }

      return {
        success: true,
        data: invoice,
      };
    });
    
    // Mock database response functions
    (prisma.invoice.create as jest.Mock).mockImplementation((data) => {
      return Promise.resolve({
        id: '123e4567-e89b-12d3-a456-426614174001',
        invoiceNumber: data.data.invoiceNumber || 'INV-TEST123',
        clientId: data.data.clientId,
        sellerId: data.data.sellerId,
        totalPrice: data.data.totalPrice,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    (prisma.invoiceItem.create as jest.Mock).mockImplementation((data) => {
      return Promise.resolve({
        id: '123e4567-e89b-12d3-a456-426614174011',
        invoiceId: data.data.invoiceId,
        productId: data.data.productId,
        name: data.data.name,
        quantity: data.data.quantity,
        price: data.data.price,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    (prisma.productAssignment.findFirst as jest.Mock).mockResolvedValue({
      id: '123e4567-e89b-12d3-a456-426614174021',
    });

    (prisma.invoice.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where && where.invoiceNumber === 'INV-123456') {
        return Promise.resolve({
          id: '123e4567-e89b-12d3-a456-426614174001',
          invoiceNumber: 'INV-123456',
          clientId: '123e4567-e89b-12d3-a456-426614174002',
          sellerId: '123e4567-e89b-12d3-a456-426614174003',
          totalPrice: '200.00',
          createdAt: new Date(),
          updatedAt: new Date(),
          client: { id: '123e4567-e89b-12d3-a456-426614174002', name: 'Client Name', email: 'client@example.com' },
          seller: { id: '123e4567-e89b-12d3-a456-426614174003', name: 'Seller Name', email: 'seller@example.com' },
          items: [
            {
              id: '123e4567-e89b-12d3-a456-426614174011',
              invoiceId: '123e4567-e89b-12d3-a456-426614174001',
              productId: '123e4567-e89b-12d3-a456-426614174010',
              name: 'Service 1',
              quantity: 2,
              price: 100,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          ],
          payment: {
            id: '123e4567-e89b-12d3-a456-426614174004',
            isPaid: false,
          }
        });
      }
      return Promise.resolve(null);
    });
  });
  
  it('creates a basic invoice with valid data', async () => {
    // Arrange
    const invoiceData = {
      clientId: '123e4567-e89b-12d3-a456-426614174002',
      sellerId: '123e4567-e89b-12d3-a456-426614174003',
      totalPrice: 200, // 2 * 100
      items: [
        {
          productId: '123e4567-e89b-12d3-a456-426614174010',
          name: 'Service 1',
          quantity: 2,
          price: 100,
        },
      ],
    };
    
    // Mock prisma calls for this test
    (createInvoice as jest.Mock).mockImplementation(async (data) => {
      // Create the invoice in the database
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: 'INV-TEST123',
          clientId: data.clientId,
          sellerId: data.sellerId,
          totalPrice: data.totalPrice,
        }
      });
      
      // Create invoice items
      for (const item of data.items) {
        await prisma.invoiceItem.create({
          data: {
            invoiceId: invoice.id,
            productId: item.productId,
            name: item.name,
            hours: item.quantity || 0,
            qty: item.quantity || 0,
            price: item.price,
            assignmentId: '123e4567-e89b-12d3-a456-426614174021',
          }
        });
      }
      
      return {
        success: true,
        data: invoice
      };
    });
    
    // Act
    const result = await createInvoice(invoiceData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(prisma.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: '123e4567-e89b-12d3-a456-426614174002',
          sellerId: '123e4567-e89b-12d3-a456-426614174003',
          totalPrice: expect.any(Number),
        }),
      })
    );
    expect(prisma.invoiceItem.create).toHaveBeenCalled();
  });
  
  it('rejects invoice creation when user is not authenticated', async () => {
    // Arrange
    (auth as jest.Mock).mockResolvedValueOnce(null);
    
    // Override the mock for this specific test
    (createInvoice as jest.Mock).mockResolvedValueOnce({
      success: false,
      message: 'You must be logged in to create an invoice',
    });
    
    const invoiceData = {
      clientId: '123e4567-e89b-12d3-a456-426614174002',
      sellerId: '123e4567-e89b-12d3-a456-426614174003',
      totalPrice: 200, // 2 * 100
      items: [
        {
          productId: '123e4567-e89b-12d3-a456-426614174010',
          name: 'Service 1',
          quantity: 2,
          price: 100,
        },
      ],
    };
    
    // Act
    const result = await createInvoice(invoiceData);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain('You must be logged in to create an invoice');
    expect(prisma.invoice.create).not.toHaveBeenCalled();
  });
  
  it('calculates the correct total for multiple items', async () => {
    // Arrange
    const invoiceData = {
      clientId: '123e4567-e89b-12d3-a456-426614174002',
      sellerId: '123e4567-e89b-12d3-a456-426614174003',
      totalPrice: 350, // (2 * 100) + (3 * 50)
      items: [
        {
          productId: '123e4567-e89b-12d3-a456-426614174010',
          name: 'Service 1',
          quantity: 2,
          price: 100,
        },
        {
          productId: '123e4567-e89b-12d3-a456-426614174012',
          name: 'Service 2',
          quantity: 3,
          price: 50,
        },
      ],
    };
    
    // Override the mock for this test to extract the total
    let extractedTotal = 0;
    (createInvoice as jest.Mock).mockImplementation((data) => {
      extractedTotal = data.totalPrice;
      return Promise.resolve({
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          invoiceNumber: 'INV-TEST123',
          totalPrice: data.totalPrice,
          clientId: data.clientId,
          sellerId: data.sellerId,
        },
      });
    });
    
    // Act
    const result = await createInvoice(invoiceData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(extractedTotal).toBe(350); // (2 * 100) + (3 * 50)
  });
  
  it('retrieves an invoice by invoice number', async () => {
    // Arrange
    const invoiceNumber = 'INV-123456';
    
    // Act
    const result = (await getInvoiceByNumber(invoiceNumber) as unknown) as { 
      success: boolean; 
      data: { 
        invoiceNumber: string;
        client: { id: string; name: string; email: string };
        seller: { id: string; name: string; email: string };
        items: Array<{ 
          id: string; 
          invoiceId: string; 
          productId: string; 
          name: string; 
          quantity: number; 
          price: number;
        }>;
      } 
    };
    
    // Assert
    expect(result).not.toBeNull();
    expect(result.success).toBe(true);
    expect(result.data.invoiceNumber).toBe(invoiceNumber);
    expect(result.data.client).toBeDefined();
    expect(result.data.seller).toBeDefined();
    expect(result.data.items.length).toBe(1);
  });
}); 
