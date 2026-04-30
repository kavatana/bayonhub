import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { Helmet } from "react-helmet-async"
import PricingSection from "../components/sections/PricingSection"
import { useTranslation } from "../hooks/useTranslation"
import { pageEnter } from "../lib/animations"

export default function PricingPage() {
  const { t } = useTranslation()
  const pageRef = useRef(null)
  useGSAP(() => pageEnter(pageRef), { scope: pageRef })

  return (
    <div ref={pageRef}>
      <Helmet>
        <title>{t("nav.pricing")} | BayonHub</title>
        <meta name="description" content={t("pricing.subtitle")} />
      </Helmet>
      <PricingSection />
    </div>
  )
}
