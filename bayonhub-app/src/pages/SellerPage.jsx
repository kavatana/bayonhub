import { useEffect, useMemo, useState } from "react"
import { Helmet } from "react-helmet-async"
import { Calendar, MessageCircle, Phone, Search, Send, Shield, Star } from "lucide-react"
import ListingGrid from "../components/listing/ListingGrid"
import SellerPageSkeleton from "../components/seller/SellerPageSkeleton"
import Button from "../components/ui/Button"
import PriceRangeSlider from "../components/ui/PriceRangeSlider"
import StarRating from "../components/ui/StarRating"
import { useTranslation } from "../hooks/useTranslation"
import { CATEGORIES } from "../lib/categories"
import { formatPrice, getListingImage, telegramShare } from "../lib/utils"
import { buildLeadPayload } from "../lib/validation"
import { useListingStore } from "../store/useListingStore"
import { useAuthStore } from "../store/useAuthStore"
import { useUIStore } from "../store/useUIStore"
import { useParams } from "react-router-dom"
import PageTransition from "../components/ui/PageTransition"
import NotFoundPage from "./NotFoundPage"

function maskedPhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, "")
  return phone.replace(digits.slice(-4), "xxxx")
}

export default function SellerPage() {
  const { id } = useParams()
  const { t, language } = useTranslation()
  const listings = useListingStore((state) => state.listings)
  const loading = useListingStore((state) => state.loading)
  const fetchListings = useListingStore((state) => state.fetchListings)
  const createLead = useListingStore((state) => state.createLead)
  const following = useAuthStore((state) => state.following)
  const followSeller = useAuthStore((state) => state.followSeller)
  const unfollowSeller = useAuthStore((state) => state.unfollowSeller)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const [activeTab, setActiveTab] = useState("listings")
  const [aboutLanguage, setAboutLanguage] = useState(language)
  const [category, setCategory] = useState("all")
  const [price, setPrice] = useState([0, 20000])
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [sellerSearch, setSellerSearch] = useState("")

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const sellerListings = useMemo(() => listings.filter((listing) => listing.sellerId === id), [id, listings])
  const filteredListings = useMemo(() => sellerListings.filter((listing) => {
    const matchesCategory = category === "all" || listing.category === category
    const matchesPrice = Number(listing.price || 0) >= price[0] && Number(listing.price || 0) <= price[1]
    const query = sellerSearch.trim().toLowerCase()
    const matchesSearch =
      !query ||
      listing.title?.toLowerCase().includes(query) ||
      listing.titleKm?.includes(sellerSearch)
    return matchesCategory && matchesPrice && matchesSearch
  }), [category, price, sellerListings, sellerSearch])
  const seller = sellerListings[0]
  if (!seller && (loading || !listings.length)) return <SellerPageSkeleton />
  if (!seller && !loading) return <NotFoundPage message={t("seller.notFound")} />

  const store = seller?.store || {}
  const isFollowing = following.includes(String(seller?.sellerId || ""))
  const rating = sellerListings.length
    ? sellerListings.reduce((sum, listing) => sum + Number(listing.sellerRating || 0), 0) / sellerListings.length
    : 0
  const phone = seller?.phone || null
  const aboutText =
    aboutLanguage === "km"
      ? store.aboutKm || seller?.descriptionKm || t("ui.empty")
      : store.aboutEn || seller?.description || t("ui.empty")
  const banner = store.banner || getListingImage(seller)
  const memberYear = new Date(seller?.memberSince || seller?.postedAt || "2026-01-01T00:00:00Z").getFullYear()

  return (
    <PageTransition>
      <Helmet>
        <title>{t("seo.sellerTitle", { seller: seller?.sellerName || t("listing.seller") })}</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="relative h-44 bg-neutral-200 sm:h-[300px]">
            {seller ? <img alt={seller.sellerName} className="h-full w-full object-cover" src={banner} /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="relative px-5 pb-5">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-white bg-primary text-2xl font-black text-white shadow">
                  {store.logo ? <img alt={seller?.sellerName} className="h-full w-full object-cover" src={store.logo} /> : String(seller?.sellerName || t("listing.seller")).slice(0, 2).toUpperCase()}
                </div>
                <div className="pb-1">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">{t("seller.store")}</p>
                  <h1 className="text-3xl font-black text-neutral-900">{store.name || seller?.sellerName || t("page.notFound")}</h1>
                  {seller?.username ? (
                    <span className="mt-1 block text-sm text-neutral-400">@{seller.username.replace("@", "")}</span>
                  ) : null}
                  <p className="mt-1 text-sm font-bold text-neutral-500">{store.tagline || t("app.tagline")}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">{t("auth.verified")}</span>
                <Button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toggleAuthModal(true)
                      return
                    }
                    if (isFollowing) {
                      unfollowSeller(seller.sellerId)
                    } else {
                      followSeller(seller.sellerId)
                    }
                  }}
                  size="sm"
                  variant={isFollowing ? "secondary" : "primary"}
                >
                  {isFollowing ? t("seller.following") : t("seller.follow")}
                </Button>
              </div>
            </div>
            <div className="mt-3">
              {(seller?.seller?.createdAt || seller?.memberSince || seller?.postedAt) ? (
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <Calendar className="h-2.5 w-2.5" aria-hidden="true" />
                  {t("seller.memberSince")} {new Date(seller?.seller?.createdAt || seller?.memberSince || seller?.postedAt).getFullYear()}
                </p>
              ) : null}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-neutral-400">{t("seller.verifiedWith")}</span>
                <div className="flex items-center gap-1">
                  {seller?.phoneVerifiedAt ? (
                    <span title={t("seller.phoneVerified")} className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                      <Phone className="h-2.5 w-2.5 text-green-600" aria-hidden="true" />
                    </span>
                  ) : null}
                  {seller?.idVerifiedAt ? (
                    <span title={t("seller.idVerified")} className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                      <Shield className="h-2.5 w-2.5 text-blue-600" aria-hidden="true" />
                    </span>
                  ) : null}
                  {seller?.facebookLinked ? (
                    <span title={t("seller.facebookVerified")} className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      f
                    </span>
                  ) : null}
                  {seller?.googleLinked ? (
                    <span title={t("seller.googleVerified")} className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-500">
                      G
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl bg-neutral-50 p-4 sm:grid-cols-6">
              {[
                [sellerListings.length, t("seller.totalAds")],
                [memberYear, t("seller.memberSince")],
                [seller?.responseTime ? seller.responseTime : t("seller.responseTimeUnknown"), t("seller.avgResponse")],
                [rating.toFixed(1), t("seller.rating")],
                [seller?.followers || 0, t("seller.followers")],
                [seller?.following || 0, t("seller.following")],
              ].map(([value, label]) => (
                <div className="text-center" key={label}>
                  <strong className={`block font-black text-neutral-900 ${String(value).length > 8 ? "text-sm leading-6" : "text-xl"}`}>{value}</strong>
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-2 border-b border-neutral-200">
          {[
            ["listings", t("seller.allListings")],
            ["about", t("seller.about")],
          ].map(([value, label]) => (
            <button className={`px-4 py-3 text-sm font-black ${activeTab === value ? "border-b-2 border-primary text-primary" : "text-neutral-500"}`} key={value} onClick={() => setActiveTab(value)} type="button">
              {label}
            </button>
          ))}
        </div>

        {activeTab === "listings" ? (
          <section className="mt-6 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("filter.category")}
                <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary" onChange={(event) => setCategory(event.target.value)} value={category}>
                  <option value="all">{t("filter.allCategories")}</option>
                  {CATEGORIES.map((item) => (
                    <option key={item.id} value={item.label.en}>{item.label[language]}</option>
                  ))}
                </select>
              </label>
              <div className="mt-4">
                <PriceRangeSlider max={20000} min={0} onChange={setPrice} value={price} />
              </div>
              <p className="mt-3 text-sm font-bold text-neutral-500">
                {formatPrice(price[0])} - {formatPrice(price[1])}
              </p>
            </aside>
            <div className="grid gap-4">
              <label className="relative block">
                <span className="sr-only">{t("seller.searchListings")}</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                <input
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-primary"
                  onChange={(event) => setSellerSearch(event.target.value)}
                  placeholder={t("seller.searchListings")}
                  value={sellerSearch}
                />
              </label>
              <ListingGrid listings={filteredListings} loading={loading} />
            </div>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 inline-flex rounded-full bg-neutral-100 p-1">
                {["en", "km"].map((code) => (
                  <button className={`rounded-full px-3 py-1 text-xs font-black ${aboutLanguage === code ? "bg-primary text-white" : "text-neutral-500"}`} key={code} onClick={() => setAboutLanguage(code)} type="button">
                    {t(`lang.${code}`)}
                  </button>
                ))}
              </div>
              <p className="whitespace-pre-line leading-8 text-neutral-600">{aboutText}</p>
              <div className="mt-6">
                <h2 className="font-black text-neutral-900">{t("dashboard.businessHours")}</h2>
                <div className="mt-3 grid gap-2">
                  {Object.entries(store.hours || {}).map(([day, hours]) => (
                    <div className="flex justify-between rounded-xl bg-neutral-50 p-3 text-sm font-bold text-neutral-600" key={day}>
                      <span>{t(`day.${day}`)}</span>
                      <span>{hours.open ? `${hours.from} - ${hours.to}` : t("dashboard.closed")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="font-black text-neutral-900">{t("seller.contact")}</h2>
              <div className="mt-3 flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                <StarRating rating={rating} />
              </div>
              <div className="mt-5 grid gap-2">
                {phone ? (
                  <>
                    {phoneRevealed ? (
                      <a className="font-mono font-bold text-primary" href={`tel:${phone}`}>
                        {phone}
                      </a>
                    ) : (
                      <Button
                        onClick={() => {
                          if (seller) createLead(seller.id, buildLeadPayload("CALL", { phone }))
                          setPhoneRevealed(true)
                        }}
                      >
                        <Phone className="h-4 w-4" aria-hidden="true" />
                        {maskedPhone(phone)} - {t("listing.showPhone")}
                      </Button>
                    )}
                    <Button onClick={() => window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank")} variant="secondary">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      {t("listing.whatsapp")}
                    </Button>
                  </>
                ) : (
                  <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-500">{t("seller.phoneNotProvided")}</p>
                )}
                <Button onClick={() => telegramShare(window.location.href, store.name || seller.sellerName)} variant="secondary">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {t("listing.telegram")}
                </Button>
              </div>
              <p className="mt-5 text-sm font-semibold text-neutral-500">
                {seller?.location}
                {seller?.district ? `, ${seller.district}` : ""}
              </p>
            </aside>
          </section>
        )}
      </div>
    </PageTransition>
  )
}
