import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUIStore } from "../store/useUIStore"
import PageTransition from "../components/ui/PageTransition"
import { PostAdWizardSkeleton } from "../components/ui/Skeletons"

export default function PostPage() {
  const navigate = useNavigate()
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)

  useEffect(() => {
    setPendingAction({ type: "post" })
    togglePostModal(true)
    navigate("/", { replace: true })
  }, [navigate, setPendingAction, togglePostModal])

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PostAdWizardSkeleton />
      </div>
    </PageTransition>
  )
}
