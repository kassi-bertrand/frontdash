'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'

import { IconClock, IconCopy, IconDeviceFloppy, IconLoader2 } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useAuth, isRestaurantUser } from '@/hooks/use-auth'
import { useRestaurantHours } from '@/hooks/use-restaurant-hours'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

export function OperatingHoursPanel() {
  const { user } = useAuth()
  const restaurantId = isRestaurantUser(user) ? user.restaurantId : 0

  const {
    hours,
    isLoading,
    isSaving,
    error,
    refetch,
    updateDay,
    saveHours,
    hasChanges,
  } = useRestaurantHours(restaurantId)

  const openCount = useMemo(() => hours.filter((entry) => entry.isOpen).length, [hours])

  function copyWeekdayTemplate() {
    const monday = hours.find((entry) => entry.day === 'Monday')
    if (!monday) return
    for (const day of WEEKDAYS) {
      updateDay(day, {
        isOpen: monday.isOpen,
        open: monday.open,
        close: monday.close,
      })
    }
  }

  async function handleSave() {
    try {
      await saveHours()
      toast.success('Operating hours saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  if (isLoading) {
    return (
      <section id="operating-hours" className="scroll-mt-28">
        <Card className="border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40">
          <CardContent className="flex items-center justify-center py-12">
            <IconLoader2 className="size-6 animate-spin text-emerald-600" />
            <span className="ml-2 text-neutral-600">Loading hours...</span>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (error) {
    return (
      <section id="operating-hours" className="scroll-mt-28">
        <Card className="border-red-100 bg-white/90 shadow-lg">
          <CardContent className="py-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={refetch} className="mt-4">
              Try again
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section id="operating-hours" className="scroll-mt-28">
      <Card className="border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold text-neutral-900">
            Operating hours
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Keep availability accurate for dispatch. Update day-by-day or copy weekday
            templates when the schedule is stable.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              <IconClock className="size-4" /> {openCount} days open
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={copyWeekdayTemplate}
            >
              <IconCopy className="size-4" /> Apply Monday to weekdays
            </Button>
            {hasChanges && (
              <Button
                size="sm"
                className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconDeviceFloppy className="size-4" />
                )}
                Save changes
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {hours.map((entry) => (
              <div
                key={entry.day}
                className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm shadow-emerald-50/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{entry.day}</p>
                    <p className="text-xs text-neutral-500">
                      {entry.isOpen
                        ? 'Visible to customers during these hours.'
                        : 'Marked closed for this day.'}
                    </p>
                  </div>
                  <Switch
                    checked={entry.isOpen}
                    onCheckedChange={(value) => updateDay(entry.day, { isOpen: value })}
                  />
                </div>
                {entry.isOpen ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        Opens
                      </span>
                      <Input
                        type="time"
                        value={entry.open}
                        onChange={(event) =>
                          updateDay(entry.day, { open: event.target.value })
                        }
                      />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                        Closes
                      </span>
                      <Input
                        type="time"
                        value={entry.close}
                        onChange={(event) =>
                          updateDay(entry.day, { close: event.target.value })
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
