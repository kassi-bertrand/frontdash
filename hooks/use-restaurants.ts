"use client";

import { useState, useEffect, useCallback } from "react";
import { restaurantApi } from "@/lib/api";
import { toCustomerRestaurant } from "@/lib/transforms/restaurant";
import { getErrorMessage } from "@/lib/utils";
import type { CustomerRestaurant } from "@/lib/types/customer";

/** State returned by useRestaurants hook */
interface RestaurantsState {
  /** Array of restaurants ready for display */
  restaurants: CustomerRestaurant[];
  /** True while fetching from API */
  isLoading: boolean;
  /** Error message if fetch failed, null otherwise */
  error: string | null;
  /** Manually refresh the restaurant list */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and display restaurants on the homepage.
 *
 * Fetches all approved restaurants from the backend, transforms them
 * to the CustomerRestaurant format, and provides loading/error states.
 *
 * NOTE: This fetches ALL restaurants but NOT their menus (too expensive).
 * Use useRestaurant(slug) hook for the detail page to get menu data.
 *
 * @example
 * ```tsx
 * function HomePage() {
 *   const { restaurants, isLoading, error, refetch } = useRestaurants();
 *
 *   if (isLoading) return <RestaurantSkeleton count={6} />;
 *   if (error) return <ErrorState message={error} onRetry={refetch} />;
 *   if (restaurants.length === 0) return <EmptyState />;
 *
 *   return (
 *     <div>
 *       {restaurants.map((r) => (
 *         <RestaurantCard key={r.id} restaurant={r} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRestaurants(): RestaurantsState {
  const [restaurants, setRestaurants] = useState<CustomerRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all restaurants from API
      const apiRestaurants = await restaurantApi.getAll();

      // Transform to display format (no menu data for list view)
      const displayRestaurants = apiRestaurants.map((r) =>
        toCustomerRestaurant(r, [])
      );

      setRestaurants(displayRestaurants);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
      setError(getErrorMessage(err, "Failed to load restaurants. Please try again."));
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    restaurants,
    isLoading,
    error,
    refetch: fetchRestaurants,
  };
}
