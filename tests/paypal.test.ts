/**
 * PayPal API Integration Tests
 */
import { generateAccessToken, paypal } from '@/lib/paypal';

// Mock fetch API for tests
global.fetch = jest.fn();

// Helper to mock fetch responses
function mockFetchResponse(status: number, data: Record<string, unknown>) {
  return Promise.resolve({
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    ok: status >= 200 && status < 300
  });
}

describe('PayPal API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates token from paypal', async () => {
    // Mock a successful token response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      mockFetchResponse(200, {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      })
    );

    const token = await generateAccessToken();
    expect(token).toBe('mock-access-token');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('creates a paypal order', async () => {
    // Mock successful token and order creation
    (global.fetch as jest.Mock)
      // First for token
      .mockImplementationOnce(() => 
        mockFetchResponse(200, {
          access_token: 'mock-access-token'
        })
      )
      // Then for order creation
      .mockImplementationOnce(() => 
        mockFetchResponse(200, {
          id: 'mock-order-id',
          status: 'CREATED'
        })
      );

    const order = await paypal.createPayment(100.00);

    expect(order.id).toBe('mock-order-id');
    expect(order.status).toBe('CREATED');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('captures a payment', async () => {
    // Mock successful token and capture
    (global.fetch as jest.Mock)
      // First for token
      .mockImplementationOnce(() => 
        mockFetchResponse(200, {
          access_token: 'mock-access-token'
        })
      )
      // Then for payment capture
      .mockImplementationOnce(() => 
        mockFetchResponse(200, {
          id: 'mock-capture-id',
          status: 'COMPLETED'
        })
      );

    const captureResult = await paypal.capturePayment('mock-order-id');
    
    expect(captureResult.id).toBe('mock-capture-id');
    expect(captureResult.status).toBe('COMPLETED');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles API errors', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      mockFetchResponse(401, {
        error: 'invalid_client',
        error_description: 'Client Authentication failed'
      })
    );

    await expect(generateAccessToken()).rejects.toThrow('Client Authentication failed');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
