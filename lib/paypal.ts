/**
 * PayPal Integration Module
 * @module Lib/PayPal
 * 
 * This module provides integration with the PayPal API for payment processing.
 * It includes functions for creating and capturing payments using PayPal's REST API.
 */

// Base URL for the PayPal API (defaults to sandbox for development)
const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

/**
 * PayPal API client object
 * @namespace
 */
export const paypal = {
  /**
   * Creates a PayPal payment/order
   * 
   * Initializes a payment in PayPal that the user can approve.
   * This is the first step in the PayPal checkout flow.
   * 
   * @param {number} price - The payment amount
   * @returns {Promise<Object>} The PayPal order details including order ID
   * @throws {Error} If the PayPal API returns an error
   */
  createPayment: async function createPayment(price: number) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: price,
            },
          },
        ],
      }),
    });

    return handleResponse(response);
  },
  
  /**
   * Captures a PayPal payment
   * 
   * Finalizes an approved PayPal payment by capturing the funds.
   * This is called after the user has approved the payment.
   * 
   * @param {string} orderId - The PayPal order ID to capture
   * @returns {Promise<Object>} The capture details and status
   * @throws {Error} If the PayPal API returns an error
   */
  capturePayment: async function capturePayment(orderId: string) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderId}/capture`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return handleResponse(response);
  },
};

/**
 * Generates a PayPal access token
 * 
 * Creates an OAuth access token for authenticating with the PayPal API.
 * Uses the application's client ID and secret.
 * 
 * @private
 * @returns {Promise<string>} The PayPal access token
 * @throws {Error} If authentication fails
 */
async function generateAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env;
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString(
    'base64'
  );

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const jsonData = await handleResponse(response);
  return jsonData.access_token;
}

/**
 * Handles PayPal API responses
 * 
 * Processes the response from PayPal API calls, checking for errors
 * and converting the response to JSON.
 * 
 * @private
 * @param {Response} response - The fetch API response object
 * @returns {Promise<any>} The JSON response data
 * @throws {Error} If the response is not successful
 */
async function handleResponse(response: Response) {
  if (response.ok) {
    return response.json();
  } else {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}

export { generateAccessToken };
