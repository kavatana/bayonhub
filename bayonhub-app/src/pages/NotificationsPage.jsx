import { useEffect, useState } from "react"
import { Helmet } from "react-helmet-async"
import { Bell, CheckCheck, Trash2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import Button from "../components/ui/Button"
import PageTransition from "../components/ui/PageTransition"
import SkeletonCard from "../components/ui/SkeletonCard"
import { useTranslation } from "../hooks/useTranslation"
import { timeAgo } from "../lib/utils"
import { useNotificationStore } from "../store/useNotificationStore"

const filters = ["all", "unread"]

function notificationLabel(type, t) {
  if (type === "message") return t("notif.newMessage")
  if (type === "price_drop") return t("notif.priceDrop")
  if (type === "expiry") return t("notif.expiry")
  return t("notif.digest")
}

export default function NotificationsPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState("all")
  const notifications = useNotificationStore((state) => state.notifications)
  const loading = useNotificationStore((state) => state.loading)
  const error = useNotificationStore((state) => state.error)
  const page = useNotificationStore((state) => state.page)
  const totalPages = useNotificationStore((state) => state.totalPages)
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications)
  const markRead = useNotificationStore((state) => state.markRead)
  const markAllRead = useNotificationStore((state) => state.markAllRead)
  const deleteNotification = useNotificationStore((state) => state.deleteNotification)

  useEffect(() => {
    fetchNotifications({ page: 1, limit: 20, filter })
  }, [fetchNotifications, filter])

  async function openNotification(notification) {
    if (!notification.read) await markRead(notification.id)
    if (notification.link) navigate(notification.link)
  }

  function goToPage(nextPage) {
    fetchNotifications({ page: nextPage, limit: 20, filter })
  }

  return (
    <PageTransition className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("notif.viewAll")} | BayonHub</title>
      </Helmet>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">{t("notif.viewAll")}</h1>
          <p className="mt-1 text-sm font-bold text-neutral-500">{t("notif.empty")}</p>
        </div>
        <Button onClick={markAllRead} size="sm" variant="secondary">
          <CheckCheck className="h-4 w-4" aria-hidden="true" />
          {t("notif.markAllRead")}
        </Button>
      </div>

      <div className="mt-5 flex gap-2">
        {filters.map((item) => (
          <button
            className={`rounded-full px-4 py-2 text-sm font-black ${filter === item ? "bg-primary text-white" : "bg-neutral-100 text-neutral-700"}`}
            key={item}
            onClick={() => setFilter(item)}
            type="button"
          >
            {item === "unread" ? t("notifications.unread") : t("dashboard.all")}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
            <p className="font-black">{t("ui.error")}</p>
            <p className="mt-1 text-sm font-bold">{error}</p>
          </div>
        ) : notifications.length ? (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <article
                className={`rounded-2xl border bg-white p-4 shadow-sm ${notification.read ? "border-neutral-200" : "border-primary/30"}`}
                key={notification.id}
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <button className="min-w-0 flex-1 text-left" onClick={() => openNotification(notification)} type="button">
                    <p className="text-xs font-black uppercase tracking-widest text-primary">{notificationLabel(notification.type, t)}</p>
                    <h2 className="mt-1 text-base font-black text-neutral-900">{notification.title}</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-neutral-600">{notification.body}</p>
                    <p className="mt-2 text-xs font-bold text-neutral-400">{timeAgo(notification.createdAt, language)}</p>
                  </button>
                  <button
                    aria-label={t("listing.delete")}
                    className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                    onClick={() => deleteNotification(notification.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
            <div>
              <Bell className="mx-auto h-10 w-10 text-neutral-300" aria-hidden="true" />
              <p className="mt-3 font-black text-neutral-900">{t("notif.empty")}</p>
              <Link className="mt-4 inline-flex text-sm font-black text-primary" to="/search">
                {t("home.viewAll")}
              </Link>
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-3">
          <Button disabled={page <= 1} onClick={() => goToPage(page - 1)} size="sm" variant="secondary">
            {t("pagination.previous")}
          </Button>
          <p className="text-sm font-black text-neutral-700">
            {t("pagination.pageOf")} {page} {t("pagination.of")} {totalPages}
          </p>
          <Button disabled={page >= totalPages} onClick={() => goToPage(page + 1)} size="sm" variant="secondary">
            {t("pagination.next")}
          </Button>
        </div>
      ) : null}
    </PageTransition>
  )
}
