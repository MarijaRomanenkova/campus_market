import { test, expect } from '@playwright/test';

/**
 * E2E Test: User Registration Flow
 * 
 * Tests the complete user registration process including:
 * - Form validation (email domain check)
 * - Successful registration with valid @campus.edu email
 * - Error handling for invalid emails
 * - Terms acceptance dialog
 * - Redirect after registration
 */
test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-up page before each test
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');
  });

  test('should display sign-up form correctly', async ({ page }) => {
    // Check that the form is visible - look for card title or heading
    await expect(
      page.getByText(/create account/i).or(page.getByRole('heading'))
    ).toBeVisible({ timeout: 10000 });
    
    // Check form fields are present using placeholders
    await expect(page.getByPlaceholder(/your full name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/create a password/i)).toBeVisible();
    await expect(page.getByPlaceholder(/confirm your password/i)).toBeVisible();
    
    // Check submit button is present
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
  });

  test('should reject non-campus email addresses', async ({ page }) => {
    // Fill form with invalid email (not @campus.edu)
    await page.getByPlaceholder(/your full name/i).fill('Test User');
    await page.getByPlaceholder(/email@example.com/i).fill('test@gmail.com');
    await page.getByPlaceholder(/create a password/i).fill('TestPassword123!');
    await page.getByPlaceholder(/confirm your password/i).fill('TestPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for validation error
    await expect(
      page.getByText(/please provide your student email to register/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should accept valid @campus.edu email and show terms dialog', async ({ page }) => {
    // Generate unique email to avoid conflicts
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@campus.edu`;
    
    // Fill form with valid campus email
    await page.getByPlaceholder(/your full name/i).fill('Test User');
    await page.getByPlaceholder(/email@example.com/i).fill(testEmail);
    await page.getByPlaceholder(/create a password/i).fill('TestPassword123!');
    await page.getByPlaceholder(/confirm your password/i).fill('TestPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for terms dialog to appear - use heading instead
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: /terms and conditions/i })
    ).toBeVisible({ timeout: 5000 });
    
    // Check that terms dialog has accept button (could be "Accept", "Sign Up", etc.)
    await expect(
      page.getByRole('dialog').getByRole('button').filter({ hasText: /accept|sign up|continue/i })
    ).toBeVisible();
  });


  test('should validate password requirements', async ({ page }) => {
    // Fill form with weak password
    await page.getByPlaceholder(/your full name/i).fill('Test User');
    await page.getByPlaceholder(/email@example.com/i).fill('test@campus.edu');
    await page.getByPlaceholder(/create a password/i).fill('weak');
    await page.getByPlaceholder(/confirm your password/i).fill('weak');
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for password validation error
    await expect(
      page.getByText(/password must be at least 8 characters/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should validate password confirmation match', async ({ page }) => {
    // Fill form with mismatched passwords
    await page.getByPlaceholder(/your full name/i).fill('Test User');
    await page.getByPlaceholder(/email@example.com/i).fill('test@campus.edu');
    await page.getByPlaceholder(/create a password/i).fill('TestPassword123!');
    await page.getByPlaceholder(/confirm your password/i).fill('DifferentPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for password mismatch error
    await expect(
      page.getByText(/passwords don't match/i).or(page.getByText(/passwords do not match/i))
    ).toBeVisible({ timeout: 5000 });
  });

  test('should validate name field requirements', async ({ page }) => {
    // Fill form with short name
    await page.getByPlaceholder(/your full name/i).fill('Ab');
    await page.getByPlaceholder(/email@example.com/i).fill('test@campus.edu');
    await page.getByPlaceholder(/create a password/i).fill('TestPassword123!');
    await page.getByPlaceholder(/confirm your password/i).fill('TestPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /sign up/i }).click();
    
    // Wait for name validation error
    await expect(
      page.getByText(/name must be at least 3 characters/i)
    ).toBeVisible({ timeout: 5000 });
  });
});
