import { Languages, Music2, Send, Video, Sun, Moon } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "../../hooks/useTranslation"
import { CATEGORIES } from "../../lib/categories"
import { useUIStore } from "../../store/useUIStore"

const socialLinks = [
  { id: "facebook", href: "https://facebook.com", labelKey: "footer.socialFacebook", Icon: FacebookMark },
  { id: "telegram", href: "https://t.me", labelKey: "footer.socialTelegram", Icon: Send },
  { id: "tiktok", href: "https://tiktok.com", labelKey: "footer.socialTikTok", Icon: Music2 },
  { id: "youtube", href: "https://youtube.com", labelKey: "footer.socialYouTube", Icon: Video },
]

const locationLinks = [
  { key: "footer.locationCarsPhnomPenh", to: "/category/vehicles?province=phnom-penh" },
  { key: "footer.locationJobsPhnomPenh", to: "/category/jobs?province=phnom-penh" },
  { key: "footer.locationHousesSiemReap", to: "/category/house-land?province=siem-reap" },
  { key: "footer.locationPhonesPhnomPenh", to: "/category/phones-tablets?province=phnom-penh" },
  { key: "footer.locationMotorbikesPhnomPenh", to: "/category/vehicles?province=phnom-penh" },
  { key: "footer.locationApartmentsPhnomPenh", to: "/category/house-land?province=phnom-penh" },
  { key: "footer.locationJobsSiemReap", to: "/category/jobs?province=siem-reap" },
  { key: "footer.locationElectronicsPhnomPenh", to: "/category/electronics?province=phnom-penh" },
]

const companyLinks = [
  { key: "footer.about", to: "/about" },
  { key: "footer.help", to: "/help" },
  { key: "footer.terms", to: "/terms" },
  { key: "footer.privacy", to: "/privacy" },
  { key: "footer.pricing", to: "/pricing" },
  { key: "footer.contact", href: "mailto:support@bayonhub.com" },
  { key: "footer.postingRules", to: "/posting-rules" },
]

function FacebookMark({ className }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24">
      <path
        d="M14 8.5h2V5h-2.6C10.5 5 9 6.7 9 9.3V11H7v3.4h2V21h3.6v-6.6H15l.5-3.4h-2.9V9.7c0-.8.4-1.2 1.4-1.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Footer() {
  const { t, language } = useTranslation()
  const setLanguage = useUIStore((state) => state.setLanguage)
  const theme = useUIStore((state) => state.theme)
  const toggleTheme = useUIStore((state) => state.toggleTheme)
  const textClass = language === "km" ? "font-khmer leading-8" : ""
  const headingClass = language === "km" ? "font-khmer leading-8" : ""

  return (
    <footer className={`border-t border-neutral-800 dark:border-neutral-700 bg-neutral-900 text-neutral-300 ${textClass}`}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.15fr_1fr_1fr_1fr]">
        <section aria-labelledby="footer-brand">
          <Link className="inline-flex items-center gap-3 text-white transition hover:text-white" to="/">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary font-black text-white" aria-hidden="true">
              {t("footer.logoMark")}
            </span>
            <span id="footer-brand" className="font-display text-2xl font-black">
              {t("app.name")}
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-neutral-400">{t("footer.tagline")}</p>
          <nav className="mt-5 flex items-center gap-3" aria-label={t("footer.social")}>
            {socialLinks.map(({ id, href, labelKey, Icon }) => (
              <a
                aria-label={t(labelKey)}
                className="grid h-10 w-10 place-items-center rounded-full border border-neutral-700 text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                href={href}
                key={id}
                rel="noreferrer"
                target="_blank"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </section>

        <nav aria-labelledby="footer-categories">
          <h2 id="footer-categories" className={`text-sm font-black uppercase tracking-wide text-white ${headingClass}`}>
            {t("footer.categories")}
          </h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link className="transition hover:text-white" to={`/category/${category.slug}`}>
                  {category.label[language]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-locations">
          <h2 id="footer-locations" className={`text-sm font-black uppercase tracking-wide text-white ${headingClass}`}>
            {t("footer.topLocations")}
          </h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {locationLinks.map((item) => (
              <li key={item.key}>
                <Link className="transition hover:text-white" to={item.to}>
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-company">
          <h2 id="footer-company" className={`text-sm font-black uppercase tracking-wide text-white ${headingClass}`}>
            {t("footer.company")}
          </h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {companyLinks.map((item) => (
              <li key={item.key}>
                {item.href ? (
                  <a className="transition hover:text-white" href={item.href} rel="noopener noreferrer">
                    {t(item.key)}
                  </a>
                ) : (
                  <Link className="transition hover:text-white" to={item.to}>
                    {t(item.key)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-neutral-800">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 text-sm sm:px-6 lg:grid-cols-3 lg:items-center">
          <div className="flex items-center gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-700 p-1">
              <Languages className="ml-2 h-4 w-4 text-neutral-400" aria-hidden="true" />
              {["en", "km"].map((code) => (
                <button
                  className={`rounded-full px-3 py-1 text-xs font-black transition ${language === code ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white"}`}
                  key={code}
                  onClick={() => setLanguage(code)}
                  type="button"
                >
                  {t(`lang.${code}`)}
                </button>
              ))}
            </div>
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? t("ui.lightMode") : t("ui.darkMode")}
              className="p-2 rounded-full border border-neutral-700 hover:bg-neutral-800 transition-colors"
            >
              {theme === 'dark'
                ? <Sun size={16} className="text-yellow-400" />
                : <Moon size={16} className="text-neutral-400" />
              }
            </button>
          </div>
          <p className="text-neutral-400 lg:text-center">{t("footer.copyright")}</p>
          <div className="flex items-center gap-2 text-neutral-400 lg:justify-end">
            <span>{t("footer.secureBy")}</span>
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-black text-white">{t("footer.abaLogo")}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
