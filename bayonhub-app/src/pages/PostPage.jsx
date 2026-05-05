import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUIStore } from "../store/useUIStore"
import PageTransition from "../components/ui/PageTransition"
import Spinner from "../components/ui/Spinner"

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
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    </PageTransition>
  )
}
