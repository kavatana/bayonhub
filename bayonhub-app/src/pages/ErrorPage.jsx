import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import Button from "../components/ui/Button"
import { useTranslation } from "../hooks/useTranslation"
import { pageEnter } from "../lib/animations"

export default function ErrorPage() {
  const { t } = useTranslation()
  const pageRef = useRef(null)
  useGSAP(() => pageEnter(pageRef), { scope: pageRef })

  return (
    <div ref={pageRef} className="grid min-h-[60vh] place-items-center px-4 py-12 text-center">
      <Helmet>
        <title>{t("error.genericTitle")} | BayonHub</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="max-w-md">
        <p className="text-sm font-black uppercase tracking-widest text-primary">{t("app.name")}</p>
        <h1 className="mt-3 text-4xl font-black text-neutral-900">{t("error.genericTitle")}</h1>
        <p className="mt-3 text-sm font-bold leading-7 text-neutral-600">{t("error.genericMessage")}</p>
        <Link className="mt-6 inline-flex" to="/">
          <Button>{t("error.homeLink")}</Button>
        </Link>
      </div>
    </div>
  )
}
