'use client'

import { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconPlus, IconTrash, IconUpload } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { restaurantMenuItems, type RestaurantMenuItem } from '../mock-data'

const availabilityOptions = ['AVAILABLE', 'UNAVAILABLE'] as const

type AvailabilityOption = (typeof availabilityOptions)[number]

const newItemSchema = z.object({
  name: z.string().min(2, 'Enter at least two characters'),
  price: z
    .string()
    .min(1, 'Required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Use numbers with up to 2 decimals'),
  availability: z.enum(availabilityOptions),
  imageUrl: z
    .string()
    .trim()
    .transform((value) => (value.length ? value : undefined))
    .optional(),
  description: z
    .string()
    .trim()
    .max(160, 'Keep descriptions under 160 characters')
    .optional(),
})

type NewItemForm = z.infer<typeof newItemSchema>

type EditableItem = RestaurantMenuItem & {
  description?: string
}

const initialEditableItems: EditableItem[] = restaurantMenuItems.map((item) => ({
  ...item,
}))

export function MenuManagementPanel() {
  const [items, setItems] = useState<EditableItem[]>(initialEditableItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, EditableItem>>({})

  const form = useForm<NewItemForm>({
    resolver: zodResolver(newItemSchema),
    defaultValues: {
      name: '',
      price: '',
      availability: 'AVAILABLE',
      imageUrl: '',
      description: '',
    },
  })

  const availabilityCounts = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.availability] += 1
          return acc
        },
        { AVAILABLE: 0, UNAVAILABLE: 0 } as Record<AvailabilityOption, number>,
      ),
    [items],
  )

  function handleSubmit(newItem: NewItemForm) {
    const nextItem: EditableItem = {
      id: `menu-${Math.random().toString(36).slice(-6)}`,
      name: newItem.name,
      price: Number(newItem.price),
      availability: newItem.availability,
      imageUrl: newItem.imageUrl,
      description: newItem.description,
    }

    setItems((prev) => [nextItem, ...prev])
    form.reset({
      name: '',
      price: '',
      availability: 'AVAILABLE',
      imageUrl: '',
      description: '',
    })
  }

  function toggleAvailability(id: string, value: boolean) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              availability: value ? 'AVAILABLE' : 'UNAVAILABLE',
            }
          : item,
      ),
    )
  }

  function startEditing(item: EditableItem) {
    setEditingId(item.id)
    setDrafts((prev) => ({ ...prev, [item.id]: { ...item } }))
  }

  function cancelEditing(id: string) {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setEditingId((current) => (current === id ? null : current))
  }

  function updateDraft(id: string, key: keyof EditableItem, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: key === 'price' ? Number(value) : value,
      } as EditableItem,
    }))
  }

  function saveItem(id: string) {
    const draft = drafts[id]
    if (!draft || !draft.name.trim() || Number.isNaN(draft.price)) {
      return
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...draft } : item)))
    cancelEditing(id)
  }

  function removeItem(id: string) {
    if (items.length <= 1) {
      return
    }
    if (confirm('Remove this item from the menu?')) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  return (
    <section id="menu-management" className="scroll-mt-28">
      <Card className="border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold text-neutral-900">
            Menu management
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Add dishes, update pricing, and control availability. Item details stay
            aligned with FrontDash listing requirements.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              {availabilityCounts.AVAILABLE} available
            </Badge>
            <Badge
              variant="outline"
              className="border-neutral-300 bg-neutral-100 text-neutral-700"
            >
              {availabilityCounts.UNAVAILABLE} unavailable
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 lg:grid-cols-[1.2fr_0.9fr_0.9fr_auto]"
              noValidate
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="lg:col-span-1">
                    <FormLabel>Item name</FormLabel>
                    <FormControl>
                      <Input placeholder="Grilled peach + burrata" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="12.50"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter numbers only (FrontDash adds currency).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availabilityOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-3 lg:col-span-4 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-1">
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://…" {...field} />
                      </FormControl>
                      <FormDescription>
                        Uploads arrive later—use a hosted link for now.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Short description (optional)</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end justify-end lg:col-span-3">
                  <Button type="submit" className="gap-2">
                    <IconPlus className="size-4" />
                    Add dish
                  </Button>
                </div>
              </div>
            </form>
          </Form>

          <div className="space-y-3">
            {items.map((item) => {
              const isEditing = editingId === item.id
              const draft = drafts[item.id] ?? item

              return (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm shadow-emerald-50/40 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-start"
                >
                  <div className="space-y-2">
                    {isEditing ? (
                      <Input
                        value={draft.name}
                        onChange={(event) =>
                          updateDraft(item.id, 'name', event.target.value)
                        }
                        placeholder="Dish name"
                      />
                    ) : (
                      <p className="text-base font-semibold text-neutral-900">
                        {item.name}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      {item.imageUrl ? (
                        <span className="inline-flex items-center gap-1 text-neutral-500">
                          <IconUpload className="size-4" />
                          Image attached
                        </span>
                      ) : (
                        <span className="text-neutral-400">No image yet</span>
                      )}
                      {item.description && !isEditing ? (
                        <span>• {item.description}</span>
                      ) : null}
                    </div>
                    {isEditing ? (
                      <Textarea
                        rows={2}
                        value={draft.description ?? ''}
                        onChange={(event) =>
                          updateDraft(item.id, 'description', event.target.value)
                        }
                        placeholder="Add a short description"
                        className="mt-2"
                      />
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Price
                    </span>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={draft.price ?? 0}
                        onChange={(event) =>
                          updateDraft(item.id, 'price', event.target.value)
                        }
                      />
                    ) : (
                      <p className="font-semibold text-neutral-900">
                        ${item.price.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Availability
                    </span>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={item.availability === 'AVAILABLE'}
                        onCheckedChange={(value) => toggleAvailability(item.id, value)}
                      />
                      <Badge
                        variant="outline"
                        className={
                          item.availability === 'AVAILABLE'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-neutral-300 bg-neutral-100 text-neutral-600'
                        }
                      >
                        {item.availability}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:items-end">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveItem(item.id)}>
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelEditing(item.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length <= 1}
                        >
                          <IconTrash className="size-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
