import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { cn } from "../../lib/utils"
import Spinner from "./Spinner"

const variants = {
  primary:
    "group relative overflow-hidden bg-primary text-white shadow-sm hover:shadow-md",
  secondary:
    "border border-neutral-200 bg-white text-neutral-900 hover:border-primary hover:text-primary",
  ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
}

const sizes = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-base",
}

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    className = "",
    children,
    type = "button",
    ...props
  },
  ref,
) {
  const buttonRef = useRef(null)
  useImperativeHandle(ref, () => buttonRef.current)

  useEffect(() => {
    if (variant !== "primary" || !buttonRef.current) return undefined
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined
    const button = buttonRef.current
    let cleanup = () => {}
    let isMounted = true
    import("gsap").then(({ default: gsap }) => {
      if (!isMounted) return
      const setX = gsap.quickSetter(button, "x", "px")
      const setY = gsap.quickSetter(button, "y", "px")
      const onMouseMove = (event) => {
        const rect = button.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 12
        setX(Math.max(-6, Math.min(6, x)))
        setY(Math.max(-6, Math.min(6, y)))
      }
      const onMouseLeave = () => {
        gsap.to(button, { x: 0, y: 0, duration: 0.25, ease: "power2.out" })
      }
      button.addEventListener("mousemove", onMouseMove)
      button.addEventListener("mouseleave", onMouseLeave)
      cleanup = () => {
        button.removeEventListener("mousemove", onMouseMove)
        button.removeEventListener("mouseleave", onMouseLeave)
      }
    })
    return () => {
      isMounted = false
      cleanup()
    }
  }, [variant])

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled || loading}
      aria-disabled={disabled || loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute inset-y-0 -left-1/2 hidden w-1/2 skew-x-[-24deg] bg-white/25 transition-all duration-500 group-hover:left-full group-hover:block" />
      {loading ? <Spinner /> : null}
      <span className="relative z-10">{children}</span>
    </button>
  )
})

export default Button
