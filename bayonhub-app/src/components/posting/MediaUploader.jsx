import { useCallback, useRef, useState } from "react"
import imageCompression from "browser-image-compression"
import { useDropzone } from "react-dropzone"
import { Camera, GripHorizontal, ImagePlus, Star, X } from "lucide-react"
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
  const dragIndexRef = useRef(null)
  const cameraInputRef = useRef(null)

  const addFiles = useCallback(
    async (files) => {
      const nextErrors = []
      const imageFiles = files.filter((file) => {
        if (!file.type.startsWith("image/")) {
          nextErrors.push(t("post.mediaWrongType"))
          return false
        }
        if (file.size > 5 * 1024 * 1024) {
          nextErrors.push(t("post.mediaTooLarge"))
          return false
        }
        return true
      })
      if (value.length + imageFiles.length > 8) {
        nextErrors.push(t("post.mediaTooMany"))
      }
      const accepted = imageFiles.slice(0, Math.max(0, 8 - value.length))
      const compressed = await Promise.all(
        accepted.map(async (file, index) => {
          const output = await imageCompression(file, {
            maxWidthOrHeight: 1200,
            maxSizeMB: 1,
            useWebWorker: true,
          })
          const preview = await readFileAsDataUrl(output)
          return {
            id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${file.name}-${index}`,
            preview,
            url: preview,
            file: output,
            name: file.name,
            order: value.length + index,
            isPrimary: value.length === 0 && index === 0,
            primary: value.length === 0,
          }
        }),
      )
      const next = [...value, ...compressed]
      const primaryIndex = next.findIndex((image) => image.isPrimary || image.primary)
      onChange?.(
        next.map((item, index) => ({
          ...item,
          order: index,
          isPrimary: primaryIndex === -1 ? index === 0 : index === primaryIndex,
          primary: primaryIndex === -1 ? index === 0 : index === primaryIndex,
        })),
      )
      setErrors([...new Set(nextErrors)])
    },
    [onChange, t, value],
  )

  const onDrop = useCallback((acceptedFiles) => addFiles(acceptedFiles), [addFiles])
  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    disabled: loading,
    maxFiles: 8,
    onDrop,
  })

  function removeImage(id) {
    const next = value.filter((item) => item.id !== id)
    onChange?.(
      next.map((item, index) => ({
        ...item,
        order: index,
        isPrimary: index === 0 ? true : item.isPrimary,
        primary: index === 0 ? true : item.primary,
      })),
    )
  }

  function makePrimary(id) {
    onChange?.(value.map((item) => ({ ...item, isPrimary: item.id === id, primary: item.id === id })))
  }

  function reorder(dropIndex) {
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) return
    const next = [...value]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(dropIndex, 0, moved)
    onChange?.(next.map((item, index) => ({ ...item, order: index })))
    dragIndexRef.current = null
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps({
          className: cn(
            "grid min-h-40 cursor-pointer place-items-center rounded-2xl border border-dashed p-6 text-center transition",
            isDragActive ? "border-primary bg-primary/5" : "border-neutral-300 bg-white hover:border-primary",
          ),
        })}
      >
        <input {...getInputProps()} />
        <div>
          <ImagePlus className="mx-auto h-9 w-9 text-primary" aria-hidden="true" />
          <p className="mt-3 text-sm font-black text-neutral-900">{t("post.mediaDrop")}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-500">{t("post.mediaBrowse")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700 md:hidden"
          onClick={() => cameraInputRef.current?.click()}
          type="button"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {t("post.mediaCamera")}
        </button>
        {!import.meta.env.PROD && (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-sm font-bold text-primary transition hover:bg-primary/10"
            onClick={() => {
              const mockFiles = [
                new File([""], "mock-image-1.jpg", { type: "image/jpeg" }),
              ]
              addFiles(mockFiles)
            }}
            type="button"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
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
        <p className="text-sm font-semibold text-red-600" key={message}>
          {message}
        </p>
      ))}

      {value.length ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {value.map((image, index) => (
            <div
              draggable
              className="group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
              key={image.id}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => {
                dragIndexRef.current = index
              }}
              onDrop={() => reorder(index)}
            >
              <img alt={t("post.images")} className="h-full w-full object-cover" src={image.preview || image.url} />
              <button
                aria-label={t("post.removeImage")}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white text-neutral-700 shadow"
                onClick={() => removeImage(image.id)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                aria-label={image.isPrimary || image.primary ? t("post.primaryImage") : t("post.makePrimary")}
                className={cn(
                  "absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black shadow",
                  image.isPrimary || image.primary ? "bg-amber-400 text-neutral-950" : "bg-white text-neutral-700",
                )}
                onClick={() => makePrimary(image.id)}
                type="button"
              >
                <Star className={cn("h-3.5 w-3.5", (image.isPrimary || image.primary) && "fill-neutral-950")} aria-hidden="true" />
                {image.isPrimary || image.primary ? t("post.primaryImage") : t("post.makePrimary")}
              </button>
              <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-neutral-500">
                <GripHorizontal className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{t("post.dragImage")}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
