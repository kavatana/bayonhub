import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { cn } from "../../lib/utils"

export default function PageTransition({ children, className = "", loading = false, error = null, empty = false }) {
  const rootRef = useRef(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      gsap.fromTo(root, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" })
      const items = root.querySelectorAll("[data-animate]")
      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.06, delay: 0.08 },
        )
      }
    },
    { scope: rootRef, dependencies: [loading, error, empty] },
  )

  return (
    <div ref={rootRef} className={cn("page-enter", className)}>
      {children}
    </div>
  )
}
