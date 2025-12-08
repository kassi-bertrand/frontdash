'use client'

import { useRef, useState } from 'react'
import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  /** Current image URL (for existing images) */
  currentUrl?: string
  /** Callback when a file is selected */
  onFileSelect: (file: File | null) => void
  /** Currently selected file (for preview) */
  selectedFile?: File | null
  /** Whether the input is disabled */
  disabled?: boolean
  /** Additional class name */
  className?: string
}

/**
 * Image upload component with preview.
 *
 * Shows:
 * - Current image if URL provided
 * - Preview of selected file if one is chosen
 * - File picker button
 *
 * @example
 * ```tsx
 * const [file, setFile] = useState<File | null>(null);
 *
 * <ImageUpload
 *   currentUrl={item.imageUrl}
 *   selectedFile={file}
 *   onFileSelect={setFile}
 * />
 * ```
 */
export function ImageUpload({
  currentUrl,
  onFileSelect,
  selectedFile,
  disabled = false,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Create preview URL when file is selected
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null

    // Revoke old preview URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    }

    onFileSelect(file)
  }

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onFileSelect(null)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  // Determine which image to show
  const displayUrl = previewUrl || currentUrl
  const hasImage = !!displayUrl
  const hasNewFile = !!selectedFile

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {/* Image preview */}
      {hasImage && (
        <div className="relative inline-block">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200">
            <Image
              src={displayUrl}
              alt="Menu item image"
              fill
              className="object-cover"
              unoptimized={displayUrl.startsWith('blob:')}
            />
          </div>
          {/* Remove button - only show for newly selected files */}
          {hasNewFile && !disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
            >
              <IconX className="size-3" />
            </button>
          )}
        </div>
      )}

      {/* Upload button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled}
          className="gap-2"
        >
          {hasImage ? (
            <>
              <IconPhoto className="size-4" />
              Change image
            </>
          ) : (
            <>
              <IconUpload className="size-4" />
              Upload image
            </>
          )}
        </Button>
        {hasNewFile && (
          <span className="text-xs text-emerald-600">
            New image selected
          </span>
        )}
      </div>
    </div>
  )
}
