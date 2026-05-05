import { lazy, Suspense, useEffect } from "react"
import { Route, Routes } from "react-router-dom"
import Layout from "./components/layout/Layout"
import ErrorBoundary from "./components/ui/ErrorBoundary"
import Spinner from "./components/ui/Spinner"

const AboutPage = lazy(() => import("./pages/AboutPage"))
const AdminPage = lazy(() => import("./pages/AdminPage"))
const CategoryPage = lazy(() => import("./pages/CategoryPage"))
const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const HelpPage = lazy(() => import("./pages/HelpPage"))
const HomePage = lazy(() => import("./pages/HomePage"))
const ListingPage = lazy(() => import("./pages/ListingPage"))
const EditListingPage = lazy(() => import("./pages/EditListingPage"))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"))
const PostPage = lazy(() => import("./pages/PostPage"))
const PricingPage = lazy(() => import("./pages/PricingPage"))
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"))
const SearchPage = lazy(() => import("./pages/SearchPage"))
const StorefrontPage = lazy(() => import("./pages/StorefrontPage"))
const TermsPage = lazy(() => import("./pages/TermsPage"))
import { useListingStore } from "./store/useListingStore"

function routePage(Page) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="grid min-h-[60vh] place-items-center">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        }
      >
        <Page />
      </Suspense>
    </ErrorBoundary>
  )
}

function App() {
  const initializeStore = useListingStore((state) => state.initialize)

  useEffect(() => {
    initializeStore()

    const handleApiUnavailable = () => {
      import("react-hot-toast").then(({ toast }) => {
        const { translate } = import.meta.glob("./lib/translations.js", { eager: true })["./lib/translations.js"]
        const lang = localStorage.getItem("bayonhub:language") || "km"
        toast.error(translate(lang, "app.apiUnavailable"), {
          id: "api-unavailable",
          duration: 5000,
        })
      })
    }

    window.addEventListener("bayonhub:api-unavailable", handleApiUnavailable)
    return () => {
      window.removeEventListener("bayonhub:api-unavailable", handleApiUnavailable)
    }
  }, [initializeStore])

  return (
    <Layout>
      <Suspense
        fallback={
          <div className="grid min-h-[60vh] place-items-center">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        }
      >
        <Routes>
          <Route element={<HomePage />} path="/" />
          <Route element={routePage(AboutPage)} path="/about" />
          <Route element={routePage(AdminPage)} path="/admin" />
          <Route element={<CategoryPage />} path="/category/:slug" />
          <Route element={<CategoryPage />} path="/category/:slug/:subcategory" />
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={routePage(HelpPage)} path="/help" />
          <Route element={<ListingPage />} path="/listing/:id" />
          <Route element={<EditListingPage />} path="/listing/:id/edit" />
          <Route element={<ListingPage />} path="/listing/:id/:slug" />
          <Route element={<ListingPage />} path="/buy/:province/:categorySlug/:titleSlug-:id" />
          <Route element={<ListingPage />} path="/l/:categorySlug/:province/:titleSlug-:id" />
          <Route element={<PostPage />} path="/post" />
          <Route element={<PricingPage />} path="/pricing" />
          <Route element={routePage(PrivacyPage)} path="/privacy" />
          <Route element={<StorefrontPage />} path="/seller/:id" />
          <Route element={<StorefrontPage />} path="/u/:slug" />
          <Route element={<SearchPage />} path="/search" />
          <Route element={routePage(TermsPage)} path="/terms" />
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
