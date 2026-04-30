import { forwardRef, useEffect } from "react"
import FocusTrap from "focus-trap-react"
import { cn } from "../../lib/utils"

let bodyLockCount = 0
let previousBodyOverflow = ""

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
  }
  bodyLockCount += 1
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1)
  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = ""
  }
}

const Overlay = forwardRef(function Overlay({
  open,
  onClose,
  children,
  className,
  backdropClassName,
  disableEscapeKey = false,
  disableBackdropClick = false,
  role = "dialog",
  ariaLabel,
}, ref) {
  useEffect(() => {
    if (!open) return undefined
    lockBodyScroll()

    function handleKeyDown(event) {
      if (disableEscapeKey || event.key !== "Escape") return
      onClose?.()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      unlockBodyScroll()
    }
  }, [disableEscapeKey, onClose, open])

  if (!open) return null

  function handleBackdropClick(event) {
    if (disableBackdropClick || event.target !== event.currentTarget) return
    onClose?.()
  }

  return (
    <div
      className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm", backdropClassName)}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <FocusTrap
        active={open}
        focusTrapOptions={{
          allowOutsideClick: true,
          clickOutsideDeactivates: false,
          escapeDeactivates: false,
          fallbackFocus: () => document.body,
        }}
      >
        <div ref={ref} aria-label={ariaLabel} aria-modal="true" className={className} role={role}>
          {children}
        </div>
      </FocusTrap>
    </div>
  )
})

export default Overlay
