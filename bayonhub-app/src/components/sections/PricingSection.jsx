import { useState } from "react"
import ABAPayModal from "../payments/ABAPayModal"
import { useTranslation } from "../../hooks/useTranslation"
import { PROMOTION_STATES } from "../../lib/promotionStates"
import { useUIStore } from "../../store/useUIStore"
import { useAuthStore } from "../../store/useAuthStore"

export default function PricingSection() {
  const { t } = useTranslation()
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [khqrPlan, setKhqrPlan] = useState(null)

  const plans = [
    {
      titleKey: "pricing.starter",
      textKey: "pricing.starterText",
      priceKey: "pricing.starterPrice",
      ctaKey: "pricing.getStarted",
      featured: false,
      action: "post",
    },
    {
      titleKey: "pricing.boost",
      textKey: "pricing.boostText",
      priceKey: "pricing.boostPrice",
      ctaKey: "pricing.boostNow",
      featured: true,
      action: "boost",
    },
    {
      titleKey: "pricing.business",
      textKey: "pricing.businessText",
      priceKey: "pricing.businessPrice",
      ctaKey: "pricing.contactUs",
      featured: false,
      action: "contact",
    },
  ]

  function handleCta(plan) {
    if (plan.action === "post") {
      if (!isAuthenticated) {
        setPendingAction({ type: "post" })
        toggleAuthModal(true)
      } else {
        togglePostModal(true)
      }
      return
    }
    if (plan.action === "boost") {
      if (!isAuthenticated) {
        setPendingAction({ type: "post" })
        toggleAuthModal(true)
      } else {
        setKhqrPlan(PROMOTION_STATES.BOOST)
      }
      return
    }
    if (plan.action === "contact") {
      window.open("https://t.me/bayonhub", "_blank", "noopener,noreferrer")
    }
  }

  return (
    <>
      {khqrPlan ? <ABAPayModal onClose={() => setKhqrPlan(null)} open={Boolean(khqrPlan)} promotionState={khqrPlan} /> : null}

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 bg-bayon-line bg-bayon-line-5">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-black text-neutral-900">{t("pricing.title")}</h2>
          <p className="mt-3 leading-7 text-neutral-600">{t("pricing.subtitle")}</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              className={
                plan.featured
                  ? "noise-overlay relative flex flex-col overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-lg"
                  : "noise-overlay relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              }
              key={plan.titleKey}
            >
              <h3 className="text-xl font-black">{t(plan.titleKey)}</h3>
              <p className={plan.featured ? "mt-3 flex-1 text-red-50" : "mt-3 flex-1 text-neutral-600"}>
                {t(plan.textKey)}
              </p>
              <strong className="mt-6 block text-3xl font-black">{t(plan.priceKey)}</strong>
              <button
                className={`mt-4 rounded-xl px-5 py-2.5 text-sm font-black transition ${
                  plan.featured
                    ? "bg-white text-primary hover:bg-red-50"
                    : "border border-primary bg-transparent text-primary hover:bg-primary hover:text-white"
                }`}
                onClick={() => handleCta(plan)}
                type="button"
              >
                {t(plan.ctaKey)}
              </button>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
