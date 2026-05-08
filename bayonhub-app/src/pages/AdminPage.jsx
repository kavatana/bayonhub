import { useEffect, useMemo, useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Check, ShieldCheck, UploadCloud, X } from "lucide-react"
import toast from "react-hot-toast"

import client, { API_BASE_URL, hasApiBackend } from "../api/client"
import { useTranslation } from "../hooks/useTranslation"
import { useAuthStore } from "../store/useAuthStore"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import PageTransition from "../components/ui/PageTransition"

const TABS = ["listings", "reports", "users", "kyc", "import", "stats"]

function parseCsv(input) {
  const rows = input.trim().split(/\r?\n/).map((line) => line.split(","))
  const [headers = [], ...records] = rows
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header.trim(), record[index]?.trim() || ""])))
}

function rowToListing(row) {
  const facets = {}
  if (row.facet_make) facets.make = row.facet_make
  if (row.facet_model) facets.model = row.facet_model
  if (row.facet_year) facets.year = Number(row.facet_year)
  return {
    title: row.title,
    titleKm: row.titleKm || undefined,
    description: row.description,
    price: Number(row.price),
    currency: row.currency === "KHR" ? "KHR" : "USD",
    categorySlug: row.categorySlug,
    subcategorySlug: row.subcategorySlug || undefined,
    province: row.province,
    district: row.district || undefined,
    condition: row.condition,
    images: [row.imageUrl1, row.imageUrl2, row.imageUrl3].filter(Boolean),
    sellerName: row.sellerName,
    sellerPhone: row.sellerPhone,
    facets: Object.keys(facets).length ? facets : undefined,
  }
}

function tabLabel(t, tab) {
  if (tab === "reports") return t("admin.reports")
  if (tab === "users") return t("admin.users")
  if (tab === "kyc") return t("admin.kyc")
  if (tab === "import") return t("admin.import")
  if (tab === "stats") return t("admin.stats")
  return t("admin.listings")
}

export function LegacyAdminPage() {
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState("listings")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [listings, setListings] = useState([])
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [kycApplications, setKycApplications] = useState([])
  const [stats, setStats] = useState(null)
  const [importResult, setImportResult] = useState(null)

  const pageClass = language === "km" ? "font-khmer leading-8" : ""

  useEffect(() => {
    if (user?.role !== "ADMIN" || !hasApiBackend()) return undefined
    let cancelled = false
    async function loadAdminData() {
      setLoading(true)
      setError("")
      try {
        const [listingResponse, reportResponse, userResponse, kycResponse, statsResponse] = await Promise.all([
          client.get("/api/admin/listings"),
          client.get("/api/admin/reports"),
          client.get("/api/admin/users"),
          client.get("/api/admin/kyc"),
          client.get("/api/admin/stats"),
        ])
        if (cancelled) return
        setListings(listingResponse.data.listings || [])
        setReports(reportResponse.data.reports || [])
        setUsers(userResponse.data.users || [])
        setKycApplications(kycResponse.data.applications || [])
        setStats(statsResponse.data)
      } catch {
        if (!cancelled) setError(t("admin.loadError"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAdminData()
    return () => {
      cancelled = true
    }
  }, [t, user?.role])

  const empty = useMemo(() => {
    if (activeTab === "reports") return reports.length === 0
    if (activeTab === "users") return users.length === 0
    if (activeTab === "kyc") return kycApplications.length === 0
    if (activeTab === "stats") return !stats
    if (activeTab === "import") return false
    return listings.length === 0
  }, [activeTab, kycApplications.length, listings.length, reports.length, stats, users.length])

  if (user?.role !== "ADMIN") return <Navigate replace to="/" />

  async function updateListing(id, status) {
    await client.put(`/api/admin/listings/${id}/status`, { status })
    setListings((current) => current.map((listing) => (listing.id === id ? { ...listing, status } : listing)))
  }

  async function updateReport(id, status, listingStatus) {
    await client.put(`/api/admin/reports/${id}`, { status, listingStatus })
    setReports((current) => current.filter((report) => report.id !== id))
  }

  async function updateUser(id, payload) {
    if (payload.role) {
      const response = await client.put(`/api/admin/users/${id}/role`, { role: payload.role })
      setUsers((current) => current.map((item) => (item.id === id ? response.data.user : item)))
      return
    }
    const response = await client.put(`/api/admin/users/${id}/verify`, { verificationTier: payload.verificationTier })
    setUsers((current) => current.map((item) => (item.id === id ? response.data.user : item)))
  }

  async function reviewKyc(id, status) {
    await client.put(`/api/admin/kyc/${id}`, { status })
    setKycApplications((current) => current.filter((item) => item.id !== id))
  }

  async function importCsv(file) {
    if (!file) return
    const rows = parseCsv(await file.text())
    const response = await client.post("/api/admin/listings/import", {
      listings: rows.map(rowToListing),
    })
    setImportResult(response.data)
    toast.success(t("admin.importDone"))
  }

  return (
    <main className={`mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 ${pageClass}`}>
      <Helmet>
        <title>{t("admin.title")} | BayonHub</title>
      </Helmet>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-950">{t("admin.title")}</h1>
          <p className="text-sm font-semibold text-neutral-500">{t("admin.subtitle")}</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <ShieldCheck aria-hidden="true" className="h-4 w-4" />
          {t("admin.adminOnly")}
        </span>
      </header>

      <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 pb-2">
        {TABS.map((tab) => (
          <button
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${activeTab === tab ? "bg-primary text-white" : "bg-white text-neutral-700"}`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tabLabel(t, tab)}
          </button>
        ))}
      </div>

      {loading ? <p className="rounded-xl bg-white p-4 text-sm font-bold text-neutral-500">{t("ui.loading")}</p> : null}
      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <h3 className="mb-1 text-base font-black">{t("ui.error")}</h3>
          <p>{error}</p>
        </div>
      ) : null}
      {!loading && empty ? <p className="rounded-xl bg-white p-4 text-sm font-bold text-neutral-500">{t("ui.empty")}</p> : null}

      {activeTab === "listings" && listings.length ? (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr><th className="p-3">{t("listing.title")}</th><th className="p-3">{t("post.category")}</th><th className="p-3">{t("admin.status")}</th><th className="p-3">{t("admin.actions")}</th></tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr className="border-t border-neutral-100" key={listing.id}>
                  <td className="p-3 font-bold">{listing.title}</td>
                  <td className="p-3">{listing.categorySlug}</td>
                  <td className="p-3">{listing.status}</td>
                  <td className="flex gap-2 p-3">
                    <Button onClick={() => updateListing(listing.id, "ACTIVE")} size="sm"><Check aria-hidden="true" className="h-4 w-4" />{t("admin.approve")}</Button>
                    <Button onClick={() => updateListing(listing.id, "REMOVED")} size="sm" variant="danger"><X aria-hidden="true" className="h-4 w-4" />{t("admin.remove")}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {activeTab === "reports" && reports.length ? (
        <div className="grid gap-3">
          {reports.map((report) => (
            <article className="rounded-xl border border-neutral-200 bg-white p-4" key={report.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {report.reporter?.avatarUrl ? (
                    <img alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" src={report.reporter.avatarUrl} />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-neutral-100 font-bold text-neutral-500">
                      {report.reporter?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-black text-neutral-900">{report.reporter?.name || t("ui.anonymous")}</p>
                    <p className="text-xs font-bold text-neutral-500">{report.reporter?.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => updateReport(report.id, "DISMISSED")}
                    size="sm"
                    variant="outline"
                  >
                    {t("admin.dismiss")}
                  </Button>
                  <Button
                    onClick={() => updateReport(report.id, "RESOLVED", "REMOVED")}
                    size="sm"
                    variant="danger"
                  >
                    {t("admin.resolve")} & {t("admin.remove")}
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 rounded-xl bg-neutral-50 p-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{t("admin.reportReason")}</label>
                    <p className="text-sm font-bold text-red-600">{t(`report.reason.${report.reason}`)}</p>
                  </div>
                  {report.detail && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{t("admin.reportDetail")}</label>
                      <p className="text-sm font-medium text-neutral-700">{report.detail}</p>
                    </div>
                  )}
                  {report.contactEmail && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{t("admin.reporterEmail")}</label>
                      <p className="text-sm font-medium text-neutral-700">{report.contactEmail}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{t("admin.listings")}</label>
                    <Link
                      className="group flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                      to={`/listing/${report.listing?.id}`}
                    >
                      {report.listing?.title || report.listingTitle || t("ui.untitled")}
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-black text-neutral-600">
                        {report.listing?.status}
                      </span>
                    </Link>
                  </div>
                  {report.evidenceUrl && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">{t("admin.reportEvidence")}</label>
                      <div className="mt-1 flex gap-2">
                        <a href={report.evidenceUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            alt={t("admin.evidence")}
                            className="h-16 w-16 rounded-lg border border-neutral-200 object-cover hover:opacity-80 transition-opacity"
                            src={report.evidenceUrl}
                          />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(report.userAgent || report.reporterSessionId) && (
                <div className="mt-3 border-t border-neutral-100 pt-3">
                  <details className="cursor-pointer group">
                    <summary className="text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-600 transition-colors list-none flex items-center gap-1">
                      {t("admin.systemMetadata")}
                      <span className="inline-block transition-transform group-open:rotate-90">›</span>
                    </summary>
                    <div className="mt-2 space-y-1 rounded-lg bg-neutral-50/50 p-2 text-[10px] font-mono text-neutral-500">
                      {report.userAgent && <p className="break-all"><span className="font-bold">UA:</span> {report.userAgent}</p>}
                      {report.reporterSessionId && <p><span className="font-bold">Session:</span> {report.reporterSessionId}</p>}
                    </div>
                  </details>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === "users" && users.length ? (
        <div className="grid gap-3">
          {users.map((item) => (
            <article className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
              <div><h2 className="font-black text-neutral-900">{item.name}</h2><p className="text-sm font-semibold text-neutral-500">{item.role} · {item.verificationTier}</p></div>
              <div className="flex gap-2">
                <Button onClick={() => updateUser(item.id, { role: "ADMIN" })} size="sm">{t("admin.promote")}</Button>
                <Button onClick={() => updateUser(item.id, { verificationTier: "IDENTITY" })} size="sm" variant="secondary">{t("admin.setVerified")}</Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === "kyc" && kycApplications.length ? (
        <div className="grid gap-3">
          {kycApplications.map((application) => (
            <article className="rounded-xl border border-neutral-200 bg-white p-4" key={application.id}>
              <h2 className="font-black text-neutral-900">{application.fullName}</h2>
              <p className="text-sm font-semibold text-neutral-500">{application.idType} · {application.idNumber}</p>
              <div className="mt-3 flex gap-3 overflow-x-auto">
                <img alt={t("kyc.uploadId")} className="h-28 w-40 rounded-xl object-cover" loading="lazy" src={`${API_BASE_URL}/api/admin/kyc/${application.id}/document/idFront`} />
                {application.idBackKey ? <img alt={t("kyc.uploadIdBack")} className="h-28 w-40 rounded-xl object-cover" loading="lazy" src={`${API_BASE_URL}/api/admin/kyc/${application.id}/document/idBack`} /> : null}
                {application.selfieKey ? <img alt={t("kyc.uploadSelfie")} className="h-28 w-40 rounded-xl object-cover" loading="lazy" src={`${API_BASE_URL}/api/admin/kyc/${application.id}/document/selfie`} /> : null}
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => reviewKyc(application.id, "APPROVED")} size="sm">{t("admin.approve")}</Button>
                <Button onClick={() => reviewKyc(application.id, "REJECTED")} size="sm" variant="danger">{t("admin.reject")}</Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {activeTab === "import" ? (
        <section className="grid place-items-center rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <UploadCloud aria-hidden="true" className="h-10 w-10 text-primary" />
          <h2 className="mt-3 font-black text-neutral-900">{t("admin.importCsv")}</h2>
          <label className="mt-4 inline-flex cursor-pointer rounded-full bg-primary px-5 py-3 text-sm font-black text-white">
            {t("admin.chooseCsv")}
            <input accept=".csv,text/csv" className="hidden" onChange={(event) => importCsv(event.target.files?.[0])} type="file" />
          </label>
          {importResult ? <p className="mt-4 text-sm font-bold text-neutral-600">{t("admin.imported")}: {importResult.imported} · {t("admin.failed")}: {importResult.failed}</p> : null}
        </section>
      ) : null}

      {activeTab === "stats" && stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [t("admin.totalListings"), stats.totalListings],
            [t("admin.totalUsers"), stats.totalUsers],
            [t("admin.totalLeads"), stats.totalLeads],
            [t("admin.newToday"), stats.newToday],
          ].map(([label, value]) => (
            <div className="rounded-xl border border-neutral-200 bg-white p-4" key={label}>
              <p className="text-xs font-black uppercase tracking-wide text-neutral-400">{label}</p>
              <strong className="mt-2 block text-3xl font-black text-neutral-950">{value || 0}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  )
}

const d1Tabs = ["dashboard", "listings", "users", "reports", "payments", "giftPlus", "featured", "analytics"]

function d1TabLabel(tab, t) {
  if (tab === "dashboard") return t("admin.dashboard")
  if (tab === "listings") return t("admin.listings")
  if (tab === "users") return t("admin.users")
  if (tab === "reports") return t("admin.reports")
  if (tab === "payments") return t("admin.payments")
  if (tab === "giftPlus") return t("gift.giftPlus")
  if (tab === "featured") return t("admin.featured")
  return t("admin.analytics")
}

function d1RouteTab(pathname) {
  if (pathname === "/admin/payments") return "payments"
  if (pathname === "/admin/gift-plus") return "giftPlus"
  return null
}

function d1TabPath(tab) {
  if (tab === "payments") return "/admin/payments"
  if (tab === "giftPlus") return "/admin/gift-plus"
  return "/admin"
}

function d1ListingImage(listing) {
  const image = listing?.images?.[0]
  if (typeof image === "string") return image
  return image?.thumbUrl || image?.url || ""
}

function d1StatusLabel(status, t) {
  const normalized = String(status || "").toLowerCase()
  if (normalized === "active") return t("listing.status.active")
  if (normalized === "sold") return t("listing.status.sold")
  if (normalized === "pending") return t("listing.status.pending")
  if (normalized === "rejected") return t("listing.status.rejected")
  if (normalized === "flagged") return t("listing.status.flagged")
  if (normalized === "hidden") return t("listing.status.hidden")
  if (normalized === "deleted") return t("listing.status.deleted")
  if (normalized === "expired") return t("dashboard.expired")
  if (normalized === "removed") return t("dashboard.removed")
  return t("ui.empty")
}

function adminDate(value) {
  if (!value) return ""
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function paymentStatusLabel(status, t) {
  if (status === "APPROVED") return t("payment.approved")
  if (status === "REJECTED") return t("payment.rejected")
  return t("payment.pending")
}

function giftTypeLabel(type, t) {
  if (type === "lifetime") return t("gift.lifetime")
  return t("gift.oneMonth")
}

function giftStatusLabel(status, t) {
  if (status === "revoked") return t("gift.revoked")
  return t("gift.active")
}

function d1BucketHeight(value, max) {
  if (!max || !value) return "h-2"
  const ratio = value / max
  if (ratio > 0.85) return "h-24"
  if (ratio > 0.7) return "h-20"
  if (ratio > 0.55) return "h-16"
  if (ratio > 0.4) return "h-12"
  if (ratio > 0.25) return "h-8"
  return "h-4"
}

function D1BarSeries({ rows, title }) {
  const max = Math.max(...rows.map((row) => Number(row.count || 0)), 0)
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-black text-neutral-900">{title}</h3>
      <div className="mt-4 flex h-28 items-end gap-2">
        {rows.map((row) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={row.day}>
            <div className={`w-full rounded-t bg-primary ${d1BucketHeight(Number(row.count || 0), max)}`} />
            <span className="text-[10px] font-bold text-neutral-400">{Number(row.count || 0)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AdminPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState("dashboard")
  const selectedTab = d1RouteTab(location.pathname) || activeTab
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [reload, setReload] = useState(0)
  const [listingSearch, setListingSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("PENDING")
  const [giftSearch, setGiftSearch] = useState("")
  const [giftUsers, setGiftUsers] = useState([])
  const [giftNote, setGiftNote] = useState("")
  const [period, setPeriod] = useState("7d")
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [approvePayment, setApprovePayment] = useState(null)
  const [rejectPayment, setRejectPayment] = useState(null)
  const [rejectNote, setRejectNote] = useState("")
  const [previewImage, setPreviewImage] = useState("")
  const [data, setData] = useState({
    dashboard: null,
    listings: [],
    reports: [],
    users: [],
    payments: [],
    giftLog: [],
    featured: [],
    analytics: null,
  })

  useEffect(() => {
    if (!user?.isAdmin || !hasApiBackend()) return undefined
    let cancelled = false
    async function loadAdminData() {
      setLoading(true)
      setError("")
      try {
        const [dashboard, listings, users, reports, payments, featured, analytics] = await Promise.all([
          client.get("/api/admin/dashboard"),
          client.get("/api/admin/listings", { params: { limit: 20, search: listingSearch || undefined } }),
          client.get("/api/admin/users", { params: { limit: 20, search: userSearch || undefined } }),
          client.get("/api/admin/reports", { params: { limit: 20, status: "PENDING" } }),
          client.get("/api/admin/payments", { params: { limit: 20, status: paymentStatus } }),
          client.get("/api/admin/featured"),
          client.get("/api/admin/analytics", { params: { period } }),
        ])
        const giftLog = selectedTab === "giftPlus"
          ? await client.get("/api/admin/gift-plus/log", { params: { limit: 20 } })
          : null
        if (cancelled) return
        setData({
          dashboard: dashboard.data,
          listings: listings.data.data || listings.data.listings || [],
          users: users.data.data || users.data.users || [],
          reports: reports.data.data || reports.data.reports || [],
          payments: payments.data.data || [],
          giftLog: giftLog?.data?.data || [],
          featured: featured.data.data || [],
          analytics: analytics.data,
        })
      } catch {
        if (!cancelled) setError(t("admin.loadError"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAdminData()
    return () => {
      cancelled = true
    }
  }, [listingSearch, paymentStatus, period, reload, selectedTab, t, user?.isAdmin, userSearch])

  useEffect(() => {
    if (!user?.isAdmin || !hasApiBackend() || selectedTab !== "giftPlus") return undefined
    let cancelled = false
    async function loadGiftUsers() {
      const query = giftSearch.trim()
      if (query.length < 2) {
        if (!cancelled) setGiftUsers([])
        return
      }
      try {
        const response = await client.get("/api/admin/users/search", { params: { q: query } })
        if (!cancelled) setGiftUsers(response.data.data || [])
      } catch {
        if (!cancelled) setGiftUsers([])
      }
    }
    const timeout = window.setTimeout(loadGiftUsers, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [giftSearch, selectedTab, user?.isAdmin])

  if (!user?.isAdmin) return <Navigate replace to="/" />
  if (!hasApiBackend()) {
    return (
      <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <p className="rounded-2xl bg-neutral-50 p-6 text-center font-bold text-neutral-500">{t("admin.adminOnly")}</p>
      </PageTransition>
    )
  }

  async function runAction(action) {
    try {
      await action()
      toast.success(t("ui.success"))
      setReload((value) => value + 1)
    } catch {
      toast.error(t("ui.error"))
    }
  }

  function toggleSelection(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function loadUserProfile(id) {
    try {
      const response = await client.get(`/api/admin/users/${id}`)
      setSelectedUser(response.data)
    } catch {
      toast.error(t("ui.error"))
    }
  }

  async function approveSelectedPayment() {
    if (!approvePayment) return
    await runAction(() => client.post(`/api/admin/payments/${approvePayment.id}/approve`))
    setApprovePayment(null)
  }

  async function rejectSelectedPayment(event) {
    event.preventDefault()
    if (!rejectPayment || !rejectNote.trim()) return
    await runAction(() => client.post(`/api/admin/payments/${rejectPayment.id}/reject`, { reviewNote: rejectNote.trim() }))
    setRejectPayment(null)
    setRejectNote("")
  }

  async function giftSelectedUser(userId, giftType) {
    await runAction(() => client.post("/api/admin/gift-plus", { userId, giftType, note: giftNote.trim() || undefined }))
    setGiftNote("")
    setReload((value) => value + 1)
  }

  async function revokeSelectedUser(userId) {
    await runAction(() => client.post(`/api/admin/gift-plus/${userId}/revoke`, { note: giftNote.trim() || undefined }))
    setGiftNote("")
    setReload((value) => value + 1)
  }

  const stats = data.dashboard?.stats || {}
  const statCards = [
    [t("admin.totalUsers"), stats.totalUsers || 0],
    [t("admin.totalListings"), stats.totalListings || 0],
    [t("admin.pendingReports"), stats.pendingReports || 0],
    [t("admin.dau"), stats.dau || 0],
  ]

  return (
    <PageTransition className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Helmet>
        <title>{t("admin.title")} | BayonHub</title>
      </Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-neutral-950">{t("admin.title")}</h1>
        <p className="text-sm font-semibold text-neutral-500">{t("admin.subtitle")}</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {d1Tabs.map((tab) => {
          const path = d1TabPath(tab)
          return path !== "/admin" ? (
            <Link
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                selectedTab === tab ? "bg-primary text-white" : "bg-white text-neutral-600"
              }`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              to={path}
            >
              {d1TabLabel(tab, t)}
            </Link>
          ) : (
            <button
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                selectedTab === tab ? "bg-primary text-white" : "bg-white text-neutral-600"
              }`}
              key={tab}
              onClick={() => {
                if (d1RouteTab(location.pathname)) navigate("/admin")
                setActiveTab(tab)
              }}
              type="button"
            >
              {d1TabLabel(tab, t)}
            </button>
          )
        })}
      </div>

      {error ? <p className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}
      {loading ? <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" /> : null}

      {!loading && selectedTab === "dashboard" ? (
        <section className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(([label, value]) => (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" key={label}>
                <p className="text-xs font-black uppercase tracking-wide text-neutral-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-neutral-950">{Number(value).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-neutral-900">{t("home.trending")}</h2>
              <div className="mt-4 grid gap-2">
                {(data.dashboard?.topCategories || []).map((item) => (
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2" key={item.categoryId}>
                    <span className="font-bold text-neutral-700">{item.categoryId}</span>
                    <span className="font-black text-primary">{item.count}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-neutral-900">{t("admin.pendingReports")}</h2>
              <div className="mt-4 grid gap-2">
                {(data.dashboard?.recentReports || []).map((report) => (
                  <div className="rounded-xl bg-neutral-50 p-3" key={report.id}>
                    <p className="font-black text-neutral-900">{report.listing?.title}</p>
                    <p className="text-xs font-bold text-neutral-500">{d1StatusLabel(report.status, t)}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {!loading && selectedTab === "listings" ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              className="h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
              onChange={(event) => setListingSearch(event.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              value={listingSearch}
            />
            <div className="flex gap-2">
              <Button disabled={!selectedIds.length} onClick={() => runAction(() => client.post("/api/admin/listings/bulk", { ids: selectedIds, action: "approve" }))} size="sm">
                <Check className="h-4 w-4" aria-hidden="true" />
                {t("admin.bulkActions")}
              </Button>
              <Button disabled={!selectedIds.length} onClick={() => runAction(() => client.post("/api/admin/listings/bulk", { ids: selectedIds, action: "delete" }))} size="sm" variant="danger">
                <X className="h-4 w-4" aria-hidden="true" />
                {t("admin.delete")}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-black uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="p-3">{t("admin.actions")}</th>
                  <th className="p-3">{t("listing.title")}</th>
                  <th className="p-3">{t("post.category")}</th>
                  <th className="p-3">{t("admin.status")}</th>
                  <th className="p-3">{t("listing.views")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.listings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <input checked={selectedIds.includes(listing.id)} onChange={() => toggleSelection(listing.id)} type="checkbox" />
                        <Button onClick={() => runAction(() => client.patch(`/api/admin/listings/${listing.id}`, { status: "active" }))} size="sm">{t("admin.approve")}</Button>
                        <Button onClick={() => runAction(() => client.patch(`/api/admin/listings/${listing.id}`, { status: "deleted" }))} size="sm" variant="danger">{t("admin.reject")}</Button>
                        <Button onClick={() => runAction(() => client.delete(`/api/admin/listings/${listing.id}`))} size="sm" variant="secondary">{t("admin.delete")}</Button>
                        <Button onClick={() => runAction(() => client.post("/api/admin/featured", { listingId: listing.id }))} size="sm" variant="secondary">{t("admin.featured")}</Button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex min-w-64 items-center gap-3">
                        {d1ListingImage(listing) ? <img alt={listing.title} className="h-12 w-14 rounded-lg object-cover" src={d1ListingImage(listing)} /> : null}
                        <span className="font-black text-neutral-900">{listing.title}</span>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-neutral-600">{listing.categorySlug}</td>
                    <td className="p-3 font-bold text-neutral-600">{d1StatusLabel(listing.status, t)}</td>
                    <td className="p-3 font-bold text-neutral-600">{Number(listing.viewCount || listing.views || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.listings.length ? <p className="p-6 text-center font-bold text-neutral-500">{t("admin.noData")}</p> : null}
        </section>
      ) : null}

      {!loading && selectedTab === "users" ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <input
              className="mb-4 h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              value={userSearch}
            />
            <div className="grid gap-3">
              {data.users.map((item) => (
                <div className="flex flex-col gap-3 rounded-xl bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
                  <div>
                    <p className="font-black text-neutral-900">{item.name}</p>
                    <p className="text-xs font-bold text-neutral-500">{item.phone || item.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => loadUserProfile(item.id)} size="sm" variant="secondary">{t("nav.profile")}</Button>
                    <Button onClick={() => runAction(() => client.patch(`/api/admin/users/${item.id}/warn`, { reason: t("admin.warn") }))} size="sm" variant="secondary">{t("admin.warn")}</Button>
                    {item.banReason ? (
                      <Button onClick={() => runAction(() => client.patch(`/api/admin/users/${item.id}/unban`))} size="sm">{t("admin.unban")}</Button>
                    ) : (
                      <Button onClick={() => runAction(() => client.patch(`/api/admin/users/${item.id}/ban`, { reason: t("admin.ban"), duration: null }))} size="sm" variant="danger">{t("admin.ban")}</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-neutral-900">{t("nav.profile")}</h2>
            {selectedUser ? (
              <div className="mt-4 grid gap-3 text-sm font-bold text-neutral-600">
                <p>{selectedUser.profile?.name}</p>
                <p>{selectedUser.profile?.phone}</p>
                <p>{t("admin.totalListings")}: {selectedUser.activity?.listingCount || 0}</p>
                <p>{t("admin.reports")}: {selectedUser.activity?.reportCount || 0}</p>
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-neutral-500">{t("admin.noData")}</p>
            )}
          </aside>
        </section>
      ) : null}

      {!loading && selectedTab === "reports" ? (
        <section className="grid gap-3">
          {data.reports.map((report) => (
            <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" key={report.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-3">
                  {d1ListingImage(report.listing) ? <img alt={report.listing?.title} className="h-16 w-20 rounded-xl object-cover" src={d1ListingImage(report.listing)} /> : null}
                  <div>
                    <h3 className="font-black text-neutral-900">{report.listing?.title}</h3>
                    <p className="text-sm font-bold text-neutral-500">{t("admin.reportReason")}: {report.reason}</p>
                    <p className="text-sm font-bold text-neutral-500">{report.detail}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => runAction(() => client.patch(`/api/admin/reports/${report.id}`, { action: "dismiss" }))} size="sm" variant="secondary">{t("admin.dismiss")}</Button>
                  <Button onClick={() => runAction(() => client.patch(`/api/admin/reports/${report.id}`, { action: "hide_listing" }))} size="sm">{t("admin.resolve")}</Button>
                  <Button onClick={() => runAction(() => client.patch(`/api/admin/reports/${report.id}`, { action: "ban_user" }))} size="sm" variant="danger">{t("admin.ban")}</Button>
                </div>
              </div>
            </article>
          ))}
          {!data.reports.length ? <p className="rounded-2xl bg-white p-6 text-center font-bold text-neutral-500">{t("admin.noData")}</p> : null}
        </section>
      ) : null}

      {!loading && selectedTab === "payments" ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["PENDING", "APPROVED", "REJECTED"].map((status) => (
                <button
                  className={`rounded-full px-4 py-2 text-sm font-black transition ${
                    paymentStatus === status ? "bg-primary text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                  key={status}
                  onClick={() => setPaymentStatus(status)}
                  type="button"
                >
                  {paymentStatusLabel(status, t)}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-black uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="p-3">{t("admin.users")}</th>
                  <th className="p-3">{t("payment.submitted")}</th>
                  <th className="p-3">{t("payment.note")}</th>
                  <th className="p-3">{t("payment.screenshot")}</th>
                  <th className="p-3">{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="p-3">
                      <p className="font-black text-neutral-900">{payment.user?.name}</p>
                      <p className="text-xs font-bold text-neutral-500">{payment.user?.phone || payment.user?.email}</p>
                    </td>
                    <td className="p-3 font-bold text-neutral-600">{adminDate(payment.createdAt)}</td>
                    <td className="max-w-64 p-3 font-bold text-neutral-600">{payment.note || t("ui.empty")}</td>
                    <td className="p-3">
                      {payment.screenshotUrl ? (
                        <button className="block" onClick={() => setPreviewImage(payment.screenshotUrl)} type="button">
                          <img alt={t("payment.screenshot")} className="h-16 w-20 rounded-xl object-cover" src={payment.screenshotUrl} />
                        </button>
                      ) : (
                        <span className="font-bold text-neutral-400">{t("ui.empty")}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {payment.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => setApprovePayment(payment)} size="sm">
                            <Check className="h-4 w-4" aria-hidden="true" />
                            {t("admin.approve")}
                          </Button>
                          <Button onClick={() => setRejectPayment(payment)} size="sm" variant="danger">
                            <X className="h-4 w-4" aria-hidden="true" />
                            {t("admin.reject")}
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-1">
                          <span className="font-black text-neutral-700">{paymentStatusLabel(payment.status, t)}</span>
                          {payment.reviewNote ? <span className="text-xs font-bold text-neutral-500">{payment.reviewNote}</span> : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.payments.length ? <p className="p-6 text-center font-bold text-neutral-500">{t("admin.noData")}</p> : null}
        </section>
      ) : null}

      {!loading && selectedTab === "giftPlus" ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("gift.searchUser")}
                <input
                  className="h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
                  onChange={(event) => setGiftSearch(event.target.value)}
                  placeholder={t("admin.searchPlaceholder")}
                  value={giftSearch}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("gift.note")}
                <input
                  className="h-11 rounded-xl border border-neutral-200 px-3 text-sm font-bold outline-none focus:border-primary"
                  onChange={(event) => setGiftNote(event.target.value)}
                  value={giftNote}
                />
              </label>
            </div>
            <div className="mt-5 grid gap-3">
              {giftUsers.map((item) => (
                <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4" key={item.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-neutral-900">{item.name}</p>
                      <p className="text-xs font-bold text-neutral-500">{item.phone || item.email}</p>
                      <p className="mt-1 text-xs font-black text-primary">
                        {item.isPlusActive ? t("plus.active") : t("gift.inactive")}
                        {item.plusUntil ? ` · ${t("plus.expires")} ${adminDate(item.plusUntil)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => giftSelectedUser(item.id, "lifetime")} size="sm">{t("gift.lifetime")}</Button>
                      <Button onClick={() => giftSelectedUser(item.id, "1month")} size="sm" variant="secondary">{t("gift.oneMonth")}</Button>
                      {item.isPlusActive ? (
                        <Button onClick={() => revokeSelectedUser(item.id)} size="sm" variant="danger">{t("gift.revoke")}</Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
              {!giftUsers.length ? <p className="rounded-2xl bg-neutral-50 p-6 text-center font-bold text-neutral-500">{t("gift.searchEmpty")}</p> : null}
            </div>
          </div>
          <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="font-black text-neutral-900">{t("gift.giftLog")}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-black uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="p-3">{t("gift.user")}</th>
                    <th className="p-3">{t("gift.type")}</th>
                    <th className="p-3">{t("gift.giftedBy")}</th>
                    <th className="p-3">{t("admin.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.giftLog.map((gift) => (
                    <tr key={gift.id}>
                      <td className="p-3">
                        <p className="font-black text-neutral-900">{gift.user?.name}</p>
                        <p className="text-xs font-bold text-neutral-500">{adminDate(gift.createdAt)}</p>
                      </td>
                      <td className="p-3 font-bold text-neutral-600">{giftTypeLabel(gift.giftType, t)}</td>
                      <td className="p-3 font-bold text-neutral-600">{gift.giftedByUser?.name || gift.giftedBy}</td>
                      <td className="p-3 font-black text-neutral-700">{giftStatusLabel(gift.status, t)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.giftLog.length ? <p className="p-6 text-center font-bold text-neutral-500">{t("ui.empty")}</p> : null}
          </aside>
        </section>
      ) : null}

      {!loading && selectedTab === "featured" ? (
        <section className="grid gap-3">
          {data.featured.map((item) => (
            <article className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" key={item.id}>
              <div className="flex items-center gap-3">
                {d1ListingImage(item.listing) ? <img alt={item.listing?.title} className="h-14 w-16 rounded-xl object-cover" src={d1ListingImage(item.listing)} /> : null}
                <p className="font-black text-neutral-900">{item.listing?.title}</p>
              </div>
              <Button onClick={() => runAction(() => client.delete(`/api/admin/featured/${item.id}`))} size="sm" variant="danger">{t("admin.delete")}</Button>
            </article>
          ))}
          {!data.featured.length ? <p className="rounded-2xl bg-white p-6 text-center font-bold text-neutral-500">{t("admin.noData")}</p> : null}
        </section>
      ) : null}

      {!loading && selectedTab === "analytics" ? (
        <section className="grid gap-4">
          <select className="h-11 max-w-48 rounded-xl border border-neutral-200 px-3 font-bold" onChange={(event) => setPeriod(event.target.value)} value={period}>
            <option value="7d">{t("admin.period7")}</option>
            <option value="30d">{t("admin.period30")}</option>
            <option value="90d">{t("admin.period90")}</option>
          </select>
          <div className="grid gap-4 lg:grid-cols-3">
            <D1BarSeries rows={data.analytics?.dau || []} title={t("admin.dau")} />
            <D1BarSeries rows={data.analytics?.newListings || []} title={t("admin.totalListings")} />
            <D1BarSeries rows={data.analytics?.newUsers || []} title={t("admin.totalUsers")} />
          </div>
        </section>
      ) : null}

      <Modal onClose={() => setApprovePayment(null)} open={Boolean(approvePayment)} title={t("payment.approveTitle")}>
        <div className="grid gap-4">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="font-black text-neutral-900">{approvePayment?.user?.name}</p>
            <p className="text-sm font-bold text-neutral-500">{approvePayment?.user?.phone}</p>
          </div>
          <p className="text-sm font-bold leading-7 text-neutral-600">{t("payment.approveConfirm")}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setApprovePayment(null)} type="button" variant="secondary">{t("ui.cancel")}</Button>
            <Button onClick={approveSelectedPayment} type="button">{t("admin.approve")}</Button>
          </div>
        </div>
      </Modal>

      <Modal onClose={() => setRejectPayment(null)} open={Boolean(rejectPayment)} title={t("payment.rejectTitle")}>
        <form className="grid gap-4" onSubmit={rejectSelectedPayment}>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("payment.reviewNote")}
            <textarea
              className="min-h-28 rounded-xl border border-neutral-200 px-3 py-2 outline-none focus:border-primary"
              onChange={(event) => setRejectNote(event.target.value)}
              required
              value={rejectNote}
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => setRejectPayment(null)} type="button" variant="secondary">{t("ui.cancel")}</Button>
            <Button disabled={!rejectNote.trim()} type="submit" variant="danger">{t("admin.reject")}</Button>
          </div>
        </form>
      </Modal>

      <Modal onClose={() => setPreviewImage("")} open={Boolean(previewImage)} title={t("payment.screenshot")}>
        {previewImage ? <img alt={t("payment.screenshot")} className="max-h-[70vh] w-full rounded-2xl object-contain" src={previewImage} /> : null}
      </Modal>
    </PageTransition>
  )
}
