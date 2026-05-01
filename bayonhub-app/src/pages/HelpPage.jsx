import { useRef, useState } from "react"
import { ChevronDown, Mail, Send } from "lucide-react"
import { Helmet } from "react-helmet-async"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"
import { cn } from "../lib/utils"

export default function HelpPage() {
  const { t, language } = useTranslation()
  const [openIndex, setOpenIndex] = useState(0)
  const contentRefs = useRef([])
  const pageClass = language === "km" ? "font-khmer leading-8" : ""
  const faqItems = [
    { question: t("help.faq1Question"), answer: t("help.faq1Answer") },
    { question: t("help.faq2Question"), answer: t("help.faq2Answer") },
    { question: t("help.faq3Question"), answer: t("help.faq3Answer") },
    { question: t("help.faq4Question"), answer: t("help.faq4Answer") },
    { question: t("help.faq5Question"), answer: t("help.faq5Answer") },
    { question: t("help.faq6Question"), answer: t("help.faq6Answer") },
    { question: t("help.faq7Question"), answer: t("help.faq7Answer") },
    { question: t("help.faq8Question"), answer: t("help.faq8Answer") },
  ]

  async function toggleFaq(index) {
    const nextIndex = openIndex === index ? -1 : index
    const currentElement = contentRefs.current[openIndex]
    const nextElement = contentRefs.current[index]
    const { default: gsap } = await import("gsap")

    if (currentElement && openIndex !== index) {
      gsap.to(currentElement, { height: 0, duration: 0.25, ease: "power2.out" })
    }
    if (nextElement) {
      if (openIndex === index) {
        gsap.to(nextElement, { height: 0, duration: 0.25, ease: "power2.out" })
      } else {
        gsap.fromTo(nextElement, { height: 0 }, { height: "auto", duration: 0.3, ease: "power2.out" })
      }
    }
    setOpenIndex(nextIndex)
  }

  return (
    <PageTransition className={`${pageClass} bg-skyline bg-skyline-8`}>
      <Helmet>
        <title>{t("help.pageTitle")}</title>
        <meta name="description" content={t("help.pageDesc")} />
      </Helmet>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <section className="text-center" data-animate>
          <h1 className="text-3xl font-black text-neutral-900 sm:text-4xl">{t("help.pageTitle")}</h1>
          <p className="mt-3 text-neutral-600">{t("help.pageDesc")}</p>
        </section>

        <section className="mt-8" data-animate>
          <h2 className="text-2xl font-black text-neutral-900">{t("help.faqTitle")}</h2>
          <div className="mt-4 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index
              const panelId = `faq-answer-${index}`
              const buttonId = `faq-question-${index}`
              return (
                <article key={item.question}>
                  <button
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left font-black text-neutral-900"
                    onClick={() => toggleFaq(index)}
                    type="button"
                  >
                    <span>{item.question}</span>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-primary transition", isOpen ? "rotate-180" : "")} aria-hidden="true" />
                  </button>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className={cn("overflow-hidden", isOpen ? "h-auto" : "h-0")}
                    ref={(element) => {
                      contentRefs.current[index] = element
                    }}
                  >
                    <p className="px-4 pb-4 text-sm text-neutral-600">{item.answer}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-primary px-5 py-6 text-white" data-animate>
          <h2 className="text-xl font-black">{t("help.contactTitle")}</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-primary" href="mailto:support@bayonhub.com">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t("help.emailSupport")}
            </a>
            <a className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-4 py-3 text-sm font-black text-white" href="https://t.me" rel="noreferrer" target="_blank">
              <Send className="h-4 w-4" aria-hidden="true" />
              {t("help.telegramSupport")}
            </a>
          </div>
        </section>
      </main>
    </PageTransition>
  )
}
