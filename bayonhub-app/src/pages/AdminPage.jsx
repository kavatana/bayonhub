import { useEffect, useMemo, useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { Helmet } from "react-helmet-async"
import { Check, ShieldCheck, UploadCloud, X } from "lucide-react"
import toast from "react-hot-toast"

import client, { API_BASE_URL, hasApiBackend } from "../api/client"
import { useTranslation } from "../hooks/useTranslation"
import { useAuthStore } from "../store/useAuthStore"
import Button from "../components/ui/Button"

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

export default function AdminPage() {
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
                    <p className="text-sm font-black text-neutral-900">{report.reporter?.name || "Anonymous"}</p>
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
                      {report.listing?.title || report.listingTitle || "Untitled"}
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
                            alt="Evidence"
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
