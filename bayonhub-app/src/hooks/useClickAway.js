import { useEffect, useRef } from "react"

export function useClickAway(onClickAway) {
  const containerRef = useRef(null)
  const callbackRef = useRef(onClickAway)

  useEffect(() => {
    callbackRef.current = onClickAway
  }, [onClickAway])

  useEffect(() => {
    if (typeof document === "undefined") return undefined

    function handleStart(event) {
      const container = containerRef.current
      if (!container || container.contains(event.target)) return
      callbackRef.current?.(event)
    }

    document.addEventListener("mousedown", handleStart)
    document.addEventListener("touchstart", handleStart, { passive: true })

    return () => {
      document.removeEventListener("mousedown", handleStart)
      document.removeEventListener("touchstart", handleStart)
    }
  }, [])

  return containerRef
}

export default useClickAway
