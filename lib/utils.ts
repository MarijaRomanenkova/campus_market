/**
 * Utility Functions Module
 * @module Lib/Utils
 * 
 * This module provides various utility functions used throughout the application for
 * common tasks such as string manipulation, number formatting, error handling, date formatting,
 * and other helper functions.
 */

import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ReadonlyURLSearchParams } from 'next/navigation';
import qs from 'query-string';

/**
 * Merges multiple class names together, combining Tailwind classes efficiently
 * @param {ClassValue[]} inputs - Array of class values to be merged
 * @returns {string} Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts Prisma objects to plain JavaScript objects
 * This helps with serialization issues when working with Prisma data
 * @template T - The type of object being converted
 * @param {T} obj - The object to convert
 * @returns {T} Plain JavaScript object without Prisma metadata
 */
export function convertToPlainObject<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Formats a number with two decimal places
 * @param {number} value - Number to format
 * @returns {string} Formatted string with two decimal places
 */
export function formatNumberWithDecimal(value: number) {
  return value.toFixed(2);
}

/**
 * Formats error messages from various sources into a consistent format
 * Handles special cases for Zod validation errors and Prisma database errors
 * @param {unknown} error - The error to format
 * @returns {string} Formatted error message
 */
export function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.errors[0].message;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    if (error.meta?.target) {
      const fields = (error.meta.target as string[]).join(', ');
      return `${fields} already exists.`;
    } else {
      return 'This record already exists.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

/**
 * Rounds a number to two decimal places
 * @param {number} num - Number to round
 * @returns {number} Rounded number
 */
export function round2(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a number as currency with dollar sign
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (e.g. $123.45)
 */
export function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

/**
 * Formats a number for display with commas for thousands
 * @param {number} num - Number to format
 * @returns {string} Formatted number string (e.g. 1,234,567)
 */
export function formatNumber(num: number) {
  return new Intl.NumberFormat().format(num);
}

/**
 * Shortens a UUID string for display purposes
 * @param {string} id - UUID to format
 * @returns {string} Shortened ID (first 8 characters)
 */
export function formatId(id: string) {
  return id.substring(0, 8);
}

/**
 * Formats a date string into a readable date and time format
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

/**
 * Creates a URL query string by adding, updating, or removing a parameter
 * @param {ReadonlyURLSearchParams|null} searchParams - Current URL search parameters
 * @param {string} key - Key of the parameter to modify
 * @param {string} value - New value for the parameter (empty to remove)
 * @returns {string} New URL query string
 */
export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: ReadonlyURLSearchParams | null;
  key: string;
  value: string;
}) {
  const currentUrl = qs.parse(params?.toString() || '');

  if (value) {
    currentUrl[key] = value;
  } else {
    delete currentUrl[key];
  }

  return qs.stringify(currentUrl, { skipEmptyString: true, skipNull: true });
}
