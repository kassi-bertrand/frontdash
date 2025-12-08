'use client'

import Link from 'next/link'
import { useEffect, useId, useMemo, useState } from 'react'

import { IconLoader2 } from '@tabler/icons-react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  type Row,
  useReactTable,
} from '@tanstack/react-table'
import { IconChevronLeft, IconChevronRight, IconGripVertical } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type RestaurantOrder } from '@/hooks/use-restaurant-orders'

export type { RestaurantOrder }

const statusTone: Record<RestaurantOrder['status'], string> = {
  NEW: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  PREPARING: 'border-amber-200 bg-amber-100 text-amber-800',
  READY: 'border-sky-200 bg-sky-100 text-sky-700',
  COMPLETED: 'border-neutral-300 bg-neutral-200 text-neutral-700',
}

type OrdersTableProps = {
  orders: RestaurantOrder[]
  variant?: 'preview' | 'full'
  previewCount?: number
  fullPageSize?: number
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

function DraggableRow({ row }: { row: Row<RestaurantOrder> }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      ref={setNodeRef}
      data-dragging={isDragging}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:shadow-lg data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {row.getVisibleCells().map((cell) => {
        if (cell.column.id === 'drag') {
          return (
            <TableCell key={cell.id} className="w-10">
              <Button
                ref={setActivatorNodeRef}
                variant="ghost"
                size="icon"
                className="size-8 text-neutral-400 hover:text-neutral-700"
                {...attributes}
                {...listeners}
              >
                <IconGripVertical className="size-4" />
                <span className="sr-only">Reorder row</span>
              </Button>
            </TableCell>
          )
        }

        return (
          <TableCell
            key={cell.id}
            className={cell.column.id === 'items' ? 'align-top' : undefined}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

export function OrdersTable({
  orders,
  variant = 'preview',
  previewCount = 5,
  fullPageSize = 8,
  isLoading = false,
  error = null,
  onRetry,
}: OrdersTableProps) {
  const isFull = variant === 'full'
  const targetPageSize = isFull
    ? fullPageSize
    : Math.min(previewCount, orders.length || previewCount)

  // All hooks must be called before any early returns
  const [data, setData] = useState<RestaurantOrder[]>(
    isFull ? orders : orders.slice(0, previewCount),
  )
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: targetPageSize })

  useEffect(() => {
    setData(isFull ? orders : orders.slice(0, previewCount))
    setPagination({ pageIndex: 0, pageSize: targetPageSize })
  }, [orders, previewCount, targetPageSize, isFull])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  const columns = useMemo<ColumnDef<RestaurantOrder>[]>(
    () => [
      {
        id: 'drag',
        header: () => null,
        cell: () => null,
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },
      {
        accessorKey: 'id',
        header: 'Order',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-900">{row.original.id}</span>
            <span className="text-xs text-neutral-500">
              Placed {row.original.placedAt}
            </span>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className="text-sm text-neutral-700">{row.original.items}</span>
        ),
      },
      {
        accessorKey: 'customer',
        header: 'Customer',
        cell: ({ row }) => (
          <span className="text-sm text-neutral-700">{row.original.customer}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusTone[row.original.status]}`}
          >
            {row.original.status}
          </Badge>
        ),
        enableSorting: false,
      },
    ],
    [],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const sortableId = useId()

  // Derived values (not hooks)
  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = pageCount > 0 ? pageCount : 1
  const rowModel = table.getRowModel()
  const currentPageIds = rowModel.rows.map((row) => row.original.id)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }

    setData((prev) => {
      const oldIndex = prev.findIndex((order) => order.id === active.id)
      const newIndex = prev.findIndex((order) => order.id === over.id)

      if (oldIndex === -1 || newIndex === -1) {
        return prev
      }

      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <Card
        id="order-queue"
        className="flex min-h-[320px] flex-col border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40"
      >
        <CardContent className="flex flex-1 items-center justify-center">
          <IconLoader2 className="size-6 animate-spin text-emerald-600" />
          <span className="ml-2 text-neutral-600">Loading orders...</span>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card
        id="order-queue"
        className="flex min-h-[320px] flex-col border-red-100 bg-white/90 shadow-lg"
      >
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-red-600">{error}</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      id="order-queue"
      className={`flex flex-col border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40 ${
        isFull ? 'min-h-[70vh]' : 'min-h-[320px]'
      }`}
    >
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-semibold text-neutral-900">
          Live order queue
        </CardTitle>
        <p className="text-sm text-neutral-600">
          Drag rows to reprioritize kitchen prep.{' '}
          {isFull
            ? 'Pagination keeps the view tidy once the queue grows.'
            : 'Open the full queue to manage every ticket.'}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex-1 overflow-hidden rounded-2xl border border-emerald-100 bg-white">
          <DndContext
            id={sortableId}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-emerald-50/90">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rowModel.rows.length ? (
                  <SortableContext
                    items={currentPageIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {rowModel.rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-sm text-neutral-500"
                    >
                      No orders in the queue.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        {isFull ? (
          <div className="flex flex-col gap-4 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-neutral-500 sm:text-sm">
              Changes are local previews until the real-time order API ships.
            </span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-neutral-500 sm:text-sm">
                  Rows per page
                </span>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger
                    className="h-9 w-[90px] bg-white"
                    aria-label="Rows per page"
                  >
                    <SelectValue
                      placeholder={`${table.getState().pagination.pageSize}`}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[4, 6, 8, 10, 12].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <span className="text-xs uppercase tracking-[0.18em] text-neutral-500 sm:text-sm">
                  Page {Math.min(currentPage, totalPages)} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Previous page</span>
                    <IconChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Next page</span>
                    <IconChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-neutral-500 sm:text-sm">
              Showing the five most recent orders. Drag to flag urgent tickets before the
              handoff.
            </span>
            <Button asChild variant="outline" className="sm:w-auto">
              <Link href="/restaurant/dashboard/order-queue">Open full order queue</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
