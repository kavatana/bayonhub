import { useState } from "react"
import { Phone } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { useAuthStore } from "../../store/useAuthStore"
import { useUIStore } from "../../store/useUIStore"
import { maskPhone } from "../../lib/utils"
import Button from "./Button"

export default function PhoneReveal({ phone, onReveal, className }) {
  const { t } = useTranslation()
  const [revealed, setRevealed] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  
  if (!phone) return null

  function handleReveal() {
    if (!isAuthenticated) {
      toggleAuthModal(true)
      return
    }
    setRevealed(true)
    onReveal?.()
  }

  if (revealed) {
    return (
      <a 
        href={`tel:${phone}`}
        className={`flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-white font-black transition hover:bg-primary-dark ${className}`}
      >
        <Phone className="h-5 w-5" />
        {phone}
      </a>
    )
  }

  return (
    <Button onClick={handleReveal} className={`w-full ${className}`}>
      <Phone className="h-5 w-5" />
      {maskPhone(phone)} · {t("listing.tapToReveal")}
    </Button>
  )
}
