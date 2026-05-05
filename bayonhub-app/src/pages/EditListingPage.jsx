import { lazy, Suspense, useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { useNavigate, useParams } from "react-router-dom"
import { PostAdWizardSkeleton } from "../components/ui/Skeletons"
import { useTranslation } from "../hooks/useTranslation"
import { useAuthStore } from "../store/useAuthStore"
import { useListingStore } from "../store/useListingStore"
import { useUIStore } from "../store/useUIStore"
import NotFoundPage from "./NotFoundPage"

const PostAdWizard = lazy(() => import("../components/posting/PostAdWizard"))

export default function EditListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const listing = useListingStore((state) => state.currentListing)
  const loading = useListingStore((state) => state.loading)
  const fetchListingById = useListingStore((state) => state.fetchListingById)
  const updateListing = useListingStore((state) => state.updateListing)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)

  useEffect(() => {
    fetchListingById(id)
  }, [fetchListingById, id])

  useEffect(() => {
    if (isAuthenticated) return
    setPendingAction({ type: "dashboard" })
    toggleAuthModal(true)
  }, [isAuthenticated, setPendingAction, toggleAuthModal])

  if (!isAuthenticated) {
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-10 text-center">
        <p className="font-bold text-neutral-500">{t("auth.unauthenticated")}</p>
      </div>
    )
  }

  if (loading && !listing) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PostAdWizardSkeleton />
      </div>
    )
  }

  if (!listing) return <NotFoundPage message={t("listing.empty")} />

  return (
    <>
      <Helmet>
        <title>{t("listing.saveChanges")} | BayonHub</title>
      </Helmet>
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-8">
            <PostAdWizardSkeleton />
          </div>
        }
      >
        <PostAdWizard
          key={listing.id}
          initialListing={listing}
          onRequestClose={() => navigate("/dashboard")}
          onSubmitListing={(payload) => updateListing(id, payload)}
          openOverride
          submitLabelKey="listing.saveChanges"
        />
      </Suspense>
    </>
  )
}
