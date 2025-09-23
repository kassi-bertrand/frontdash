import { create } from 'zustand'

export type CartItemSnapshot = {
  id: string
  name: string
  priceCents: number
  quantity: number
  description?: string
  imageUrl?: string
}

export type RestaurantSnapshot = {
  slug: string
  name: string
}

export type RestaurantCart = {
  restaurant: RestaurantSnapshot
  items: Record<string, CartItemSnapshot>
}

type CartState = {
  activeRestaurantSlug?: string
  cartsByRestaurant: Record<string, RestaurantCart>
}

type CartActions = {
  setActiveRestaurant: (restaurant: RestaurantSnapshot) => void
  incrementItem: (payload: {
    restaurant: RestaurantSnapshot
    item: Omit<CartItemSnapshot, 'quantity'>
  }) => void
  decrementItem: (payload: { restaurantSlug: string; itemId: string }) => void
  clearCart: (restaurantSlug: string) => void
}

/**
 * Global cart store keeps a separate cart per restaurant so guests can start
 * an order, explore other menus, and return without losing their picks.
 */
export const useCartStore = create<CartState & CartActions>((set) => ({
  activeRestaurantSlug: undefined,
  cartsByRestaurant: {},

  setActiveRestaurant: (restaurant) =>
    set((state) => {
      const existingCart = state.cartsByRestaurant[restaurant.slug]

      return {
        activeRestaurantSlug: restaurant.slug,
        cartsByRestaurant: {
          ...state.cartsByRestaurant,
          [restaurant.slug]: existingCart ?? {
            restaurant,
            items: {},
          },
        },
      }
    }),

  incrementItem: ({ restaurant, item }) =>
    set((state) => {
      const cart = state.cartsByRestaurant[restaurant.slug] ?? {
        restaurant,
        items: {},
      }

      const existingQuantity = cart.items[item.id]?.quantity ?? 0
      const nextCart: RestaurantCart = {
        restaurant: cart.restaurant,
        items: {
          ...cart.items,
          [item.id]: {
            ...cart.items[item.id],
            ...item,
            quantity: existingQuantity + 1,
          },
        },
      }

      return {
        activeRestaurantSlug: restaurant.slug,
        cartsByRestaurant: {
          ...state.cartsByRestaurant,
          [restaurant.slug]: nextCart,
        },
      }
    }),

  decrementItem: ({ restaurantSlug, itemId }) =>
    set((state) => {
      const cart = state.cartsByRestaurant[restaurantSlug]
      if (!cart) {
        return state
      }

      const currentItem = cart.items[itemId]
      if (!currentItem) {
        return state
      }

      const nextQuantity = currentItem.quantity - 1
      const nextItems = { ...cart.items }

      if (nextQuantity <= 0) {
        delete nextItems[itemId]
      } else {
        nextItems[itemId] = {
          ...currentItem,
          quantity: nextQuantity,
        }
      }

      return {
        ...state,
        cartsByRestaurant: {
          ...state.cartsByRestaurant,
          [restaurantSlug]: {
            restaurant: cart.restaurant,
            items: nextItems,
          },
        },
      }
    }),

  clearCart: (restaurantSlug) =>
    set((state) => {
      if (!state.cartsByRestaurant[restaurantSlug]) {
        return state
      }

      const nextCarts = { ...state.cartsByRestaurant }
      delete nextCarts[restaurantSlug]

      return {
        activeRestaurantSlug:
          state.activeRestaurantSlug === restaurantSlug
            ? undefined
            : state.activeRestaurantSlug,
        cartsByRestaurant: nextCarts,
      }
    }),
}))
