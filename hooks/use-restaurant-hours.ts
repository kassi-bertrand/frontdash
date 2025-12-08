"use client";

import { useState, useEffect, useCallback } from "react";
import { hoursApi, type OperatingHours } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

/**
 * Day of week type matching the frontend format.
 */
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

/**
 * Frontend-friendly operating hours format.
 * Transforms backend snake_case to camelCase with friendlier values.
 */
export interface RestaurantHoursEntry {
  day: DayOfWeek;
  isOpen: boolean;
  open: string;  // HH:MM format
  close: string; // HH:MM format
}

/** State returned by useRestaurantHours hook */
interface RestaurantHoursState {
  /** Operating hours for each day */
  hours: RestaurantHoursEntry[];
  /** True while fetching from API */
  isLoading: boolean;
  /** True while a save operation is in progress */
  isSaving: boolean;
  /** Error message if fetch failed, null otherwise */
  error: string | null;
  /** Refetch hours from API */
  refetch: () => Promise<void>;
  /** Update hours locally (for optimistic UI) */
  updateDay: (day: DayOfWeek, patch: Partial<Omit<RestaurantHoursEntry, 'day'>>) => void;
  /** Save all hours to backend */
  saveHours: () => Promise<void>;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
}

/** Maps backend day_of_week to frontend day name */
const DAY_MAP: Record<string, DayOfWeek> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

/** Maps frontend day name to backend day_of_week */
const DAY_MAP_REVERSE: Record<DayOfWeek, string> = {
  Monday: 'MONDAY',
  Tuesday: 'TUESDAY',
  Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY',
  Friday: 'FRIDAY',
  Saturday: 'SATURDAY',
  Sunday: 'SUNDAY',
};

/** Ordered days of the week */
const DAYS_ORDER: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Convert backend time (HH:MM:SS) to frontend format (HH:MM).
 */
function formatTime(time: string | null): string {
  if (!time) return '00:00';
  return time.substring(0, 5);
}

/**
 * Transform backend OperatingHours to frontend RestaurantHoursEntry.
 */
function toFrontendHours(backendHours: OperatingHours[]): RestaurantHoursEntry[] {
  const hoursMap = new Map<DayOfWeek, RestaurantHoursEntry>();

  for (const entry of backendHours) {
    const day = DAY_MAP[entry.day_of_week];
    if (day) {
      hoursMap.set(day, {
        day,
        isOpen: !entry.is_closed,
        open: formatTime(entry.opening_time),
        close: formatTime(entry.closing_time),
      });
    }
  }

  // Return in order, filling in missing days with defaults
  return DAYS_ORDER.map(day =>
    hoursMap.get(day) || { day, isOpen: false, open: '09:00', close: '17:00' }
  );
}

/**
 * Transform frontend hours to backend format for saving.
 */
function toBackendHours(frontendHours: RestaurantHoursEntry[]): Partial<OperatingHours>[] {
  return frontendHours.map(entry => ({
    day_of_week: DAY_MAP_REVERSE[entry.day] as OperatingHours['day_of_week'],
    is_closed: !entry.isOpen,
    opening_time: entry.isOpen ? `${entry.open}:00` : null,
    closing_time: entry.isOpen ? `${entry.close}:00` : null,
  }));
}

/**
 * Hook to fetch and manage operating hours for a restaurant.
 *
 * @param restaurantId - The restaurant ID to fetch hours for
 *
 * @example
 * ```tsx
 * function HoursPanel() {
 *   const { hours, isLoading, updateDay, saveHours, hasChanges } =
 *     useRestaurantHours(restaurantId);
 *
 *   return (
 *     <>
 *       {hours.map(entry => (
 *         <Switch
 *           key={entry.day}
 *           checked={entry.isOpen}
 *           onCheckedChange={(v) => updateDay(entry.day, { isOpen: v })}
 *         />
 *       ))}
 *       <Button onClick={saveHours} disabled={!hasChanges}>Save</Button>
 *     </>
 *   );
 * }
 * ```
 */
export function useRestaurantHours(restaurantId: number): RestaurantHoursState {
  const [hours, setHours] = useState<RestaurantHoursEntry[]>([]);
  const [originalHours, setOriginalHours] = useState<RestaurantHoursEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHours = useCallback(async () => {
    if (!restaurantId) {
      setHours([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiHours = await hoursApi.getByRestaurant(restaurantId);
      const frontendHours = toFrontendHours(apiHours);
      setHours(frontendHours);
      setOriginalHours(frontendHours);
    } catch (err) {
      console.error("Failed to fetch operating hours:", err);
      setError(getErrorMessage(err, "Failed to load operating hours."));
      setHours([]);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  const updateDay = useCallback((day: DayOfWeek, patch: Partial<Omit<RestaurantHoursEntry, 'day'>>) => {
    setHours(prev =>
      prev.map(entry => (entry.day === day ? { ...entry, ...patch } : entry))
    );
  }, []);

  const saveHours = useCallback(async () => {
    setIsSaving(true);
    try {
      await hoursApi.updateAll(restaurantId, toBackendHours(hours));
      setOriginalHours(hours);
    } catch (err) {
      console.error("Failed to save operating hours:", err);
      throw new Error(getErrorMessage(err, "Failed to save operating hours."));
    } finally {
      setIsSaving(false);
    }
  }, [restaurantId, hours]);

  // Check if current hours differ from original
  const hasChanges = JSON.stringify(hours) !== JSON.stringify(originalHours);

  return {
    hours,
    isLoading,
    isSaving,
    error,
    refetch: fetchHours,
    updateDay,
    saveHours,
    hasChanges,
  };
}
