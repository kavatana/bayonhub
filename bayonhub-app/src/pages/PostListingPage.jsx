import { lazy, Suspense } from "react"
import { Helmet } from "react-helmet-async"
import { useNavigate } from "react-router-dom"
import { PostAdWizardSkeleton } from "../components/ui/Skeletons"
import { useTranslation } from "../hooks/useTranslation"
import { useListingStore } from "../store/useListingStore"

const PostAdWizard = lazy(() => import("../components/posting/PostAdWizard"))

export default function PostListingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const createListing = useListingStore((state) => state.createListing)

  return (
    <>
      <Helmet>
        <title>{t("post.title")} | BayonHub</title>
      </Helmet>
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-8">
            <PostAdWizardSkeleton />
          </div>
        }
      >
        <PostAdWizard
          onRequestClose={() => navigate("/")}
          onSubmitListing={createListing}
          openOverride
          submitLabelKey="post.publishBtn"
        />
      </Suspense>
    </>
  )
}
