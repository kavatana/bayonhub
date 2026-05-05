import { useCallback, useRef, useState } from "react"
import imageCompression from "browser-image-compression"
import { useDropzone } from "react-dropzone"
import { Camera, GripHorizontal, ImagePlus, Star, X, Loader2 } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("error", reject)
    reader.addEventListener("load", () => resolve(reader.result))
    reader.readAsDataURL(file)
  })
}

export default function MediaUploader({ value = [], onChange, loading = false, error = null }) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const dragIndexRef = useRef(null)
  const cameraInputRef = useRef(null)

  const addFiles = useCallback(
    async (files) => {
      if (!files.length) return
      
      setIsProcessing(true)
      const nextErrors = []
      
      // Filter valid files (increased limit to 20MB)
      const validFiles = files.filter((file) => {
        const isImage = file.type.startsWith("image/") || 
                        file.name.toLowerCase().endsWith(".heic") || 
                        file.name.toLowerCase().endsWith(".heif")
        
        if (!isImage) {
          nextErrors.push(t("post.mediaWrongType"))
          return false
        }
        if (file.size > 20 * 1024 * 1024) {
          nextErrors.push(t("post.mediaTooLarge"))
          return false
        }
        return true
      })

      if (value.length + validFiles.length > 8) {
        nextErrors.push(t("post.mediaTooMany"))
      }

      const accepted = validFiles.slice(0, Math.max(0, 8 - value.length))
      const newImages = []

      // Process one by one for better UX
      for (let i = 0; i < accepted.length; i++) {
        const file = accepted[i]
        try {
          // HEIC support check and conversion
          const options = {
            maxWidthOrHeight: 1600, // Increased slightly for better quality on modern phones
            maxSizeMB: 0.8, // Target under 1MB
            useWebWorker: true,
            initialQuality: 0.8,
            fileType: "image/jpeg", // Always convert to JPEG for backend compatibility
          }

          const output = await imageCompression(file, options)
          const preview = await readFileAsDataUrl(output)
          
          const newImage = {
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${file.name}-${i}`,
            preview,
            url: preview,
            file: output,
            name: file.name,
            order: value.length + i,
            isPrimary: value.length === 0 && i === 0,
          }
          
          newImages.push(newImage)
          
          // Update state incrementally so user sees progress
          const currentTotal = [...value, ...newImages]
          onChange?.(currentTotal.map((img, idx) => ({ ...img, order: idx })))
        } catch (err) {
          console.error("Compression error:", err)
          nextErrors.push(`${file.name}: ${t("ui.error")}`)
        }
      }

      setErrors([...new Set(nextErrors)])
      setIsProcessing(false)
    },
    [onChange, t, value],
  )

  const onDrop = useCallback((acceptedFiles) => addFiles(acceptedFiles), [addFiles])
  
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: { 
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic", ".heif"] 
    },
    disabled: loading || isProcessing,
    maxFiles: 8,
    onDrop,
  })

  function removeImage(id) {
    const next = value.filter((item) => item.id !== id)
    onChange?.(
      next.map((item, index) => ({
        ...item,
        order: index,
        isPrimary: index === 0,
      })),
    )
  }

  function makePrimary(id) {
    onChange?.(value.map((item) => ({ ...item, isPrimary: item.id === id })))
  }

  function reorder(dropIndex) {
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) return
    const next = [...value]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(dropIndex, 0, moved)
    onChange?.(next.map((item, index) => ({ ...item, order: index, isPrimary: index === 0 })))
    dragIndexRef.current = null
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps({
          className: cn(
            "grid min-h-40 cursor-pointer place-items-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300",
            isDragActive ? "border-primary bg-primary/5 scale-[0.99]" : "border-neutral-200 bg-white hover:border-primary hover:bg-neutral-50/50",
            (loading || isProcessing) && "opacity-50 cursor-not-allowed"
          ),
        })}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="relative mx-auto w-16 h-16 bg-primary/10 rounded-2xl grid place-items-center">
            {isProcessing ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <ImagePlus className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <p className="text-base font-black text-neutral-900">
              {isProcessing ? t("ui.loading") : t("post.mediaDrop")}
            </p>
            <p className="text-sm font-bold text-neutral-500">{t("post.mediaBrowse")}</p>
          </div>
          <div className="flex justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">
            <span>Max 20MB</span>
            <span>JPG, PNG, HEIC</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          disabled={loading || isProcessing}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 text-sm font-black text-neutral-700 transition-all hover:bg-neutral-50 disabled:opacity-50 md:hidden"
          onClick={() => cameraInputRef.current?.click()}
          type="button"
        >
          <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
          {t("post.mediaCamera")}
        </button>
        
        {!import.meta.env.PROD && (
          <button
            disabled={loading || isProcessing}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-6 text-sm font-black text-primary transition-all hover:bg-primary/10 disabled:opacity-50"
            onClick={() => {
              const mockFiles = [
                new File([""], "large-test.jpg", { type: "image/jpeg" }),
              ]
              addFiles(mockFiles)
            }}
            type="button"
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            {t("ui.simulateMedia")}
          </button>
        )}
      </div>

      <input
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          addFiles(Array.from(event.target.files || []))
          event.target.value = ""
        }}
        type="file"
      />

      {[error, ...errors].filter(Boolean).map((message) => (
        <div key={message} className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100">
          <X className="h-4 w-4" />
          {message}
        </div>
      ))}

      {value.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {value.map((image, index) => (
            <div
              draggable
              className="group relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm transition-all hover:shadow-md"
              key={image.id}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => {
                dragIndexRef.current = index
              }}
              onDrop={() => reorder(index)}
            >
              <img 
                alt={t("post.images")} 
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src={image.preview || image.url} 
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

              <button
                aria-label={t("post.removeImage")}
                className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-xl bg-white/90 text-red-500 shadow-lg backdrop-blur-sm transition-transform hover:scale-110"
                onClick={() => removeImage(image.id)}
                type="button"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                aria-label={image.isPrimary ? t("post.primaryImage") : t("post.makePrimary")}
                className={cn(
                  "absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-sm transition-all",
                  image.isPrimary ? "bg-amber-400 text-neutral-900" : "bg-white/90 text-neutral-600 hover:bg-white"
                )}
                onClick={() => makePrimary(image.id)}
                type="button"
              >
                <Star className={cn("h-3.5 w-3.5", image.isPrimary && "fill-neutral-900")} aria-hidden="true" />
                {image.isPrimary ? t("post.primaryImage") : t("post.makePrimary")}
              </button>

              <div className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-xl bg-white/50 text-white backdrop-blur-sm cursor-grab active:cursor-grabbing">
                <GripHorizontal className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">{t("post.dragImage")}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
