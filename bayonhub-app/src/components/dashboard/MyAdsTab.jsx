import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BarChart2, Check, Pencil, PlusCircle, Rocket, Trash2, TrendingUp, MoreVertical } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { getPromotionState, isPromotedListing, PROMOTION_LABELS } from "../../lib/promotionStates"
import { formatPrice, getListingImage, listingUrl, timeAgo } from "../../lib/utils"
import { useAuthStore } from "../../store/useAuthStore"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"
import Modal from "../ui/Modal"

import { Tag } from "lucide-react"

const statuses = ["active", "pending", "sold", "expired", "removed"]
const perPage = 10
const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const weekAgoTimestamp = new Date(Date.now() - WEEK_MS).getTime()

export default function MyAdsTab() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const listings = useListingStore((state) => state.listings)
  const updateListing = useListingStore((state) => state.updateListing)
  const deleteListing = useListingStore((state) => state.deleteListing)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const [activeStatus, setActiveStatus] = useState("active")
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState(null)
  const [actionSheetListing, setActionSheetListing] = useState(null)
  const [actionSheetConfirmDelete, setActionSheetConfirmDelete] = useState(false)
  const userId = user?.id

  const myAllListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          !userId || listing.sellerId === userId || listing.sellerId === "local-demo-seller",
      ),
    [listings, userId],
  )

  const analytics = useMemo(() => {
    const totalViews = myAllListings.reduce((sum, l) => sum + Number(l.viewCount || l.views || 0), 0)
    const totalLeads = myAllListings.reduce((sum, l) => sum + Number(l.contactCount || l.leads || 0), 0)
    const viewsThisWeek = myAllListings
      .filter((l) => new Date(l.updatedAt || l.postedAt || 0).getTime() >= weekAgoTimestamp)
      .reduce((sum, l) => sum + Number(l.viewCount || l.views || 0), 0)
    const topListing = [...myAllListings].sort(
      (a, b) => Number(b.viewCount || b.views || 0) - Number(a.viewCount || a.views || 0),
    )[0] || null
    return { totalViews, totalLeads, viewsThisWeek, topListing }
  }, [myAllListings])

  const myListings = useMemo(
    () =>
      myAllListings.filter((listing) => (listing.status || "active") === activeStatus),
    [activeStatus, myAllListings],
  )
  const pageCount = Math.max(1, Math.ceil(myListings.length / perPage))
  const pageItems = myListings.slice((page - 1) * perPage, page * perPage)

  function bumpListing(id) {
    updateListing(id, { updatedAt: new Date().toISOString(), postedAt: new Date().toISOString() })
  }

  return (
    <div className="space-y-4">
      {/* Analytics Summary Card */}
      {myAllListings.length > 0 && (
        <section
          aria-label={t("dashboard.analytics")}
          className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3">
            <BarChart2 className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-700">
              {t("dashboard.analytics")}
            </h2>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100 sm:grid-cols-4 sm:divide-y-0">
            {[
              { label: t("dashboard.totalViews"), value: analytics.totalViews.toLocaleString() },
              { label: t("dashboard.totalLeads"), value: analytics.totalLeads.toLocaleString() },
              { label: `${t("dashboard.totalViews")} · ${t("dashboard.thisWeek")}`, value: analytics.viewsThisWeek.toLocaleString() },
              { label: t("listing.activeListings"), value: myAllListings.filter((l) => (l.status || "active") === "active").length.toString() },
            ].map(({ label, value }) => (
              <div className="flex flex-col items-center justify-center px-4 py-4 text-center" key={label}>
                <strong className="text-2xl font-black text-neutral-900">{value}</strong>
                <span className="mt-0.5 text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</span>
              </div>
            ))}
          </div>
          {analytics.topListing && (
            <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <TrendingUp className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <span className="text-xs font-bold text-neutral-500">{t("dashboard.topListing")}:</span>
                <Link
                  className="truncate text-xs font-black text-neutral-900 hover:text-primary hover:underline"
                  to={listingUrl(analytics.topListing)}
                >
                  {analytics.topListing.title}
                </Link>
              </div>
              {!isPromotedListing(analytics.topListing) && (
                <Button
                  onClick={() => {
                    if (!user) { toggleAuthModal(true); return }
                    togglePostModal(false)
                    navigate(`/listing/${analytics.topListing.id}/edit`)
                  }}
                  size="sm"
                  variant="primary"
                >
                  <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("dashboard.boostTopListing")}
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map((status) => (
          <button
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              activeStatus === status ? "bg-primary text-white" : "bg-white text-neutral-600"
            }`}
            key={status}
            onClick={() => {
              setActiveStatus(status)
              setPage(1)
            }}
            type="button"
          >
            {t(`dashboard.${status}`)}
          </button>
        ))}
      </div>

      {pageItems.length ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-black uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="p-3">{t("dashboard.thumbnail")}</th>
                  <th className="p-3">{t("post.listingTitle")}</th>
                  <th className="p-3">{t("post.price")}</th>
                  <th className="p-3">{t("listing.views")}</th>
                  <th className="p-3">{t("dashboard.leads")}</th>
                  <th className="p-3">{t("listing.posted")}</th>
                  <th className="p-3">{t("post.promotion")}</th>
                  <th className="p-3">{t("dashboard.status")}</th>
                  <th className="p-3">{t("ui.edit")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pageItems.map((listing) => {
                  const promotionState = getPromotionState(listing)
                  const promotionLabel = PROMOTION_LABELS[promotionState]?.[language]
                  const promoted = isPromotedListing(listing)
                  return (
                    <tr key={listing.id}>
                      <td className="p-3">
                        <img alt={listing.title} className="h-14 w-16 rounded-lg object-cover" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.onerror = null }} src={getListingImage(listing)} />
                      </td>
                      <td className="max-w-56 p-3 font-bold text-neutral-900">
                        <Link className="hover:text-primary hover:underline" to={listingUrl(listing)}>
                          {listing.title}
                        </Link>
                      </td>
                      <td className="p-3 font-black text-primary">{formatPrice(listing.price, listing.currency)}</td>
                      <td className="p-3 text-neutral-600">{Number(listing.views || 0).toLocaleString()}</td>
                      <td className="p-3 text-neutral-600">{Number(listing.leads || 0).toLocaleString()}</td>
                      <td className="p-3 text-neutral-600">{timeAgo(listing.updatedAt || listing.postedAt, language)}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${promoted ? "bg-primary/10 text-primary" : "bg-neutral-100 text-neutral-700"}`}>
                          {promotionLabel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-black text-neutral-700">
                          {t(`dashboard.${listing.status || "active"}`)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button title={t("ui.edit")} className="group flex h-11 items-center gap-2 rounded-lg px-2 hover:bg-neutral-100" onClick={() => navigate(`/listing/${listing.id}/edit`)} type="button">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden text-xs font-bold text-neutral-600 group-hover:inline-block">{t("ui.edit")}</span>
                          </button>
                          <button title={t("dashboard.markSold")} className="group flex h-11 items-center gap-2 rounded-lg px-2 hover:bg-neutral-100" onClick={() => updateListing(listing.id, { status: "sold" })} type="button">
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden text-xs font-bold text-neutral-600 group-hover:inline-block">{t("dashboard.markSold")}</span>
                          </button>
                          <button title={t("dashboard.bump")} className="group flex h-11 items-center gap-2 rounded-lg px-2 hover:bg-neutral-100" onClick={() => bumpListing(listing.id)} type="button">
                            <Rocket className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden text-xs font-bold text-neutral-600 group-hover:inline-block">{t("dashboard.bump")}</span>
                          </button>
                          <button title={t("ui.delete")} className="group flex h-11 items-center gap-2 rounded-lg px-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(listing.id)} type="button">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden text-xs font-bold text-red-600 group-hover:inline-block">{t("ui.delete")}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {pageItems.map((listing) => {
              const promotionState = getPromotionState(listing)
              const promotionLabel = PROMOTION_LABELS[promotionState]?.[language]
              const promoted = isPromotedListing(listing)
              return (
                <article className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm" key={listing.id}>
                  <div className="flex gap-3">
                    <img alt={listing.title} className="h-20 w-24 rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.onerror = null }} src={getListingImage(listing)} />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-black text-neutral-900">{listing.title}</h3>
                      <p className="mt-1 font-black text-primary">{formatPrice(listing.price, listing.currency)}</p>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">{timeAgo(listing.postedAt, language)}</p>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${promoted ? "bg-primary/10 text-primary" : "bg-neutral-100 text-neutral-700"}`}>
                        {promotionLabel}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-neutral-100 pt-3">
                    <button
                      className="grid h-11 w-11 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200"
                      onClick={() => {
                        setActionSheetListing(listing)
                        setActionSheetConfirmDelete(false)
                      }}
                      type="button"
                    >
                      <MoreVertical className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <div className="grid min-h-64 place-items-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Tag className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-neutral-900">{t("dashboard.emptyAds")}</h3>
            <p className="mt-1 text-sm font-semibold text-neutral-500">{t("dashboard.emptyAdsDesc")}</p>
          </div>
          <Button onClick={() => togglePostModal(true)}>
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            {t("post.postAd")}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} size="sm" variant="secondary">
          {t("ui.back")}
        </Button>
        <span className="text-sm font-bold text-neutral-500">
          {page} / {pageCount}
        </span>
        <Button disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} size="sm" variant="secondary">
          {t("ui.next")}
        </Button>
      </div>

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title={t("dashboard.confirmDelete")} size="sm">
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleteId(null)} variant="secondary">{t("ui.cancel")}</Button>
          <Button
            onClick={async () => {
              await deleteListing(deleteId)
              setDeleteId(null)
            }}
            variant="danger"
          >
            {t("ui.delete")}
          </Button>
        </div>
      </Modal>

      {/* Mobile Action Sheet */}
      {actionSheetListing && (
        <div className="fixed inset-0 z-50 flex items-end md:hidden">
          <div 
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setActionSheetListing(null)} 
          />
          <div className="relative w-full rounded-t-3xl bg-white pb-safe pt-2 shadow-2xl animate-in slide-in-from-bottom-full duration-200 ease-out">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-200" />
            
            {actionSheetConfirmDelete ? (
              <div className="px-6 pb-6 text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-600">
                  <Trash2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-neutral-900">{t("dashboard.confirmDelete")}</h3>
                <p className="mt-2 text-sm text-neutral-500">Are you sure? This cannot be undone.</p>
                <div className="mt-8 flex gap-3">
                  <Button className="flex-1" onClick={() => setActionSheetConfirmDelete(false)} size="lg" variant="secondary">
                    {t("ui.cancel")}
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={async () => {
                      await deleteListing(actionSheetListing.id)
                      setActionSheetListing(null)
                    }} 
                    size="lg" 
                    variant="danger"
                  >
                    {t("ui.delete")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col pb-4">
                <button 
                  className="flex h-14 items-center gap-4 px-6 text-left hover:bg-neutral-50"
                  onClick={() => {
                    navigate(`/listing/${actionSheetListing.id}/edit`)
                    setActionSheetListing(null)
                  }}
                >
                  <Pencil className="h-5 w-5 text-neutral-500" />
                  <span className="flex-1 font-bold text-neutral-900">{t("ui.edit")} Ad</span>
                </button>
                <button 
                  className="flex h-14 items-center gap-4 px-6 text-left hover:bg-neutral-50"
                  onClick={() => {
                    updateListing(actionSheetListing.id, { status: "sold" })
                    setActionSheetListing(null)
                  }}
                >
                  <Check className="h-5 w-5 text-neutral-500" />
                  <span className="flex-1 font-bold text-neutral-900">{t("dashboard.markSold")}</span>
                </button>
                <button 
                  className="flex h-14 items-center gap-4 px-6 text-left hover:bg-neutral-50"
                  onClick={() => {
                    bumpListing(actionSheetListing.id)
                    setActionSheetListing(null)
                  }}
                >
                  <Rocket className="h-5 w-5 text-neutral-500" />
                  <span className="flex-1 font-bold text-neutral-900">{t("dashboard.bump")} Ad</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">Free</span>
                </button>
                <div className="mx-6 my-2 h-px bg-neutral-100" />
                <button 
                  className="flex h-14 items-center gap-4 px-6 text-left hover:bg-red-50"
                  onClick={() => setActionSheetConfirmDelete(true)}
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                  <span className="flex-1 font-bold text-red-600">{t("ui.delete")} Ad</span>
                </button>
                <div className="mt-4 px-6">
                  <Button className="w-full" onClick={() => setActionSheetListing(null)} size="lg" variant="secondary">
                    {t("ui.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
