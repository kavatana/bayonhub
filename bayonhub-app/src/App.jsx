import { lazy, Suspense, useEffect } from "react"
import { Route, Routes } from "react-router-dom"
import Layout from "./components/layout/Layout"
import ErrorBoundary from "./components/ui/ErrorBoundary"
import Spinner from "./components/ui/Spinner"

const AboutPage = lazy(() => import("./pages/AboutPage"))
const AccountPage = lazy(() => import("./pages/AccountPage"))
const AdminPage = lazy(() => import("./pages/AdminPage"))
const CategoryPage = lazy(() => import("./pages/CategoryPage"))
const DashboardPage = lazy(() => import("./pages/DashboardPage"))
const HelpPage = lazy(() => import("./pages/HelpPage"))
const FollowingPage = lazy(() => import("./pages/FollowingPage"))
const HomePage = lazy(() => import("./pages/HomePage"))
const ListingPage = lazy(() => import("./pages/ListingPage"))
const EditListingPage = lazy(() => import("./pages/EditListingPage"))
const MyListingsPage = lazy(() => import("./pages/MyListingsPage"))
const InboxPage = lazy(() => import("./pages/InboxPage"))
const ConversationPage = lazy(() => import("./pages/ConversationPage"))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"))
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"))
const PostListingPage = lazy(() => import("./pages/PostListingPage"))
const PostingRulesPage = lazy(() => import("./pages/PostingRulesPage"))
const PricingPage = lazy(() => import("./pages/PricingPage"))
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"))
const RecentlyViewedPage = lazy(() => import("./pages/RecentlyViewedPage"))
const SavedListingsPage = lazy(() => import("./pages/SavedListingsPage"))
const SearchPage = lazy(() => import("./pages/SearchPage"))
const SettingsPage = lazy(() => import("./pages/SettingsPage"))
const StorefrontPage = lazy(() => import("./pages/StorefrontPage"))
const TermsPage = lazy(() => import("./pages/TermsPage"))
const UpgradePage = lazy(() => import("./pages/UpgradePage"))
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
          <Route element={<AccountPage />} path="/account" />
          <Route element={routePage(AdminPage)} path="/admin" />
          <Route element={routePage(AdminPage)} path="/admin/gift-plus" />
          <Route element={routePage(AdminPage)} path="/admin/payments" />
          <Route element={<CategoryPage />} path="/category/:slug" />
          <Route element={<CategoryPage />} path="/category/:slug/:subcategory" />
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={routePage(HelpPage)} path="/help" />
          <Route element={<FollowingPage />} path="/following" />
          <Route element={<ListingPage />} path="/listing/:id" />
          <Route element={<EditListingPage />} path="/listing/:id/edit" />
          <Route element={<ListingPage />} path="/listing/:id/:slug" />
          <Route element={<ListingPage />} path="/buy/:province/:categorySlug/:slugAndId" />
          <Route element={<ListingPage />} path="/buy/:province/:categorySlug/:titleSlug-:id" />
          <Route element={<ListingPage />} path="/l/:categorySlug/:province/:titleSlug-:id" />
          <Route element={<PostListingPage />} path="/post" />
          <Route element={routePage(PostingRulesPage)} path="/posting-rules" />
          <Route element={<MyListingsPage />} path="/my-listings" />
          <Route element={<NotificationsPage />} path="/notifications" />
          <Route element={<PricingPage />} path="/pricing" />
          <Route element={routePage(PrivacyPage)} path="/privacy" />
          <Route element={<RecentlyViewedPage />} path="/recently-viewed" />
          <Route element={<SavedListingsPage />} path="/saved" />
          <Route element={<StorefrontPage />} path="/seller/:id" />
          <Route element={<StorefrontPage />} path="/u/:slug" />
          <Route element={<SearchPage />} path="/search" />
          <Route element={<SettingsPage />} path="/settings" />
          <Route element={routePage(TermsPage)} path="/terms" />
          <Route element={routePage(UpgradePage)} path="/upgrade" />
          <Route element={<InboxPage />} path="/inbox" />
          <Route element={<ConversationPage />} path="/inbox/:conversationId" />
          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
