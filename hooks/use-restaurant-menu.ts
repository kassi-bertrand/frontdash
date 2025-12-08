"use client";

import { useState, useEffect, useCallback } from "react";
import { menuApi, type MenuItem } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

/**
 * Frontend-friendly menu item format.
 * Maps from backend MenuItem to the format used in menu-management-panel.
 */
export interface RestaurantMenuItem {
  id: string;
  name: string;
  price: number;
  availability: "AVAILABLE" | "UNAVAILABLE";
  imageUrl?: string;
  description?: string;
}

/**
 * Input for creating a new menu item.
 */
export interface CreateMenuItemInput {
  name: string;
  price: number;
  availability?: "AVAILABLE" | "UNAVAILABLE";
  imageUrl?: string;
  description?: string;
}

/**
 * Input for updating an existing menu item.
 */
export interface UpdateMenuItemInput {
  name?: string;
  price?: number;
  availability?: "AVAILABLE" | "UNAVAILABLE";
  imageUrl?: string;
  description?: string;
}

/** State returned by useRestaurantMenu hook */
interface RestaurantMenuState {
  /** Menu items for this restaurant */
  items: RestaurantMenuItem[];
  /** True while fetching from API */
  isLoading: boolean;
  /** True while a create/update/delete operation is in progress */
  isSaving: boolean;
  /** Error message if fetch failed, null otherwise */
  error: string | null;
  /** Refetch menu items from API */
  refetch: () => Promise<void>;
  /** Create a new menu item */
  createItem: (input: CreateMenuItemInput) => Promise<RestaurantMenuItem>;
  /** Update an existing menu item */
  updateItem: (id: string, input: UpdateMenuItemInput) => Promise<RestaurantMenuItem>;
  /** Delete a menu item */
  deleteItem: (id: string) => Promise<void>;
}

/**
 * Transform backend MenuItem to frontend RestaurantMenuItem format.
 */
function toRestaurantMenuItem(item: MenuItem): RestaurantMenuItem {
  return {
    id: String(item.menu_item_id),
    name: item.item_name,
    // Backend returns price as string from PostgreSQL DECIMAL, convert to number
    price: typeof item.item_price === 'string' ? parseFloat(item.item_price) : item.item_price,
    availability: item.availability_status,
    imageUrl: item.item_image_url,
    description: item.item_description,
  };
}

/**
 * Transform frontend input to backend API format for creating items.
 */
function toCreatePayload(input: CreateMenuItemInput): Omit<MenuItem, 'menu_item_id' | 'restaurant_id' | 'updated_at'> {
  return {
    item_name: input.name,
    item_price: input.price,
    availability_status: input.availability ?? "AVAILABLE",
    item_image_url: input.imageUrl,
    item_description: input.description,
  };
}

/**
 * Transform frontend input to backend API format for updating items.
 */
function toUpdatePayload(input: UpdateMenuItemInput): Partial<MenuItem> {
  const payload: Partial<MenuItem> = {};
  if (input.name !== undefined) payload.item_name = input.name;
  if (input.price !== undefined) payload.item_price = input.price;
  if (input.availability !== undefined) payload.availability_status = input.availability;
  if (input.imageUrl !== undefined) payload.item_image_url = input.imageUrl;
  if (input.description !== undefined) payload.item_description = input.description;
  return payload;
}

/**
 * Hook to fetch and manage menu items for a restaurant.
 *
 * Provides CRUD operations that call the backend API and keep local state in sync.
 *
 * @param restaurantId - The restaurant ID to fetch menu items for
 *
 * @example
 * ```tsx
 * function MenuPanel() {
 *   const { user } = useAuth();
 *   const restaurantId = isRestaurantUser(user) ? user.restaurantId : null;
 *
 *   const { items, isLoading, error, createItem, updateItem, deleteItem } =
 *     useRestaurantMenu(restaurantId ?? 0);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorState message={error} />;
 *
 *   return (
 *     <ul>
 *       {items.map(item => <MenuItem key={item.id} item={item} />)}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useRestaurantMenu(restaurantId: number): RestaurantMenuState {
  const [items, setItems] = useState<RestaurantMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!restaurantId) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiItems = await menuApi.getByRestaurant(restaurantId);
      setItems(apiItems.map(toRestaurantMenuItem));
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
      setError(getErrorMessage(err, "Failed to load menu items. Please try again."));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = useCallback(
    async (input: CreateMenuItemInput): Promise<RestaurantMenuItem> => {
      setIsSaving(true);
      try {
        const response = await menuApi.create(restaurantId, toCreatePayload(input));
        const newItem = toRestaurantMenuItem(response.menu_item);
        setItems((prev) => [newItem, ...prev]);
        return newItem;
      } catch (err) {
        console.error("Failed to create menu item:", err);
        throw new Error(getErrorMessage(err, "Failed to create menu item."));
      } finally {
        setIsSaving(false);
      }
    },
    [restaurantId]
  );

  const updateItem = useCallback(
    async (id: string, input: UpdateMenuItemInput): Promise<RestaurantMenuItem> => {
      setIsSaving(true);
      try {
        const response = await menuApi.update(Number(id), toUpdatePayload(input));
        const updatedItem = toRestaurantMenuItem(response.menu_item);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );
        return updatedItem;
      } catch (err) {
        console.error("Failed to update menu item:", err);
        throw new Error(getErrorMessage(err, "Failed to update menu item."));
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await menuApi.delete(Number(id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete menu item:", err);
      throw new Error(getErrorMessage(err, "Failed to delete menu item."));
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    items,
    isLoading,
    isSaving,
    error,
    refetch: fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
