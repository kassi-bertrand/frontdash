/**
 * Random selection utility functions
 */

/**
 * Pick a random element from an array
 *
 * @param arr - Array to pick from
 * @returns A random element from the array
 * @throws Error if array is empty
 */
export function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error('Cannot pick from an empty array');
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick multiple random elements from an array (with replacement)
 *
 * @param arr - Array to pick from
 * @param count - Number of elements to pick
 * @returns Array of randomly selected elements
 */
export function pickMany<T>(arr: readonly T[], count: number): T[] {
  return Array.from({ length: count }, () => pick(arr));
}
