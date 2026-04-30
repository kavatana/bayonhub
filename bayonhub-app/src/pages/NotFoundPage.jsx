import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import Button from "../components/ui/Button"
import { useTranslation } from "../hooks/useTranslation"
import { pageEnter } from "../lib/animations"

export default function NotFoundPage({ message }) {
  const { t } = useTranslation()
  const pageRef = useRef(null)
  useGSAP(() => pageEnter(pageRef), { scope: pageRef })
  return (
    <div ref={pageRef} className="grid min-h-[60vh] place-items-center px-4 text-center">
      <Helmet>
        <title>{t("page.notFound")} | BayonHub</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div>
        <h1 className="text-4xl font-black text-neutral-900">{t("page.notFound")}</h1>
        <p className="mt-3 text-neutral-600">{message || t("page.notFoundText")}</p>
        <Link className="mt-6 inline-flex" to="/">
          <Button>{t("breadcrumb.home")}</Button>
        </Link>
      </div>
    </div>
  )
}
