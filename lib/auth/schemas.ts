/**
 * Authentication Schemas
 *
 * Single source of truth for all auth validation using Zod.
 * Types are inferred from schemas to avoid duplication.
 *
 * Why Zod?
 * - Runtime validation (TypeScript types are compile-time only)
 * - Automatic type inference (no duplicate definitions)
 * - Clear error messages for users
 */

import { z } from "zod";

/**
 * Schema for POST /api/auth/sign-in request body.
 * Used by login-form.tsx to validate before sending to server.
 */
export const SignInRequestSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  /** Optional: restrict login to specific roles (used by restaurant portal) */
  requiredRole: z.enum(["admin", "staff", "restaurant"]).optional(),
});

/** TypeScript type inferred from SignInRequestSchema */
export type SignInRequest = z.infer<typeof SignInRequestSchema>;

/**
 * Schema for Express backend /api/auth/login response.
 * Backend uses UPPERCASE roles, frontend converts to lowercase.
 */
export const BackendLoginResponseSchema = z.object({
  message: z.string(),
  role: z.enum(["ADMIN", "STAFF", "RESTAURANT"]),
  username: z.string(),
  must_change_password: z.boolean().optional().default(false),
  /** Present only for STAFF role */
  staff_id: z.number().optional(),
  /** Present only for RESTAURANT role */
  restaurant_id: z.number().optional(),
});

/** TypeScript type inferred from BackendLoginResponseSchema */
export type BackendLoginResponse = z.infer<typeof BackendLoginResponseSchema>;

/**
 * Safely parse and validate a sign-in request body.
 * Returns discriminated union for easy error handling.
 *
 * @param body - Raw request body (unknown type from JSON parse)
 * @returns { success: true, data } or { success: false, message }
 */
export function parseSignInRequest(body: unknown):
  | { success: true; data: SignInRequest }
  | { success: false; message: string } {
  const result = SignInRequestSchema.safeParse(body);
  if (!result.success) {
    return { success: false, message: result.error.issues[0]?.message || "Invalid request" };
  }
  return { success: true, data: result.data };
}

/**
 * Safely parse and validate backend login response.
 * Returns discriminated union for easy error handling.
 *
 * @param data - Raw response from Express backend
 * @returns { success: true, data } or { success: false, message }
 */
export function parseBackendResponse(data: unknown):
  | { success: true; data: BackendLoginResponse }
  | { success: false; message: string } {
  const result = BackendLoginResponseSchema.safeParse(data);
  if (!result.success) {
    console.error("Invalid backend response:", result.error);
    return { success: false, message: "Unexpected response from authentication server" };
  }
  return { success: true, data: result.data };
}
