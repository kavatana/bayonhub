import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { MessageCircle } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"
import { getListingImage, timeAgo } from "../lib/utils"
import { useAuthStore } from "../store/useAuthStore"
import { useMessageStore } from "../store/useMessageStore"
import { useUIStore } from "../store/useUIStore"

function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 animate-pulse">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-neutral-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-neutral-200" />
        <div className="h-3 w-1/2 rounded bg-neutral-200" />
      </div>
      <div className="h-3 w-16 rounded bg-neutral-200" />
    </div>
  )
}

function getRelativeTime(dateString, language, t) {
  if (!dateString) return ""
  const now = new Date()
  const then = new Date(dateString)
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)

  if (diffMin < 1) return t("messaging.justNow")
  if (diffMin < 60) return `${diffMin} ${t("messaging.minutesAgo")}`
  if (diffHr < 24) return `${diffHr} ${t("messaging.hoursAgo")}`
  return timeAgo(dateString, language)
}

export default function InboxPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const conversations = useMessageStore((state) => state.conversations)
  const loading = useMessageStore((state) => state.loading)
  const fetchConversations = useMessageStore((state) => state.fetchConversations)

  useEffect(() => {
    if (!isAuthenticated) {
      useUIStore.getState().setPendingAction({ type: "inbox" })
      useUIStore.getState().toggleAuthModal(true)
      navigate("/", { replace: true })
      return
    }
    fetchConversations()
  }, [isAuthenticated, fetchConversations, navigate])

  const userId = user?.id

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    [conversations],
  )

  if (loading && conversations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-black text-neutral-900 dark:text-white">
          {t("messaging.inbox")}
        </h1>
        <div className="space-y-3">
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </div>
      </div>
    )
  }

  if (!loading && sortedConversations.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-black text-neutral-900 dark:text-white">
          {t("messaging.inbox")}
        </h1>
        <div className="grid place-items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-12 text-center dark:bg-neutral-800 dark:border-neutral-700">
          <MessageCircle className="h-12 w-12 text-neutral-300" />
          <p className="text-lg font-black text-neutral-700 dark:text-neutral-200">
            {t("messaging.noMessages")}
          </p>
          <p className="text-sm font-semibold text-neutral-500">
            {t("messaging.contactSeller")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-black text-neutral-900 dark:text-white">
        {t("messaging.inbox")}
      </h1>
      <div className="space-y-2">
        {sortedConversations.map((conversation) => {
          const isBuyer = String(userId) === String(conversation.buyerId)
          const otherParty = isBuyer ? conversation.seller : conversation.buyer
          const lastMessage = conversation.lastMessage || conversation.messages?.[0]
          const lastBody = lastMessage?.body || ""
          const snippet = lastBody.length > 60 ? `${lastBody.slice(0, 60)}...` : lastBody
          const hasUnread = (conversation.unreadCount || 0) > 0
          const timestamp = lastMessage?.createdAt || conversation.updatedAt

          return (
            <button
              className="flex w-full items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 text-left transition hover:border-primary/30 hover:shadow-sm dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-primary/40"
              key={conversation.id}
              onClick={() => navigate(`/inbox/${conversation.id}`)}
              type="button"
            >
              {/* Listing thumbnail */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                {conversation.listing ? (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={getListingImage(conversation.listing) || ""}
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center text-xs font-black text-neutral-400">
                    BH
                  </span>
                )}
                {hasUnread ? (
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-primary" />
                ) : null}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`truncate text-sm ${hasUnread ? "font-black text-neutral-900 dark:text-white" : "font-bold text-neutral-700 dark:text-neutral-300"}`}>
                    {otherParty?.name || t("ui.anonymous")}
                  </p>
                </div>
                <p className={`mt-0.5 truncate text-xs ${hasUnread ? "font-bold text-neutral-700 dark:text-neutral-300" : "font-semibold text-neutral-500"}`}>
                  {lastMessage?.senderId === userId ? `${t("messaging.you")}: ` : ""}
                  {snippet || t("messaging.noMessages")}
                </p>
              </div>

              {/* Timestamp */}
              <span className="shrink-0 text-xs font-semibold text-neutral-400">
                {getRelativeTime(timestamp, language, t)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
