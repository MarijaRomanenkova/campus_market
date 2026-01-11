/**
 * Password Reset Email Test
 * 
 * This test script verifies that password reset emails can be sent using Resend.
 * It can be run directly from the command line with:
 * 
 * npm run test:email-reset
 * 
 * You can also specify recipient and sender emails as parameters:
 * npm run test:email-reset -- --email=your-email@example.com --from=another-email@example.com
 */

import { Resend } from 'resend';
import PasswordResetEmail from '../../email/password-reset';
import dotenv from 'dotenv';
import path from 'path';
import { APP_NAME, SERVER_URL } from '@/lib/constants';

// Determine if running as a standalone script or in Jest
const isRunningDirectly = require.main === module;

// Parse any command line arguments
const args = process.argv.slice(2);
const emailArg = args.find(arg => arg.startsWith('--email='));
const nameArg = args.find(arg => arg.startsWith('--name='));
const fromArg = args.find(arg => arg.startsWith('--from='));

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Test configuration
const TEST_EMAIL = emailArg ? emailArg.split('=')[1] : 'marija@example.com';
const TEST_NAME = nameArg ? nameArg.split('=')[1] : 'Marija';
const TEST_TOKEN = `test-token-${Date.now()}`;
const SENDER_EMAIL = fromArg ? fromArg.split('=')[1] : (process.env.SENDER_EMAIL || 'onboarding@resend.dev');

// Initialize Resend client with API key
const resend = new Resend(process.env.RESEND_API_KEY as string);

/**
 * Send a test password reset email
 */
async function testPasswordResetEmail(): Promise<{ success: boolean, id?: string, error?: unknown }> {
  console.log('🧪 Testing Password Reset Functionality');
  console.log('-------------------------------------');
  console.log(`📧 Recipient: ${TEST_EMAIL}`);
  console.log(`👤 Name: ${TEST_NAME}`);
  console.log(`💌 From: ${SENDER_EMAIL}`);
  console.log(`🔑 Token: ${TEST_TOKEN}`);
  
  const resetLink = `${SERVER_URL}/reset-password?token=${TEST_TOKEN}`;
  
  console.log(`🔗 Reset Link: ${resetLink}`);
  console.log('');
  console.log('Sending email...');

  try {
    const result = await resend.emails.send({
      from: `${APP_NAME} <${SENDER_EMAIL}>`,
      to: TEST_EMAIL,
      subject: `Reset Your ${APP_NAME} Password`,
      react: PasswordResetEmail({ name: TEST_NAME, resetLink }),
    });

    if (result.error) {
      throw result.error;
    }
    
    console.log('');
    console.log('✅ Email sent successfully!');
    console.log(`📋 Email ID: ${result.data?.id || 'unknown'}`);
    console.log('');
    console.log('📱 Check your inbox at:');
    console.log(`   ${TEST_EMAIL}`);
    console.log('');
    console.log('This verifies that:');
    console.log('1. Your Resend API key is working');
    console.log('2. Your email template renders correctly');
    console.log('3. The password reset flow can send emails');
    
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.log('');
    console.error('❌ Failed to send email:');
    console.error(error);
    console.log('');
    console.log('Troubleshooting:');
    console.log('1. Check that your RESEND_API_KEY is correct in .env');
    console.log('2. Verify that SENDER_EMAIL is valid');
    console.log('3. Make sure the recipient email address is valid');
    console.log('4. Check that your React email template is working properly');
    
    return { success: false, error };
  }
}

// If running directly, execute the test and exit
if (isRunningDirectly) {
  testPasswordResetEmail()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed with error:', error);
      process.exit(1);
    });
}

// For Jest test suite
describe('Password Reset Email', () => {
  // Skip this test by default in test suite to avoid actual email sending
  it.skip('can send password reset emails', async () => {
    // Only run this when explicitly enabled
    if (process.env.RUN_EMAIL_TESTS === 'true') {
      const result = await testPasswordResetEmail();
      expect(result.success).toBe(true);
    } else {
      console.log('Skipping email test. Set RUN_EMAIL_TESTS=true to enable.');
      expect(true).toBe(true); // Always pass when skipped
    }
  });
}); 
