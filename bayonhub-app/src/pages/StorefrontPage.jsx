import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { 
  Calendar, 
  MessageCircle, 
  Phone, 
  Search, 
  Send, 
  Shield, 
  Star, 
  MapPin, 
  Clock,
  Filter
} from "lucide-react"
import ListingGrid from "../components/listing/ListingGrid"
import StorefrontSkeleton from "../components/storefront/StorefrontSkeleton"
import ReviewModal from "../components/storefront/ReviewModal"
import Button from "../components/ui/Button"
import StarRating from "../components/ui/StarRating"
import { useTranslation } from "../hooks/useTranslation"
import { maskPhone, sellerUrl, telegramShare, timeAgo } from "../lib/utils"
import { sanitizeText, sanitizeHtml } from "../lib/sanitize"
import { buildLeadPayload } from "../lib/validation"
import { useListingStore } from "../store/useListingStore"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"
import { useStorefrontStore } from "../store/useStorefrontStore"
import PageTransition from "../components/ui/PageTransition"
import NotFoundPage from "./NotFoundPage"

export default function StorefrontPage() {
  const { id, slug } = useParams()
  const navigate = useNavigate()
  const identifier = slug || id
  const { t, language } = useTranslation()
  
  const { 
    currentStorefront: seller, 
    loading, 
    error, 
    fetchStorefront 
  } = useStorefrontStore()
  
  const createLead = useListingStore((state) => state.createLead)
  const following = useAuthStore((state) => state.following)
  const followSeller = useAuthStore((state) => state.followSeller)
  const unfollowSeller = useAuthStore((state) => state.unfollowSeller)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  
  const [activeTab, setActiveTab] = useState("listings")
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (identifier) {
      fetchStorefront(identifier)
    }
  }, [identifier, fetchStorefront])

  // Redirect if visiting by ID but slug is available
  useEffect(() => {
    if (seller && id && !slug && seller.slug) {
      const canonical = sellerUrl(seller)
      if (window.location.pathname !== canonical) {
        navigate(canonical, { replace: true })
      }
    }
  }, [id, slug, seller, navigate])

  const filteredListings = useMemo(() => {
    if (!seller?.listings) return []
    const query = searchQuery.toLowerCase().trim()
    if (!query) return seller.listings
    return seller.listings.filter(listing => 
      listing.title.toLowerCase().includes(query) ||
      (listing.titleKm && listing.titleKm.includes(query))
    )
  }, [seller, searchQuery])

  const averageRating = useMemo(() => {
    if (!seller?.reviewsReceived?.length) return 0
    const sum = seller.reviewsReceived.reduce((acc, rev) => acc + rev.rating, 0)
    return sum / seller.reviewsReceived.length
  }, [seller])

  if (loading) return <StorefrontSkeleton />
  if (error || (!seller && !loading)) return <NotFoundPage message={t("seller.notFound")} />

  const merchant = seller.merchantProfile || {}
  const isFollowing = following.includes(seller.id)
  const banner = merchant.bannerKey || seller.bannerUrl || ""
  const logo = merchant.logoKey || seller.avatarUrl || ""
  const memberYear = new Date(seller.createdAt).getFullYear()

  return (
    <PageTransition>
      <Helmet>
        <title>{t("seo.sellerTitle", { seller: seller.name })}</title>
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header Section */}
        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xl">
          <div className="relative h-48 sm:h-[350px] overflow-hidden group">
            {banner ? (
              <img 
                alt={seller.name} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                src={banner} 
              />
            ) : (
              <div className="relative w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 bg-bayon-sketch bg-bayon-sketch-20">
                <div className="absolute inset-0 bg-black/10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          <div className="relative px-6 pb-8">
            <div className="-mt-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
                <div className="relative group">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-8 border-white bg-white shadow-2xl transition-transform duration-300 group-hover:scale-105">
                    {logo ? (
                      <img alt={seller.name} className="h-full w-full object-cover" src={logo} />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-primary text-4xl font-black text-white">
                        {seller.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {seller.verificationTier === "IDENTITY" && (
                    <div className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-500 shadow-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <h1 className="text-4xl font-black text-neutral-900 leading-tight">
                      {sanitizeText(merchant.storeName || seller.name)}
                    </h1>
                    {seller.verificationTier !== "NONE" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 border border-blue-100 uppercase tracking-wider">
                        <Shield className="h-3 w-3" />
                        {t("auth.verified")}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-neutral-500 max-w-xl">
                    {sanitizeText(merchant.tagline || t("app.tagline"))}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-bold text-neutral-400 mt-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {t("seller.memberSince")} {memberYear}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      {averageRating.toFixed(1)} ({seller.reviewsReceived?.length || 0} {t("seller.rating")})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
                <Button 
                  size="lg"
                  variant={isFollowing ? "secondary" : "primary"}
                  onClick={() => {
                    if (!isAuthenticated) return toggleAuthModal(true)
                    isFollowing ? unfollowSeller(seller.id) : followSeller(seller.id)
                  }}
                  className="px-8"
                >
                  {isFollowing ? t("seller.following") : t("seller.follow")}
                </Button>
                {isAuthenticated && seller.id !== useAuthStore.getState().user?.id && (
                  <Button size="lg" variant="outline" onClick={() => setReviewModalOpen(true)}>
                    <Star className="h-5 w-5 mr-2" />
                    {t("review.submit")}
                  </Button>
                )}
              </div>
            </div>

            {/* Stats Bar */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 rounded-3xl bg-neutral-50/50 border border-neutral-100 p-6 backdrop-blur-sm">
              <div className="text-center p-2">
                <span className="block text-2xl font-black text-neutral-900">{seller.listings?.length || 0}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t("seller.totalAds")}</span>
              </div>
              <div className="text-center p-2">
                <span className="block text-2xl font-black text-neutral-900">{seller.followersCount || 0}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t("seller.followers")}</span>
              </div>
              <div className="text-center p-2">
                <span className="block text-2xl font-black text-neutral-900">{seller.reviewsReceived?.length || 0}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t("seller.rating")}</span>
              </div>
              <div className="text-center p-2">
                <span className="block text-2xl font-black text-neutral-900">{seller.responseTime || t("listing.underHour")}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t("seller.avgResponse")}</span>
              </div>
              <div className="hidden lg:block text-center p-2">
                <span className="block text-2xl font-black text-neutral-900">100%</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{t("ui.success")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Content Tabs */}
        <div className="mt-8">
          <div className="flex items-center gap-1 border-b border-neutral-200">
            {[
              { id: "listings", label: t("seller.allListings"), icon: Filter },
              { id: "reviews", label: t("seller.rating"), icon: Star },
              { id: "about", label: t("seller.about"), icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-black transition-all ${
                  activeTab === tab.id 
                    ? "border-b-4 border-primary text-primary" 
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === "listings" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("seller.searchListings")}
                      className="w-full h-14 pl-12 pr-4 rounded-2xl border border-neutral-200 bg-white font-bold outline-none focus:border-primary shadow-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-2xl">
                    <span className="text-sm font-black text-neutral-500">
                      {filteredListings.length} {t("listing.resultsFound")}
                    </span>
                  </div>
                </div>
                <ListingGrid listings={filteredListings} loading={false} />
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                <div className="space-y-6">
                  {seller.reviewsReceived?.length > 0 ? (
                    seller.reviewsReceived.map((review) => (
                      <div key={review.id} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-100">
                              {review.reviewer?.avatarUrl ? (
                                <img src={review.reviewer.avatarUrl} alt={review.reviewer.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full grid place-items-center bg-neutral-200 text-neutral-500 font-bold">
                                  {review.reviewer?.name?.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-black text-neutral-900">{sanitizeText(review.reviewer?.name)}</h4>
                              <p className="text-xs font-bold text-neutral-400">{timeAgo(review.createdAt, language)}</p>
                            </div>
                          </div>
                          <StarRating rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <div className="mt-4 p-4 rounded-2xl bg-neutral-50 text-neutral-700 font-semibold leading-relaxed">
                            {sanitizeText(review.comment)}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
                      <Star className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-xl font-black text-neutral-900">{t("review.noReviews")}</h3>
                      <p className="text-neutral-500 font-bold mt-2">{t("review.placeholder")}</p>
                    </div>
                  )}
                </div>

                <aside className="space-y-6">
                  <div className="rounded-3xl bg-amber-50 border border-amber-100 p-8 text-center">
                    <div className="text-6xl font-black text-amber-500 mb-2">{averageRating.toFixed(1)}</div>
                    <StarRating rating={averageRating} className="justify-center mb-4" size="lg" />
                    <p className="text-sm font-black text-amber-700 uppercase tracking-widest">
                      {t("review.count", { count: seller.reviewsReceived?.length || 0 })}
                    </p>
                  </div>
                  
                  <div className="rounded-3xl border border-neutral-200 bg-white p-6 space-y-4 shadow-sm">
                    <h3 className="font-black text-neutral-900">{t("review.rating")}</h3>
                    {[5, 4, 3, 2, 1].map((s) => {
                      const count = seller.reviewsReceived?.filter(r => r.rating === s).length || 0
                      const percent = seller.reviewsReceived?.length ? (count / seller.reviewsReceived.length) * 100 : 0
                      return (
                        <div key={s} className="flex items-center gap-3">
                          <span className="w-3 text-xs font-black text-neutral-500">{s}</span>
                          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-8 text-xs font-black text-neutral-400 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </aside>
              </div>
            )}

            {activeTab === "about" && (
              <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
                <div className="space-y-8">
                  <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                    <h2 className="text-2xl font-black text-neutral-900 mb-6 flex items-center gap-2">
                      <Shield className="h-6 w-6 text-primary" />
                      {t("seller.about")}
                    </h2>
                    <div 
                      className="prose prose-neutral max-w-none font-semibold text-neutral-600 leading-8"
                      dangerouslySetInnerHTML={{ 
                        __html: sanitizeHtml(merchant.aboutUs || merchant.aboutUsKm || seller.bio || t("ui.empty")) 
                      }}
                    />
                  </div>

                  {merchant.businessHours && (
                    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
                      <h2 className="text-2xl font-black text-neutral-900 mb-6 flex items-center gap-2">
                        <Clock className="h-6 w-6 text-primary" />
                        {t("dashboard.businessHours")}
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Object.entries(merchant.businessHours).map(([day, hours]) => (
                          <div key={day} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                            <span className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">{t(`day.${day}`)}</span>
                            <span className="font-black text-neutral-800">
                              {hours.open ? `${hours.from} - ${hours.to}` : t("dashboard.closed")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <aside className="space-y-6">
                  <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm space-y-6">
                    <h3 className="text-xl font-black text-neutral-900">{t("seller.contact")}</h3>
                    
                    <div className="space-y-3">
                      {seller.phone ? (
                        <>
                          <Button 
                            fullWidth 
                            size="lg"
                            variant={phoneRevealed ? "outline" : "primary"}
                            onClick={() => {
                              if (!phoneRevealed) {
                                createLead(seller.id, buildLeadPayload("CALL", { phone: seller.phone }))
                              }
                              setPhoneRevealed(!phoneRevealed)
                            }}
                          >
                            <Phone className="h-5 w-5 mr-2" />
                            {phoneRevealed ? seller.phone : `${maskPhone(seller.phone)} · ${t("listing.tapToReveal")}`}
                          </Button>
                          <Button 
                            fullWidth 
                            size="lg" 
                            variant="secondary"
                            onClick={() => window.open(`https://wa.me/${seller.phone.replace(/\D/g, "")}`, "_blank")}
                          >
                            <MessageCircle className="h-5 w-5 mr-2" />
                            WhatsApp
                          </Button>
                        </>
                      ) : (
                        <div className="p-4 rounded-2xl bg-neutral-50 text-center text-sm font-black text-neutral-500 border border-neutral-100">
                          {t("seller.phoneNotProvided")}
                        </div>
                      )}
                      
                      {merchant.telegramHandle && (
                        <Button 
                          fullWidth 
                          size="lg" 
                          variant="secondary"
                          onClick={() => window.open(`https://t.me/${merchant.telegramHandle.replace("@", "")}`, "_blank")}
                        >
                          <Send className="h-5 w-5 mr-2" />
                          Telegram
                        </Button>
                      )}
                    </div>

                    <div className="pt-4 border-t border-neutral-100 space-y-4">
                      {seller.province && (
                        <div className="flex items-start gap-3">
                          <div className="mt-1 h-8 w-8 grid place-items-center rounded-full bg-neutral-100 text-neutral-500">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-black text-neutral-400 uppercase tracking-widest">{t("filter.location")}</span>
                            <span className="font-black text-neutral-800">{seller.province}{seller.district ? `, ${seller.district}` : ""}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-neutral-900 p-8 text-white space-y-4">
                    <h3 className="text-xl font-black">{t("listing.share")}</h3>
                    <p className="text-neutral-400 text-sm font-bold">{t("footer.tagline")}</p>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="primary" 
                        className="bg-blue-600 hover:bg-blue-700 border-none flex-1"
                        onClick={() => telegramShare(window.location.href, merchant.storeName || seller.name)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Telegram
                      </Button>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewModal 
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        sellerId={seller.id}
      />
    </PageTransition>
  )
}
