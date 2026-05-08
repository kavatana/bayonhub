import { useState } from "react"
import { Helmet } from "react-helmet-async"
import { useNavigate } from "react-router-dom"
import { Bell, Globe2, LockKeyhole, LogOut } from "lucide-react"
import PageTransition from "../components/ui/PageTransition"
import Button from "../components/ui/Button"
import { useTranslation } from "../hooks/useTranslation"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0"

export default function SettingsPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const setLanguage = useUIStore((state) => state.setLanguage)
  const logout = useAuthStore((state) => state.logout)
  const [notifications, setNotifications] = useState({ messages: true, saved: true })
  const [privacy, setPrivacy] = useState({ profile: false, phone: true })

  async function logoutUser() {
    await logout()
    navigate("/")
  }

  return (
    <PageTransition className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("settings.title")} | BayonHub</title>
      </Helmet>
      <h1 className="text-2xl font-black text-neutral-900">{t("settings.title")}</h1>
      <div className="mt-6 grid gap-5">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-black text-neutral-900">{t("settings.language")}</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button onClick={() => setLanguage("km")} variant={language === "km" ? "primary" : "secondary"}>
              {t("settings.khmer")}
            </Button>
            <Button onClick={() => setLanguage("en")} variant={language === "en" ? "primary" : "secondary"}>
              {t("settings.english")}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-black text-neutral-900">{t("settings.notifications")}</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {Object.entries(notifications).map(([key, enabled]) => (
              <label className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 text-sm font-bold text-neutral-700" key={key}>
                {key === "messages" ? t("settings.messageAlerts") : t("settings.savedAlerts")}
                <input checked={enabled} onChange={() => setNotifications((current) => ({ ...current, [key]: !enabled }))} type="checkbox" />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-black text-neutral-900">{t("settings.privacy")}</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {Object.entries(privacy).map(([key, enabled]) => (
              <label className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 text-sm font-bold text-neutral-700" key={key}>
                {key === "profile" ? t("settings.privateProfile") : t("settings.hidePhone")}
                <input checked={enabled} onChange={() => setPrivacy((current) => ({ ...current, [key]: !enabled }))} type="checkbox" />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-neutral-500">{t("settings.version")}: {APP_VERSION}</p>
          <Button className="mt-4" onClick={logoutUser} variant="secondary">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t("account.logout")}
          </Button>
        </section>
      </div>
    </PageTransition>
  )
}
