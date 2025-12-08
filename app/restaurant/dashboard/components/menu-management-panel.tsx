'use client'

import { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconLoader2, IconPlus, IconRefresh, IconTrash, IconUpload } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { ImageUpload } from '@/components/ui/image-upload'
import { useAuth, isRestaurantUser } from '@/hooks/use-auth'
import { useRestaurantMenu, type RestaurantMenuItem } from '@/hooks/use-restaurant-menu'
import { uploadApi } from '@/lib/api'

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

type EditableItem = RestaurantMenuItem

export function MenuManagementPanel() {
  // Get restaurant ID from auth
  const { user } = useAuth()
  const restaurantId = isRestaurantUser(user) ? user.restaurantId : 0

  // Fetch menu items from backend
  const { items, isLoading, isSaving, error, refetch, createItem, updateItem, deleteItem } =
    useRestaurantMenu(restaurantId)

  // Local UI state for editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, EditableItem>>({})

  // Image file state for new item and editing
  const [newItemImage, setNewItemImage] = useState<File | null>(null)
  const [editImageFiles, setEditImageFiles] = useState<Record<string, File | null>>({})

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

  async function handleSubmit(newItem: NewItemForm) {
    try {
      // 1. Create the menu item first
      const createdItem = await createItem({
        name: newItem.name,
        price: Number(newItem.price),
        availability: newItem.availability,
        description: newItem.description,
      })

      // 2. If there's an image file, upload it
      if (newItemImage) {
        try {
          const imageUrl = await uploadApi.uploadImage('menu-item', Number(createdItem.id), newItemImage)
          await updateItem(createdItem.id, { imageUrl })
          toast.success('Menu item added with image')
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr)
          toast.success('Menu item added (image upload failed)')
        }
      } else {
        toast.success('Menu item added successfully')
      }

      // 3. Reset form and image state
      form.reset({
        name: '',
        price: '',
        availability: 'AVAILABLE',
        imageUrl: '',
        description: '',
      })
      setNewItemImage(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add menu item')
    }
  }

  async function toggleAvailability(id: string, value: boolean) {
    try {
      await updateItem(id, {
        availability: value ? 'AVAILABLE' : 'UNAVAILABLE',
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update availability')
    }
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
    setEditImageFiles((prev) => {
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

  async function saveItem(id: string) {
    const draft = drafts[id]
    if (!draft || !draft.name.trim() || Number.isNaN(draft.price)) {
      return
    }
    try {
      // Check if there's a new image to upload
      const imageFile = editImageFiles[id]
      let imageUrl = draft.imageUrl

      if (imageFile) {
        try {
          imageUrl = await uploadApi.uploadImage('menu-item', Number(id), imageFile)
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr)
          toast.error('Image upload failed, saving other changes')
        }
      }

      await updateItem(id, {
        name: draft.name,
        price: draft.price,
        description: draft.description,
        imageUrl,
      })
      toast.success('Menu item updated')

      // Clear edit image state
      setEditImageFiles((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      cancelEditing(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update menu item')
    }
  }

  async function removeItem(id: string) {
    if (confirm('Remove this item from the menu?')) {
      try {
        await deleteItem(id)
        toast.success('Menu item removed')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to remove menu item')
      }
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
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="size-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-neutral-600">Loading menu items...</span>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50 py-12">
              <IconAlertCircle className="size-10 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <IconRefresh className="size-4" />
                Try again
              </Button>
            </div>
          )}

          {/* Content - only show when not loading and no error */}
          {!isLoading && !error && (<>
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
                <div className="lg:col-span-1">
                  <FormLabel>Image (optional)</FormLabel>
                  <div className="mt-2">
                    <ImageUpload
                      selectedFile={newItemImage}
                      onFileSelect={setNewItemImage}
                      disabled={isSaving}
                    />
                  </div>
                </div>
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
                  <Button type="submit" className="gap-2" disabled={isSaving}>
                    {isSaving ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <IconPlus className="size-4" />
                    )}
                    {isSaving ? 'Adding...' : 'Add dish'}
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
                    {isEditing ? (
                      <div className="mt-2">
                        <ImageUpload
                          currentUrl={item.imageUrl}
                          selectedFile={editImageFiles[item.id] ?? null}
                          onFileSelect={(file) =>
                            setEditImageFiles((prev) => ({ ...prev, [item.id]: file }))
                          }
                          disabled={isSaving}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                        {item.imageUrl ? (
                          <span className="inline-flex items-center gap-1 text-neutral-500">
                            <IconUpload className="size-4" />
                            Image attached
                          </span>
                        ) : (
                          <span className="text-neutral-400">No image yet</span>
                        )}
                        {item.description ? (
                          <span>• {item.description}</span>
                        ) : null}
                      </div>
                    )}
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
                        <Button size="sm" onClick={() => saveItem(item.id)} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelEditing(item.id)}
                          disabled={isSaving}
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
                          disabled={isSaving}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id)}
                          disabled={isSaving}
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

            {/* Empty state */}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <p className="text-neutral-600">No menu items yet.</p>
                <p className="text-sm text-neutral-400">Add your first dish using the form above.</p>
              </div>
            )}
          </div>
          </>)}
        </CardContent>
      </Card>
    </section>
  )
}
