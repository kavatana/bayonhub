import { Helmet } from "react-helmet-async"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"

export default function PrivacyPage() {
  const { t, language } = useTranslation()
  const pageClass = language === "km" ? "font-khmer leading-8" : ""
  const sections = [
    { id: "data-we-collect", title: t("privacy.dataWeCollect"), body: t("privacy.dataWeCollectBody") },
    { id: "how-we-use-it", title: t("privacy.howWeUseIt"), body: t("privacy.howWeUseItBody") },
    { id: "cookies", title: t("privacy.cookies"), body: t("privacy.cookiesBody") },
    { id: "your-rights", title: t("privacy.yourRights"), body: t("privacy.yourRightsBody") },
    { id: "contact-dpo", title: t("privacy.contactDpo"), body: t("privacy.contactDpoBody") },
  ]

  return (
    <PageTransition className={pageClass}>
      <Helmet>
        <title>{t("privacy.pageTitle")}</title>
      </Helmet>
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block" data-animate>
          <nav className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm" aria-label={t("privacy.toc")}>
            <h2 className="text-sm font-black uppercase tracking-wide text-neutral-500">{t("privacy.toc")}</h2>
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
          <p className="text-sm font-black uppercase tracking-wide text-primary">{t("privacy.draftNotice")}</p>
          <h1 className="mt-3 text-3xl font-black text-neutral-900 sm:text-4xl">{t("privacy.pageTitle")}</h1>
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
