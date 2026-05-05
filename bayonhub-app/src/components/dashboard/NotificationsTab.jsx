import { memo, useMemo } from "react"
import { CheckCircle, Eye, Bell, MessageCircle, TrendingDown, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "../../hooks/useTranslation"
import { timeAgo } from "../../lib/utils"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"

const iconMap = {
  price_drop: TrendingDown,
  new_message: MessageCircle,
  listing_view: Eye,
  listing_approved: CheckCircle,
  promo_expiry: Zap,
}

function NotificationsTab() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const notifications = useUIStore((state) => state.notifications)
  const markRead = useUIStore((state) => state.markRead)
  const markAllRead = useUIStore((state) => state.markAllRead)
  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [notifications],
  )
  const hasUnread = sortedNotifications.some((notification) => !notification.read)

  function openNotification(notification) {
    markRead(notification.id)
    if (notification.listingId) navigate(`/listing/${notification.listingId}`)
  }

  if (!sortedNotifications.length) {
    return (
      <div className="grid min-h-64 place-items-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Bell className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-lg font-black text-neutral-900">{t("dashboard.noNotifications")}</h3>
          <p className="mt-1 text-sm font-semibold text-neutral-500">{t("dashboard.noNotificationsDesc")}</p>
        </div>
        <Button onClick={() => navigate("/")} variant="secondary">
          {t("nav.home")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-neutral-900">{t("dashboard.notifications")}</h2>
        {hasUnread ? (
          <Button onClick={markAllRead} size="sm" variant="secondary">
            {t("dashboard.markAllRead")}
          </Button>
        ) : null}
      </div>
      <div role="list" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {sortedNotifications.map((notification) => {
          const Icon = iconMap[notification.type] || Bell
          return (
            <div role="listitem" key={notification.id}>
              <button
                className="flex w-full items-start gap-3 border-b border-neutral-100 p-4 text-left transition last:border-0 hover:bg-neutral-50"
                onClick={() => openNotification(notification)}
                type="button"
              >
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {!notification.read ? <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-600" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-neutral-900">
                    {notification.title || t(notification.titleKey)}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-6 text-neutral-500">
                    {notification.body || t(notification.bodyKey)}
                  </span>
                  <span className="mt-2 block text-xs font-bold text-neutral-400">
                    {timeAgo(notification.createdAt, language)}
                  </span>
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(NotificationsTab)
