import { useEffect, useRef, useState } from "react"
import ThreeErrorBoundary from "./ThreeErrorBoundary"

function EmptyFallback() {
  return (
    <svg aria-hidden="true" className="mx-auto h-32 w-32 animate-pulse text-primary/30" viewBox="0 0 160 160">
      <path
        className="fill-current"
        d="M123 42c20 20 16 59-6 80-22 20-62 22-83 2-21-21-23-64 0-86s69-16 89 4Z"
      />
    </svg>
  )
}

export default function EmptyStateOrb() {
  const [mobile, setMobile] = useState(false)
  const [failed, setFailed] = useState(false)
  const [shouldRender3D, setShouldRender3D] = useState(false)
  const canvasHostRef = useRef(null)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)")
    const onChange = () => setMobile(media.matches)
    const frame = window.requestAnimationFrame(onChange)
    media.addEventListener("change", onChange)
    return () => {
      window.cancelAnimationFrame(frame)
      media.removeEventListener("change", onChange)
    }
  }, [])

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const isSlowConnection =
      connection &&
      (connection.effectiveType === "2g" || connection.effectiveType === "slow-2g" || connection.saveData === true)
    const isMobile = window.innerWidth < 768

    if (!isSlowConnection && !isMobile) {
      const timer = window.setTimeout(() => setShouldRender3D(true), 3000)
      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [])

  useEffect(() => {
    if (!shouldRender3D || mobile || failed) return undefined

    let cleanupScene = () => {}
    let disposed = false
    const host = canvasHostRef.current

    async function mountScene() {
      if (disposed || !host) return
      const { mountEmptyOrbScene } = await import("./orbScenes")
      if (disposed) return
      cleanupScene = mountEmptyOrbScene(host)
    }

    mountScene().catch(() => setFailed(true))

    return () => {
      disposed = true
      cleanupScene()
    }
  }, [failed, mobile, shouldRender3D])

  if (!shouldRender3D || mobile || failed) return <EmptyFallback />

  return (
    <ThreeErrorBoundary fallback={<EmptyFallback />}>
      <div ref={canvasHostRef} className="mx-auto h-[200px] w-[200px] text-primary" />
    </ThreeErrorBoundary>
  )
}
