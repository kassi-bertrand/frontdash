/**
 * Error handling utilities
 * Provides type-safe error handling without using `any`
 */

/**
 * Extract error message from unknown error type
 * Safely handles Error instances, strings, and objects with message property
 *
 * @param error - The caught error of unknown type
 * @param fallback - Default message if error cannot be parsed
 * @returns The error message string
 */
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

/**
 * Type guard for PostgreSQL errors
 * Checks if an error has the PostgreSQL error code property
 *
 * @param error - The caught error of unknown type
 * @returns True if the error has a PostgreSQL code property
 */
export function isPgError(error: unknown): error is { code: string; message?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * PostgreSQL error codes
 * Common codes for handling specific database errors
 */
export const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
} as const;
