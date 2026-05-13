import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUIStore } from "../store/useUIStore"

export default function PostPage() {
  const navigate = useNavigate()
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const setPendingAction = useUIStore((state) => state.setPendingAction)

  useEffect(() => {
    setPendingAction({ type: "post" })
    navigate("/", { replace: true })
    const timer = window.setTimeout(() => togglePostModal(true), 100)
    return () => window.clearTimeout(timer)
  }, [navigate, setPendingAction, togglePostModal])

  return null
}
