import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
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
  const [isBannerDismissed, setIsBannerDismissed] = useState(false)
  const [apiUnavailable, setApiUnavailable] = useState(false)
  const wasOfflineRef = useRef(!isFullyOnline)
  const prevStatusRef = useRef({ isFullyOnline, isLimitedMode })

  useEffect(() => {
    if (isFullyOnline && wasOfflineRef.current) {
      toast.success(t("app.backOnline"))
    }
    
    // Reset dismissal if connectivity status changes (e.g. goes from Online to Offline)
    if (
      prevStatusRef.current.isFullyOnline !== isFullyOnline || 
      prevStatusRef.current.isLimitedMode !== isLimitedMode
    ) {
      setIsBannerDismissed(false)
    }

    wasOfflineRef.current = !isFullyOnline
    prevStatusRef.current = { isFullyOnline, isLimitedMode }
  }, [isFullyOnline, isLimitedMode, t])

  useEffect(() => {
    const handleApiUnavailable = () => setApiUnavailable(true)
    const handleOnline = () => setApiUnavailable(false)

    window.addEventListener('bayonhub:api-unavailable', handleApiUnavailable)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('bayonhub:api-unavailable', handleApiUnavailable)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const authStatus = searchParams.get("auth")
    const errorStatus = searchParams.get("error")

    if (authStatus === "success") {
      toast.success(t("auth.welcome"))
      // Clear params without full page reload
      searchParams.delete("auth")
      setSearchParams(searchParams, { replace: true })
    }

    if (errorStatus) {
      const errorMsg = t(`auth.error_${errorStatus}`) || t("auth.error_generic")
      toast.error(errorMsg)
      searchParams.delete("error")
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, t])

  return (
    <div className="relative min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 selection:bg-primary/20">
      {/* 
        KHMER MINIMALIST WATERMARK 
        Positioned fixed to the viewport to maintain depth during scroll.
        Pointer-events-none ensures it never interferes with clicks.
      */}
      <div 
        className="pointer-events-none fixed bottom-0 right-0 z-0 select-none opacity-[0.03] transition-opacity duration-1000 dark:opacity-[0.05]"
        aria-hidden="true"
      >
        <img 
          src="/assets/khmer-sketch-illustration.svg" 
          alt="" 
          className="h-[400px] w-auto object-contain sm:h-[600px] lg:h-[800px] transform translate-x-10 translate-y-10 rotate-[-5deg]"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <AuthListener />
        
        {/* Connectivity Guard Banners */}
        {((!isFullyOnline || apiUnavailable) && !isBannerDismissed) && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-sm py-3 px-4 text-center flex items-center justify-between gap-2 shadow-xl animate-in slide-in-from-top duration-300"
          >
            <div className="flex flex-1 items-center justify-center gap-2 font-bold">
              <WifiOff size={16} aria-hidden="true" />
              <span>
                {apiUnavailable 
                  ? "API is currently unreachable. Some content may not load correctly." 
                  : "You're currently offline. Some content may not load correctly."}
              </span>
            </div>
            <button 
              onClick={() => setIsBannerDismissed(true)}
              className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}

        <Navbar />
        
        <main className="flex-grow focus:outline-none" id="main-content">
          {children}
        </main>
        
        <Footer />
      </div>

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
