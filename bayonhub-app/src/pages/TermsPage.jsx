import { Helmet } from "react-helmet-async"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"

export default function TermsPage() {
  const { t, language } = useTranslation()
  const pageClass = language === "km" ? "font-khmer leading-8" : ""
  const sections = [
    { id: "introduction", title: t("terms.introduction"), body: t("terms.introductionBody") },
    { id: "user-obligations", title: t("terms.userObligations"), body: t("terms.userObligationsBody") },
    { id: "prohibited-content", title: t("terms.prohibitedContent"), body: t("terms.prohibitedContentBody") },
    { id: "liability", title: t("terms.liability"), body: t("terms.liabilityBody") },
    { id: "governing-law", title: t("terms.governingLaw"), body: t("terms.governingLawBody") },
  ]

  return (
    <PageTransition className={`${pageClass} bg-skyline bg-skyline-8`}>
      <Helmet>
        <title>{t("terms.pageTitle")}</title>
        <meta name="robots" content="index,follow" />
      </Helmet>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block" data-animate>
          <nav className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm" aria-label={t("terms.toc")}>
            <h2 className="text-sm font-black uppercase tracking-wide text-neutral-500">{t("terms.toc")}</h2>
            <ul className="mt-3 grid gap-2 text-sm font-semibold text-neutral-600">
              {sections.map((section) => (
                <li key={section.id}>
                  <a className="transition hover:text-primary" href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <article className="min-w-0" data-animate>
          <p className="text-sm font-black uppercase tracking-wide text-primary">{t("terms.draftNotice")}</p>
          <h1 className="mt-3 text-3xl font-black text-neutral-900 sm:text-4xl">{t("terms.pageTitle")}</h1>
          <div className="mt-8 grid gap-5">
            {sections.map((section) => (
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" id={section.id} key={section.id}>
                <h2 className="text-xl font-black text-neutral-900">{section.title}</h2>
                <p className="mt-3 text-neutral-600">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
    </PageTransition>
  )
}
