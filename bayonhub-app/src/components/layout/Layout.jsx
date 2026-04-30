import { lazy, Suspense, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { WifiOff } from "lucide-react"
const PostAdWizard = lazy(() => import("../posting/PostAdWizard"))
const AuthModal = lazy(() => import("../auth/AuthModal"))
const FeedbackTab = lazy(() => import("../ui/FeedbackTab"))
import AuthListener from "../auth/AuthListener"
import Spinner from "../ui/Spinner"
import Footer from "./Footer"
import Navbar from "./Navbar"
import { useOnlineStatus } from "../../hooks/useOnlineStatus"
import { useTranslation } from "../../hooks/useTranslation"

export default function Layout({ children }) {
  const { t } = useTranslation()
  const { isFullyOnline, isLimitedMode } = useOnlineStatus()
  const wasOfflineRef = useRef(!isFullyOnline)

  useEffect(() => {
    if (isFullyOnline && wasOfflineRef.current) {
      toast.success(t("app.backOnline"))
    }
    wasOfflineRef.current = !isFullyOnline
  }, [isFullyOnline, t])

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
      <AuthListener />
      {isLimitedMode ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-[9999] bg-orange-500 text-white text-sm py-2 text-center flex items-center justify-center gap-2"
        >
          <WifiOff size={14} aria-hidden="true" />
          <span>{t("app.limitedMode")}</span>
        </div>
      ) : null}
      {!isFullyOnline && !isLimitedMode ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-black text-sm py-2 text-center flex items-center justify-center gap-2"
        >
          <WifiOff size={14} aria-hidden="true" />
          <span>{t("app.offline")}</span>
        </div>
      ) : null}
      <Navbar />
      <main>{children}</main>
      <Footer />
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/20">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        }
      >
        <PostAdWizard />
        <AuthModal />
        <FeedbackTab />
      </Suspense>
    </div>
  )
}
