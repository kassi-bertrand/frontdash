'use client'

import { useMemo, useState } from 'react'

import { IconClock, IconCopy } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import { restaurantHoursTemplate, type RestaurantHours } from '../mock-data'

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export function OperatingHoursPanel() {
  const [hours, setHours] = useState<RestaurantHours[]>(restaurantHoursTemplate)

  const openCount = useMemo(() => hours.filter((entry) => entry.isOpen).length, [hours])

  function updateHours(day: string, patch: Partial<Omit<RestaurantHours, 'day'>>) {
    setHours((prev) =>
      prev.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry)),
    )
  }

  function copyWeekdayTemplate() {
    const monday = hours.find((entry) => entry.day === 'Monday')
    if (!monday) return
    setHours((prev) =>
      prev.map((entry) =>
        weekdays.includes(entry.day)
          ? {
              ...entry,
              isOpen: monday.isOpen,
              open: monday.open,
              close: monday.close,
            }
          : entry,
      ),
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
                    onCheckedChange={(value) => updateHours(entry.day, { isOpen: value })}
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
                          updateHours(entry.day, { open: event.target.value })
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
                          updateHours(entry.day, { close: event.target.value })
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
