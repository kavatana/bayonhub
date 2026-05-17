import { Helmet } from "react-helmet-async"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"

export default function PostingRulesPage() {
  const { t, language } = useTranslation()
  const pageClass = language === "km" ? "font-khmer leading-8" : ""
  const rules = [
    t("postingRules.rule1"),
    t("postingRules.rule2"),
    t("postingRules.rule3"),
    t("postingRules.rule4"),
    t("postingRules.rule5"),
    t("postingRules.rule6"),
    t("postingRules.rule7"),
    t("postingRules.rule8"),
  ]

  return (
    <PageTransition className={`${pageClass} bg-skyline bg-skyline-8`}>
      <Helmet>
        <title>{t("postingRules.title")}</title>
        <meta name="robots" content="index,follow" />
      </Helmet>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8" data-animate>
          <p className="text-sm font-black uppercase tracking-wide text-primary">{t("legal.lastUpdated")}</p>
          <h1 className="mt-3 text-3xl font-black text-neutral-900 sm:text-4xl">{t("postingRules.heading")}</h1>
          <ul className="mt-8 grid gap-3 text-neutral-700">
            {rules.map((rule) => (
              <li className="flex gap-3 rounded-xl bg-neutral-50 p-4 text-sm font-semibold sm:text-base" key={rule}>
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </article>
      </main>
    </PageTransition>
  )
}
