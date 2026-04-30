import React, { Suspense, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Check, Pencil, PlusCircle, Rocket, Trash2 } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { getPromotionState, isPromotedListing, PROMOTION_LABELS } from "../../lib/promotionStates"
import { formatPrice, getListingImage, getListingSlug, timeAgo } from "../../lib/utils"
import { useAuthStore } from "../../store/useAuthStore"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"
import Modal from "../ui/Modal"

const EmptyStateOrb = React.lazy(() => import("../three/EmptyStateOrb"))

const statuses = ["active", "pending", "sold", "expired", "removed"]
const perPage = 10

export default function MyAdsTab() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const listings = useListingStore((state) => state.listings)
  const updateListing = useListingStore((state) => state.updateListing)
  const deleteListing = useListingStore((state) => state.deleteListing)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const [activeStatus, setActiveStatus] = useState("active")
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState(null)
  const userId = user?.id
  const myListings = useMemo(
    () =>
      listings.filter((listing) => {
        const ownerMatch = !userId || listing.sellerId === userId || listing.sellerId === "local-demo-seller"
        return ownerMatch && (listing.status || "active") === activeStatus
      }),
    [activeStatus, listings, userId],
  )
  const pageCount = Math.max(1, Math.ceil(myListings.length / perPage))
  const pageItems = myListings.slice((page - 1) * perPage, page * perPage)

  function bumpListing(id) {
    updateListing(id, { updatedAt: new Date().toISOString(), postedAt: new Date().toISOString() })
  }

  return (
    <div className="space-y-4">
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
                        <img alt={listing.title} className="h-14 w-16 rounded-lg object-cover" src={getListingImage(listing)} />
                      </td>
                      <td className="max-w-56 p-3 font-bold text-neutral-900">
                        <Link className="hover:text-primary hover:underline" to={`/listing/${listing.id}/${getListingSlug(listing)}`}>
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
                          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100" onClick={() => navigate(`/listing/${listing.id}/edit`)} type="button">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("ui.edit")}</span>
                          </button>
                          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100" onClick={() => updateListing(listing.id, { status: "sold" })} type="button">
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("dashboard.markSold")}</span>
                          </button>
                          <button className="grid h-9 w-9 place-items-center rounded-lg hover:bg-neutral-100" onClick={() => bumpListing(listing.id)} type="button">
                            <Rocket className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("dashboard.bump")}</span>
                          </button>
                          <button className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-50" onClick={() => setDeleteId(listing.id)} type="button">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t("ui.delete")}</span>
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
                    <img alt={listing.title} className="h-20 w-24 rounded-xl object-cover" src={getListingImage(listing)} />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-black text-neutral-900">{listing.title}</h3>
                      <p className="mt-1 font-black text-primary">{formatPrice(listing.price, listing.currency)}</p>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">{timeAgo(listing.postedAt, language)}</p>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${promoted ? "bg-primary/10 text-primary" : "bg-neutral-100 text-neutral-700"}`}>
                        {promotionLabel}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Button aria-label={t("ui.edit")} onClick={() => navigate(`/listing/${listing.id}/edit`)} size="sm" variant="secondary"><Pencil className="h-4 w-4" aria-hidden="true" /></Button>
                    <Button aria-label={t("dashboard.markSold")} onClick={() => updateListing(listing.id, { status: "sold" })} size="sm" variant="secondary"><Check className="h-4 w-4" aria-hidden="true" /></Button>
                    <Button aria-label={t("dashboard.bump")} onClick={() => bumpListing(listing.id)} size="sm" variant="secondary"><Rocket className="h-4 w-4" aria-hidden="true" /></Button>
                    <Button aria-label={t("ui.delete")} onClick={() => setDeleteId(listing.id)} size="sm" variant="danger"><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <div className="grid min-h-64 place-items-center gap-4 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <Suspense fallback={<div className="h-32 w-32 rounded-full bg-neutral-100 animate-pulse dark:bg-neutral-800" />}>
            <EmptyStateOrb />
          </Suspense>
          <p className="font-bold text-neutral-500">{t("dashboard.emptyAds")}</p>
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
    </div>
  )
}
