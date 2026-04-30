import { useEffect, useRef, useState } from "react"
import ThreeErrorBoundary from "./ThreeErrorBoundary"

function OrbFallback() {
  return (
    <div className="relative mx-auto h-48 w-48 rounded-full bg-primary/70 shadow-2xl shadow-primary/20 ring-8 ring-primary-light/30 animate-pulse">
      <span className="absolute left-10 top-8 h-14 w-14 rounded-full bg-white/80 blur-sm" />
      <span className="absolute bottom-10 right-8 h-20 w-20 rounded-full bg-neutral-900/10 blur-xl" />
    </div>
  )
}

export default function HeroOrb() {
  const [mobile, setMobile] = useState(false)
  const [failed, setFailed] = useState(false)
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
    if (mobile || failed) return undefined

    let cleanupScene = () => {}
    let disposed = false
    const host = canvasHostRef.current

    async function mountScene() {
      if (disposed || !host) return
      const { mountHeroOrbScene } = await import("./orbScenes")
      if (disposed) return
      cleanupScene = mountHeroOrbScene(host)
    }

    mountScene().catch(() => setFailed(true))

    return () => {
      disposed = true
      cleanupScene()
    }
  }, [failed, mobile])

  if (mobile || failed) return <OrbFallback />

  return (
    <ThreeErrorBoundary fallback={<OrbFallback />}>
      <div ref={canvasHostRef} className="mx-auto min-h-[420px] w-full max-w-[520px] text-primary" />
    </ThreeErrorBoundary>
  )
}

export { OrbFallback }
