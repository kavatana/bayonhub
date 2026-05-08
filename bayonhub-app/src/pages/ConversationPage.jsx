import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Send } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"
import { getListingImage, timeAgo } from "../lib/utils"
import { useAuthStore } from "../store/useAuthStore"
import { useMessageStore } from "../store/useMessageStore"
import Button from "../components/ui/Button"

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

export default function ConversationPage() {
  const { conversationId } = useParams()
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const messages = useMessageStore((state) => state.messages)
  const currentConversation = useMessageStore((state) => state.currentConversation)
  const loading = useMessageStore((state) => state.loading)
  const fetchMessages = useMessageStore((state) => state.fetchMessages)
  const sendMessage = useMessageStore((state) => state.sendMessage)
  const markAsRead = useMessageStore((state) => state.markAsRead)
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const intervalRef = useRef(null)

  const userId = user?.id

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/")
      return
    }
    if (!conversationId) return

    fetchMessages(conversationId)
    markAsRead(conversationId)

    // Poll every 5 seconds
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchMessages(conversationId)
      }
    }, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [conversationId, isAuthenticated, fetchMessages, markAsRead, navigate])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  async function handleSend(event) {
    event.preventDefault()
    if (!body.trim() || sending) return
    const messageBody = body.trim()
    setBody("")
    setSending(true)
    try {
      await sendMessage(conversationId, messageBody)
      scrollToBottom()
    } catch {
      // Restore body on error
      setBody(messageBody)
    } finally {
      setSending(false)
    }
  }

  // Find conversation info from the store
  const conversation = currentConversation
  const listing = conversation?.listing || null
  const listingImage = listing ? getListingImage(listing) : null

  if (loading && messages.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-8">
        <div className="flex items-center gap-3">
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 transition hover:bg-neutral-50"
            onClick={() => navigate("/inbox")}
            type="button"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="mt-6 flex-1 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
              <div className="h-10 w-48 animate-pulse rounded-2xl bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-4" style={{ minHeight: "calc(100vh - 8rem)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
        <button
          aria-label={t("ui.back")}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-neutral-200 transition hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700"
          onClick={() => navigate("/inbox")}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {listingImage ? (
          <img
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
            loading="lazy"
            src={listingImage}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          {listing ? (
            <Link
              className="block truncate text-sm font-black text-neutral-900 hover:text-primary dark:text-white"
              to={`/listing/${listing.id}`}
            >
              {listing.title || t("ui.untitled")}
            </Link>
          ) : (
            <span className="text-sm font-black text-neutral-900 dark:text-white">
              {t("messaging.inbox")}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-neutral-100 bg-white p-4 dark:bg-neutral-800 dark:border-neutral-700">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm font-semibold text-neutral-400">
            {t("messaging.noMessages")}
          </p>
        ) : (
          messages.map((message) => {
            const isMine = String(message.senderId) === String(userId)
            return (
              <div
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "bg-teal-600 text-white"
                      : "bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-white"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.body}</p>
                  <p
                    className={`mt-1 text-[10px] font-semibold ${
                      isMine ? "text-white/70" : "text-neutral-400"
                    }`}
                  >
                    {getRelativeTime(message.createdAt, language, t)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        className="mt-3 flex items-end gap-2 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm dark:bg-neutral-800 dark:border-neutral-700"
        onSubmit={handleSend}
      >
        <textarea
          className="min-h-[2.5rem] max-h-32 flex-1 resize-none rounded-xl border border-neutral-200 p-2.5 text-sm outline-none transition focus:border-primary dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:placeholder-neutral-400"
          maxLength={2000}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              handleSend(event)
            }
          }}
          placeholder={t("messaging.writeMessage")}
          rows={1}
          value={body}
        />
        <Button
          className="shrink-0"
          disabled={!body.trim() || sending}
          type="submit"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  )
}
