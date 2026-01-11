'use server';

/**
 * User management functions for authentication and profile operations
 * @module UserActions
 * @group API
 * 
 * This module provides server-side functions for handling user operations including:
 * - User authentication (sign in, sign out)
 * - Profile management
 * - User creation and updates
 * - Role-based access control
 */

import {
  signInFormSchema,
  signUpFormSchema,
  paymentMethodSchema,
  updateUserSchema,
  updateProfileSchema,
} from '@/lib/validators';
import { auth, signIn, signOut } from '@/auth';
import { hashSync } from 'bcrypt-ts';
import { prisma } from '@/db/prisma';
import { formatError } from '@/lib/utils';
import { z } from 'zod';
import { PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { getMyCart } from './cart.actions';

/**
 * Authenticates a user with email and password credentials
 * 
 * @param prevState - Previous form state
 * @param formData - Form data containing email and password
 * @returns Authentication result with success status and message
 * 
 * @example
 * // In a React Server Action component:
 * const [state, formAction] = useFormState(signInWithCredentials, { 
 *   success: false, 
 *   message: '' 
 * });
 */
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    // Check if user exists and get their ID before authentication
    const userRecord = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!userRecord) {
      return { success: false, message: 'Invalid email or password' };
    }

    // We don't want to throw a redirect from here so we can handle it in the component
    await signIn('credentials', {
      ...user,
      redirect: false
    });

    // Check if this user has a pending password reset requirement
    const passwordReset = await prisma.passwordReset.findFirst({
      where: { 
        userId: userRecord.id,
        changeOnFirstLogin: true
      }
    });

    if (passwordReset) {
      // Generate a new token for immediate password change
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      // Update the token but keep the changeOnFirstLogin flag
      await prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: {
          token,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        }
      });

      // Return success but with flag to change password
      return { 
        success: true, 
        message: 'Password change required', 
        requirePasswordChange: true,
        resetToken: token
      };
    }

    return { success: true, message: 'Signed in successfully' };
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    return { success: false, message: 'Invalid email or password' };
  }
}

/**
 * Signs out the current user and cleans up their cart
 * 
 * @returns Redirects to the sign-in page
 * 
 * @example
 * // In a client component:
 * <button onClick={() => signOutUser()}>Sign Out</button>
 */
export async function signOutUser() {
  // get current users cart and delete it so it does not persist to next user
  const currentCart = await getMyCart();

  if (currentCart?.id) {
    await prisma.cart.delete({ where: { id: currentCart.id } });
  } else {
    console.warn('No cart found for deletion.');
  }
  await signOut();
}

/**
 * Creates a new user account
 * @param prevState - Previous form state (unused, but required for Server Action)
 * @param formData - Form data containing user details
 * @returns User creation result with success status and message
 */
export async function signUpUser(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate form data
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const callbackUrl = formData.get('callbackUrl') as string;

    // Password validation
    if (password !== confirmPassword) {
      return { success: false, message: "Passwords don't match" };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, message: 'Email already in use' };
    }

    // Check if there's an existing verification for this email
    const existingVerification = await prisma.emailVerification.findUnique({
      where: { email },
    });

    if (existingVerification) {
      // Delete old verification
      await prisma.emailVerification.delete({
        where: { id: existingVerification.id },
      });
    }

    // Hash the password
    const hashedPassword = hashSync(password, 10);
    
    // Generate a token for email verification
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Store verification data
    await prisma.emailVerification.create({
      data: {
        email,
        name,
        token,
        password: hashedPassword,
        expiresAt,
      },
    });

    // Send verification email
    const { sendVerificationEmail } = await import('@/email');
    await sendVerificationEmail({
      email,
      name,
      token,
    });

    return {
      success: true,
      message: 'Verification email has been sent. Please check your inbox.',
    };
  } catch (error) {
    console.error('Error during user registration:', error);
    return {
      success: false,
      message: 'Failed to create account. Please try again later.',
    };
  }
}

/**
 * Retrieves a user by their ID
 * 
 * @param userId - The user's unique identifier
 * @returns The user object with numeric conversions for decimal values
 * @throws Error if user is not found
 * 
 * @example
 * try {
 *   const user = await getUserById('user-123');
 *   console.log(user.name);
 * } catch (error) {
 *   console.error('User not found');
 * }
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error('User not found');
  
  // Handle Decimal objects by converting them to regular numbers
  return {
    ...user,
    clientRating: user.clientRating !== null ? Number(user.clientRating) : null,
    sellerRating: user.sellerRating !== null ? Number(user.sellerRating) : null
  };
}

/**
 * Updates the current user's preferred payment method
 * 
 * @param data - Payment method data containing the payment type
 * @returns Update result with success status and message
 * 
 * @example
 * const result = await updateUserPaymentMethod({ type: 'Stripe' });
 * if (result.success) {
 *   showToast('Payment method updated');
 * }
 */
export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>
) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!currentUser) throw new Error('User not found');

    const paymentMethod = paymentMethodSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: paymentMethod.paymentMethod },
    });

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Updates the current user's profile information
 * 
 * @param user - User profile data to update
 * @returns Update result with success status and message
 * 
 * @example
 * const result = await updateProfile({
 *   name: 'John Doe',
 *   fullName: 'John Robert Doe',
 *   phoneNumber: '+1234567890'
 * });
 */
export async function updateProfile(user: z.infer<typeof updateProfileSchema>) {
  try {
    const session = await auth();

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });

    if (!currentUser) throw new Error('User not found');

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: user.name,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        companyId: user.companyId,
        // Handle address as a string that gets converted to JSON
        address: user.address ? JSON.stringify({ address: user.address }) : undefined,
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Retrieves users with pagination and optional filtering
 * 
 * @param options - Query options for retrieving users
 * @param options.limit - Maximum number of users to retrieve per page
 * @param options.page - Page number to retrieve
 * @param options.query - Optional search query to filter users by name
 * @returns Paginated list of users and total page count
 * 
 * @example
 * const { data, totalPages } = await getAllUsers({
 *   page: 1,
 *   query: 'john'
 * });
 */
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query,
}: {
  limit?: number;
  page: number;
  query: string;
}) {
  const queryFilter: Prisma.UserWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  const data = await prisma.user.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.user.count();

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

/**
 * Deletes a user by their ID
 * 
 * @param id - The user's unique identifier
 * @returns Delete result with success status and message
 * 
 * @example
 * const result = await deleteUser('user-123');
 * if (result.success) {
 *   showToast('User deleted successfully');
 * }
 */
export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

/**
 * Updates a user's information (admin functionality)
 * 
 * @param user - User data to update including ID, name and role
 * @returns Update result with success status and message
 * 
 * @example
 * const result = await updateUser({
 *   id: 'user-123',
 *   name: 'John Doe',
 *   role: 'admin'
 * });
 */
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    if (!user.id) {
      throw new Error('User ID is required');
    }

    // Create update data object with required fields
    const updateData: Prisma.UserUpdateInput = {
      name: user.name,
    };
    
    // Add role if provided
    if (user.role) {
      updateData.role = user.role;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'User updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

/**
 * Request a password reset link for a user
 * @param email - The email address to send the password reset link to
 * @returns An object with success status and message
 */
export async function requestPasswordReset(email: string) {
  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Even if the user doesn't exist, we return success for security reasons
    // This prevents user enumeration attacks
    if (!user) {
      return {
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link',
      };
    }

    // Generate a secure random token (using crypto from Node.js)
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Delete any existing password reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });
    
    // Create a new password reset token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        changeOnFirstLogin: true, // User must change password after reset
      },
    });

    // Import and use the email sending function
    const { sendPasswordResetEmail } = await import('@/email');
    
    // Send the password reset email
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token,
    });
    
    return {
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link',
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while processing your request',
    };
  }
}

/**
 * Resets a user's password using a valid reset token
 * @param params - Object containing the token and new password
 * @returns An object with success status and message
 */
export async function resetPassword({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  try {
    // Find the password reset record
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    // Check if the token exists and is valid
    if (!passwordReset) {
      return {
        success: false,
        message: 'Invalid or expired reset token',
      };
    }

    // Check if the token has expired
    if (new Date() > passwordReset.expiresAt) {
      // Clean up expired token
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      });
      
      return {
        success: false,
        message: 'Reset token has expired. Please request a new password reset.',
      };
    }

    // Hash the new password
    const hashedPassword = hashSync(password, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: passwordReset.userId },
      data: { 
        password: hashedPassword,
      },
    });

    // Delete the used token
    await prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    });

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while resetting your password',
    };
  }
}

/**
 * Verifies a user's email and creates their account
 * @param token - The verification token from the email link
 * @returns Verification result with success status and message
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    // Find the verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    });

    // Check if the verification record exists
    if (!verification) {
      return {
        success: false,
        message: 'Invalid verification token. Please request a new verification email.',
      };
    }

    // Check if the token has expired
    if (new Date() > verification.expiresAt) {
      // Clean up expired token
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      
      return {
        success: false,
        message: 'Verification token has expired. Please sign up again.',
      };
    }

    // Check if the email is already used for an account
    const existingUser = await prisma.user.findUnique({
      where: { email: verification.email },
    });

    if (existingUser) {
      // Clean up the verification record
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      
      return {
        success: false,
        message: 'An account with this email already exists.',
      };
    }

    // Create the user account
    await prisma.user.create({
      data: {
        name: verification.name,
        email: verification.email,
        password: verification.password,
        emailVerified: new Date(), // Mark email as verified immediately
      },
    });

    // Delete the verification record
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    return {
      success: true,
      message: 'Email verified successfully. Your account has been created.',
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return {
      success: false,
      message: 'An error occurred while verifying your email. Please try again.',
    };
  }
}
