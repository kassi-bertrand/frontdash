"use client";

import { useState, useEffect, useCallback } from "react";
import { restaurantApi, menuApi, ApiError } from "@/lib/api";
import { toCustomerRestaurant } from "@/lib/transforms/restaurant";
import { getErrorMessage } from "@/lib/utils";
import type { CustomerRestaurant } from "@/lib/types/customer";

/** State returned by useRestaurant hook */
interface RestaurantState {
  /** Restaurant data with menu, or null if not found/loading */
  restaurant: CustomerRestaurant | null;
  /** True while fetching from API */
  isLoading: boolean;
  /** Error message if fetch failed, null otherwise */
  error: string | null;
  /** True if restaurant was not found (404 case) */
  notFound: boolean;
}

/**
 * Hook to fetch a single restaurant with its menu for the detail page.
 *
 * Flow:
 * 1. Fetches restaurant by slug via efficient SQL lookup (single row)
 * 2. Fetches menu items for that restaurant
 * 3. Transforms to CustomerRestaurant format and returns
 *
 * @param slug - URL slug from /restaurant/[slug] route
 *
 * @example
 * ```tsx
 * function RestaurantPage({ params }: { params: { slug: string } }) {
 *   const { restaurant, isLoading, error, notFound } = useRestaurant(params.slug);
 *
 *   if (isLoading) return <RestaurantDetailSkeleton />;
 *   if (notFound) return <NotFoundPage />;
 *   if (error) return <ErrorState message={error} />;
 *   if (!restaurant) return null;
 *
 *   return <RestaurantDetail restaurant={restaurant} />;
 * }
 * ```
 */
export function useRestaurant(slug: string): RestaurantState {
  const [restaurant, setRestaurant] = useState<CustomerRestaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    try {
      // Fetch restaurant by slug (single API call)
      const apiRestaurant = await restaurantApi.getBySlug(slug);

      // Fetch menu items for this restaurant
      const menuItems = await menuApi.getByRestaurant(apiRestaurant.restaurant_id);

      // Transform to display format
      const displayRestaurant = toCustomerRestaurant(apiRestaurant, menuItems);
      setRestaurant(displayRestaurant);
    } catch (err) {
      console.error("Failed to fetch restaurant:", err);

      // Check if it's a 404 (not found) error using status code
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        setRestaurant(null);
        return;
      }

      setError(getErrorMessage(err, "Failed to load restaurant. Please try again."));
      setRestaurant(null);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  return {
    restaurant,
    isLoading,
    error,
    notFound,
  };
}
