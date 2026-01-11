/**
 * Email Service Mock Tests
 * 
 * Tests the email functionality using mocks instead of actually sending emails
 */

// Create a mock send function
const mockSendFn = jest.fn().mockResolvedValue({
  data: { id: 'mock-email-id' },
  error: null
});

// Mock the Resend package
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSendFn
    }
  }))
}));

// Import after mocking
import { Resend } from 'resend';

// Simple function to simulate email sending
async function sendTestEmail(to: string, subject: string, html: string) {
  const resend = new Resend('mock-api-key');
  return resend.emails.send({
    from: 'test@example.com',
    to,
    subject,
    html
  });
}

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should successfully send an email', async () => {
    const result = await sendTestEmail(
      'user@example.com',
      'Test Email',
      '<p>This is a test email</p>'
    );
    
    // Check that the mock was called with correct parameters
    expect(mockSendFn).toHaveBeenCalledWith({
      from: 'test@example.com',
      to: 'user@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email</p>'
    });
    
    // Verify the returned data
    expect(result.data).toEqual({ id: 'mock-email-id' });
    expect(result.error).toBeNull();
  });
  
  it('should handle errors when sending emails', async () => {
    // Override the mock for this specific test
    mockSendFn.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid recipient email', statusCode: 400 }
    });
    
    const result = await sendTestEmail(
      'invalid-email',
      'Test Email',
      '<p>This is a test email</p>'
    );
    
    expect(result.data).toBeNull();
    expect(result.error).toEqual({ 
      message: 'Invalid recipient email', 
      statusCode: 400 
    });
  });
}); 
