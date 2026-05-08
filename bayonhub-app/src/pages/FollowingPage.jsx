import { useEffect } from "react"
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"
import { Store } from "lucide-react"

import ListingCard from "../components/listing/ListingCard"
import PageTransition from "../components/ui/PageTransition"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import { useTranslation } from "../hooks/useTranslation"
import { sellerUrl } from "../lib/utils"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"
import { useUserStore } from "../store/useUserStore"

export default function FollowingPage() {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const followingSellers = useUserStore((state) => state.followingSellers)
  const loading = useUserStore((state) => state.profileLoading)
  const error = useUserStore((state) => state.error)
  const fetchFollowing = useUserStore((state) => state.fetchFollowing)
  const unfollowSeller = useUserStore((state) => state.unfollowSeller)

  useEffect(() => {
    if (!isAuthenticated) {
      toggleAuthModal(true)
      return
    }
    fetchFollowing()
  }, [fetchFollowing, isAuthenticated, toggleAuthModal])

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("social.following")} | BayonHub</title>
      </Helmet>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">{t("social.following")}</h1>
          <p className="mt-1 text-sm font-bold text-neutral-500">{t("social.newListing")}</p>
        </div>
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
      {loading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <div className="h-36 animate-pulse rounded-2xl bg-neutral-100" key={item} />
          ))}
        </div>
      ) : followingSellers.length ? (
        <div className="grid gap-4">
          {followingSellers.map((item) => {
            const seller = item.seller || item
            const sellerIsPlusMember = Boolean(seller.isPlusMember || seller.isLifetimePlus)
            const sellerVerified = Boolean(seller.isVerifiedSeller || seller.verificationTier === "IDENTITY")
            return (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm" key={item.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link className="flex min-w-0 items-center gap-3" to={sellerUrl(seller)}>
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-black text-primary">
                      {seller.avatarUrl ? <img alt={seller.name} className="h-full w-full object-cover" src={seller.avatarUrl} /> : seller.name?.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-lg font-black text-neutral-900">{seller.name}</span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {sellerIsPlusMember ? <Badge className="origin-left scale-75" type="plus" /> : null}
                        {sellerVerified ? <Badge className="origin-left scale-75" type="verified" /> : null}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-neutral-500">
                        <Store className="h-3 w-3" aria-hidden="true" />
                        {Number(seller.followersCount || 0).toLocaleString()} {t("social.followers")}
                      </span>
                    </span>
                  </Link>
                  <Button onClick={() => unfollowSeller(seller.id)} size="sm" type="button" variant="secondary">
                    {t("social.unfollow")}
                  </Button>
                </div>
                {seller.latestListing ? (
                  <div className="mt-4 max-w-sm">
                    <ListingCard listing={seller.latestListing} />
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
          <p className="font-black text-neutral-500">{t("notif.empty")}</p>
        </div>
      )}
    </PageTransition>
  )
}
