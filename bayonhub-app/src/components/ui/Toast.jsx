import { useEffect, useState } from "react"
import { Toaster } from "react-hot-toast"

export default function Toast() {
  const [position, setPosition] = useState("top-center")

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)")
    const updatePosition = () => setPosition(media.matches ? "bottom-right" : "top-center")
    updatePosition()
    media.addEventListener("change", updatePosition)
    return () => media.removeEventListener("change", updatePosition)
  }, [])

  return (
    <Toaster
      position={position}
      toastOptions={{
        className:
          "rounded-xl border border-neutral-100 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-xl",
        success: {
          iconTheme: {
            primary: "#E53935",
            secondary: "#FFFFFF",
          },
          className:
            "rounded-xl border border-primary/20 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-xl",
        },
        error: {
          iconTheme: {
            primary: "#DC2626",
            secondary: "#FFFFFF",
          },
          className:
            "rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-xl",
        },
      }}
    />
  )
}
