"use client";

import { useState, useEffect, useCallback } from "react";
import { orderApi, type Order, type OrderItemDetail } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

/**
 * Frontend-friendly order status.
 * Maps from backend statuses to simpler kitchen workflow states.
 */
type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED';

/**
 * Frontend order format for the restaurant dashboard.
 */
export interface RestaurantOrder {
  /** Order number (e.g., "ORD-20251028-TEST") */
  id: string;
  /** Formatted time when order was placed (e.g., "12:52 PM") */
  placedAt: string;
  /** Comma-separated list of items (e.g., "2× Margherita Pizza") */
  items: string;
  /** Customer's name */
  customer: string;
  /** Workflow status for kitchen display */
  status: OrderStatus;
}


/** State returned by useRestaurantOrders hook */
interface RestaurantOrdersState {
  /** Orders for this restaurant */
  orders: RestaurantOrder[];
  /** True while fetching from API */
  isLoading: boolean;
  /** Error message if fetch failed, null otherwise */
  error: string | null;
  /** Refetch orders from API */
  refetch: () => Promise<void>;
}

/**
 * Maps backend order status to frontend kitchen workflow status.
 *
 * Backend statuses: PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
 * Frontend statuses: NEW, PREPARING, READY, COMPLETED
 */
function mapOrderStatus(backendStatus: Order['order_status']): OrderStatus {
  switch (backendStatus) {
    case 'PENDING':
      return 'NEW';
    case 'CONFIRMED':
    case 'PREPARING':
      return 'PREPARING';
    case 'OUT_FOR_DELIVERY':
      return 'READY';
    case 'DELIVERED':
    case 'CANCELLED':
      return 'COMPLETED';
    default:
      return 'NEW';
  }
}

/**
 * Formats a timestamp to a human-readable time (e.g., "12:52 PM").
 */
function formatPlacedAt(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * Formats order items as a comma-separated string (e.g., "2× Margherita Pizza, 1× Pepperoni").
 */
function formatOrderItems(items: OrderItemDetail[]): string {
  if (!items || items.length === 0) return 'No items';

  return items
    .map(item => `${item.quantity}× ${item.item_name}`)
    .join(' · ');
}

/**
 * Hook to fetch and manage orders for a restaurant.
 *
 * @param restaurantId - The restaurant ID to fetch orders for
 *
 * @example
 * ```tsx
 * function OrderQueue() {
 *   const { orders, isLoading, error, refetch } = useRestaurantOrders(restaurantId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage message={error} onRetry={refetch} />;
 *
 *   return <OrdersTable orders={orders} />;
 * }
 * ```
 */
export function useRestaurantOrders(restaurantId: number): RestaurantOrdersState {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all orders for this restaurant
      const apiOrders = await orderApi.getAll({ restaurant_id: restaurantId });

      // Fetch items for each order (N+1 query - could be optimized with a backend endpoint)
      // For active orders list this is acceptable; would need optimization for large order history
      const ordersWithItems = await Promise.all(
        apiOrders.map(async (order) => {
          try {
            const { items } = await orderApi.getByOrderNumber(order.order_number);
            return {
              id: order.order_number,
              placedAt: formatPlacedAt(order.created_at),
              items: formatOrderItems(items),
              customer: order.delivery_contact_name,
              status: mapOrderStatus(order.order_status),
            };
          } catch {
            // If we can't fetch items, still show the order with placeholder
            return {
              id: order.order_number,
              placedAt: formatPlacedAt(order.created_at),
              items: 'Items unavailable',
              customer: order.delivery_contact_name,
              status: mapOrderStatus(order.order_status),
            };
          }
        })
      );

      // Sort by most recent first
      ordersWithItems.sort((a, b) => {
        // Parse times back for comparison (crude but works for same-day)
        return b.placedAt.localeCompare(a.placedAt);
      });

      setOrders(ordersWithItems);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError(getErrorMessage(err, "Failed to load orders."));
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}
