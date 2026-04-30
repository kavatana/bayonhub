import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { modalEnter } from "../../lib/animations"
import { cn } from "../../lib/utils"
import Overlay from "./Overlay"

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
}

export default function Modal({ open, onClose, title, children, size = "md" }) {
  const panelRef = useRef(null)
  const closeButtonRef = useRef(null)
  const { t } = useTranslation()
  // Remember the element that triggered the modal so we can return focus on close
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    triggerRef.current = document.activeElement
    modalEnter(panelRef)
    // Delay focus to let animation settle
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 60)
    return () => {
      window.clearTimeout(focusTimer)
      // Restore focus to the triggering element
      triggerRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <Overlay
      ref={panelRef}
      ariaLabel={title}
      backdropClassName="grid place-items-center p-4"
      className={cn(
        "max-h-[90vh] w-full overflow-auto rounded-2xl bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 dark:text-white",
        sizes[size],
      )}
      onClose={onClose}
      open={open}
    >
      <header className="mb-4 flex items-center justify-between gap-4">
        <h2 id="modal-title" className="text-xl font-bold text-neutral-900 dark:text-white">{title}</h2>
        <button
          ref={closeButtonRef}
          aria-label={t("ui.close")}
          className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-primary hover:text-primary dark:border-neutral-700"
          onClick={onClose}
          type="button"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      {children}
    </Overlay>
  )
}
