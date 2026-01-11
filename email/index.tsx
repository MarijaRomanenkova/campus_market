/**
 * Email Service Module
 * @module Email
 * 
 * This module provides email sending functionality for various application features.
 * It leverages the Resend email service to send transactional emails with React templates.
 */

import { Resend } from 'resend';
import { SENDER_EMAIL, APP_NAME, SERVER_URL } from '@/lib/constants/index';
import { Payment } from '@/types';
import dotenv from 'dotenv';
dotenv.config();

import PurchaseReceiptEmail from './purchase-receipt';
import PasswordResetEmail from './password-reset';
import EmailVerification from './email-verification';

// Initialize Resend client with API key
const resend = new Resend(process.env.RESEND_API_KEY as string);

/**
 * Sends a purchase receipt email to a user after successful payment
 * 
 * Generates and sends a formatted email receipt containing:
 * - Payment ID and date
 * - Invoices included in the payment
 * - Payment total and subtotals
 * 
 * @param {Object} params - Function parameters
 * @param {Payment} params.payment - Payment object containing user and invoice details
 * @returns {Promise<void>} A promise that resolves when the email is sent
 */
export const sendPurchaseReceipt = async ({ payment }: { payment: Payment }) => {
  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: payment.user.email,
    subject: `Payment Confirmation ${payment.id}`,
    react: <PurchaseReceiptEmail payment={payment} />,
  });
};

/**
 * Sends a password reset email to a user
 * 
 * Generates and sends a formatted email containing:
 * - User's name
 * - Password reset link with secure token
 * - Instructions and expiration information
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.email - User's email address
 * @param {string} params.name - User's name
 * @param {string} params.token - Secure reset token
 * @returns {Promise<void>} A promise that resolves when the email is sent
 */
export const sendPasswordResetEmail = async ({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}) => {
  // Use SERVER_URL constant which uses NEXT_PUBLIC_SERVER_URL environment variable
  const resetLink = `${SERVER_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: email,
    subject: `Reset Your ${APP_NAME} Password`,
    react: <PasswordResetEmail name={name} resetLink={resetLink} />,
  });
};

/**
 * Sends an email verification to a user
 * 
 * Generates and sends a formatted email containing:
 * - User's name
 * - Email verification link with secure token
 * - Instructions for completing registration
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.email - User's email address
 * @param {string} params.name - User's name
 * @param {string} params.token - Secure verification token
 * @returns {Promise<void>} A promise that resolves when the email is sent
 */
export const sendVerificationEmail = async ({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}) => {
  // Use SERVER_URL constant which uses NEXT_PUBLIC_SERVER_URL environment variable
  const verificationLink = `${SERVER_URL}/verify?token=${token}`;

  await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: email,
    subject: `Verify Your ${APP_NAME} Account`,
    react: <EmailVerification name={name} verificationLink={verificationLink} />,
  });
};
