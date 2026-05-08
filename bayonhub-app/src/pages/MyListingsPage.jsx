import { Helmet } from "react-helmet-async"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import MyAdsTab from "../components/dashboard/MyAdsTab"
import PageTransition from "../components/ui/PageTransition"
import { useTranslation } from "../hooks/useTranslation"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"

export default function MyListingsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)

  useEffect(() => {
    if (isAuthenticated) return
    setPendingAction({ type: "myListings" })
    toggleAuthModal(true)
  }, [isAuthenticated, setPendingAction, toggleAuthModal])

  if (!isAuthenticated) {
    return (
      <PageTransition className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-10 text-center">
        <p className="font-bold text-neutral-500">{t("auth.unauthenticated")}</p>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("listing.myListings")} | BayonHub</title>
      </Helmet>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">{t("listing.myListings")}</h1>
          <p className="text-sm font-bold text-neutral-500">{t("dashboard.manageAds")}</p>
        </div>
        <button
          className="h-11 rounded-xl bg-primary px-4 text-sm font-black text-white"
          onClick={() => navigate("/post")}
          type="button"
        >
          {t("post.postAd")}
        </button>
      </div>
      <MyAdsTab />
    </PageTransition>
  )
}
