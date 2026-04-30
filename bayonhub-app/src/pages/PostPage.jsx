import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"
import PageTransition from "../components/ui/PageTransition"
import Spinner from "../components/ui/Spinner"

export default function PostPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)

  useEffect(() => {
    if (!isAuthenticated) {
      setPendingAction({ type: "post" })
      toggleAuthModal(true)
      // Redirect back to home so the modal stays visible over a valid page
      navigate("/", { replace: true })
    } else {
      togglePostModal(true)
      navigate("/", { replace: true })
    }
  }, [isAuthenticated, navigate, setPendingAction, toggleAuthModal, togglePostModal])

  return (
    <PageTransition>
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    </PageTransition>
  )
}
