import { useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import toast from "react-hot-toast"
import { useTranslation } from "../../hooks/useTranslation"
import { CATEGORIES } from "../../lib/categories"
import { useAuthStore } from "../../store/useAuthStore"
import { createMerchantProfile, getMerchantProfile, updateMerchantProfile } from "../../api/merchant"
import Button from "../ui/Button"

function useImageDrop(onImage) {
  return useDropzone({
    accept: { "image/*": [] },
    maxFiles: 1,
    onDrop: (files) => {
      const file = files[0]
      if (!file) return
      const reader = new FileReader()
      reader.addEventListener("load", () => onImage(reader.result))
      reader.readAsDataURL(file)
    },
  })
}

export default function StoreTab() {
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [store, setStore] = useState(() => ({
    banner: "",
    logo: "",
    name: user?.store?.name || user?.name || "",
    tagline: user?.store?.tagline || "",
    category: user?.store?.category || CATEGORIES[0].id,
    phone: user?.phone || "",
    telegram: user?.store?.telegram || "",
    aboutEn: user?.store?.aboutEn || "",
    aboutKm: user?.store?.aboutKm || "",
    merchantId: user?.store?.merchantId || "",
    taxIdentificationNumber: user?.store?.taxIdentificationNumber || "",
    businessDomain: user?.store?.businessDomain || "RETAIL",
    khqrConfigurationStatus: user?.store?.khqrConfigurationStatus || false,
    initialCatalogEndpoints: (user?.store?.initialCatalogEndpoints || []).join("\n"),
    merchantName: user?.store?.merchantName || "",
    contactEmail: user?.store?.contactEmail || "",
    contactPhone: user?.store?.contactPhone || "",
    telegramChannel: user?.store?.telegramChannel || "",
    hours: user?.store?.hours || Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => [day, { open: true, from: "08:00", to: "18:00" }])),
    ...user?.store,
  }))
  const [merchantStatus, setMerchantStatus] = useState("idle")
  const [saving, setSaving] = useState(false)
  const [merchantError, setMerchantError] = useState("")
  const bannerDrop = useImageDrop((banner) => setStore((current) => ({ ...current, banner })))
  const logoDrop = useImageDrop((logo) => setStore((current) => ({ ...current, logo })))

  function update(name, value) {
    setStore((current) => ({ ...current, [name]: value }))
  }

  function updateHours(day, patch) {
    setStore((current) => ({
      ...current,
      hours: { ...current.hours, [day]: { ...current.hours[day], ...patch } },
    }))
  }

  useEffect(() => {
    if (!store.merchantId) return

    let cancelled = false
    async function loadMerchant() {
      try {
        const profile = await getMerchantProfile(store.merchantId)
        if (cancelled) return
        if (profile) {
          setMerchantStatus("loaded")
          setMerchantError("")
        }
      } catch {
        if (cancelled) return
        setMerchantStatus("idle")
        setMerchantError("")
      }
    }

    loadMerchant()
    return () => {
      cancelled = true
    }
  }, [store.merchantId])

  async function save() {
    setSaving(true)
    setMerchantError("")
    const nextStore = {
      ...store,
      merchantId: store.merchantId || (typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `merchant-${Date.now()}`),
    }

    try {
      const endpoints = nextStore.initialCatalogEndpoints
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

      const hasMerchantData = Boolean(
        nextStore.taxIdentificationNumber &&
        nextStore.businessDomain &&
        endpoints.length,
      )

      if (hasMerchantData) {
        const payload = {
          merchant_id: nextStore.merchantId,
          tax_identification_number: nextStore.taxIdentificationNumber,
          business_domain: nextStore.businessDomain,
          khqr_configuration_status: Boolean(nextStore.khqrConfigurationStatus),
          initial_catalog_endpoints: endpoints,
          merchant_name: nextStore.merchantName || undefined,
          contact_email: nextStore.contactEmail || undefined,
          contact_phone: nextStore.contactPhone || undefined,
          telegram_channel: nextStore.telegramChannel || undefined,
        }

        if (merchantStatus === "loaded") {
          await updateMerchantProfile(nextStore.merchantId, payload)
        } else {
          await createMerchantProfile(payload)
          setMerchantStatus("loaded")
        }
      }

      // Only persist after all API calls succeed
      updateUser({ store: nextStore })
      setStore(nextStore)
      toast.success(t("dashboard.savedSuccess"))
    } catch (error) {
      const message = error instanceof Error ? error.message : t("ui.error")
      setMerchantError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div {...bannerDrop.getRootProps({ className: "grid min-h-36 cursor-pointer place-items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-center" })}>
        <input {...bannerDrop.getInputProps()} />
        {store.banner ? <img alt={t("dashboard.storeBanner")} className="h-40 w-full rounded-2xl object-cover" src={store.banner} /> : <p className="font-bold text-neutral-500">{t("dashboard.storeBanner")}</p>}
      </div>
      <div {...logoDrop.getRootProps({ className: "grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-neutral-300 bg-neutral-50 text-center" })}>
        <input {...logoDrop.getInputProps()} />
        {store.logo ? <img alt={t("dashboard.logo")} className="h-full w-full object-cover" src={store.logo} /> : <p className="text-sm font-bold text-neutral-500">{t("dashboard.logo")}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["name", t("dashboard.storeName"), 120],
          ["tagline", t("dashboard.tagline"), 80],
          ["phone", t("post.phone"), 40],
          ["telegram", t("dashboard.telegram"), 40],
        ].map(([name, label, maxLength]) => (
          <label className="grid gap-2 text-sm font-bold text-neutral-700" key={name}>
            {label}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" maxLength={maxLength} onChange={(event) => update(name, event.target.value)} value={store[name] || ""} />
          </label>
        ))}
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("dashboard.businessCategory")}
          <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary" onChange={(event) => update("category", event.target.value)} value={store.category}>
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>{category.label[language]}</option>
            ))}
          </select>
        </label>
      </div>
      <section>
        <h3 className="mb-3 font-black text-neutral-900">{t("dashboard.businessHours")}</h3>
        <div className="grid gap-2">
          {Object.entries(store.hours).map(([day, hours]) => (
            <div className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-2 rounded-xl bg-white p-2" key={day}>
              <span className="text-sm font-black text-neutral-700">{t(`day.${day}`)}</span>
              <input className="h-11 rounded-lg border border-neutral-200 px-2" disabled={!hours.open} onChange={(event) => updateHours(day, { from: event.target.value })} type="time" value={hours.from} />
              <input className="h-11 rounded-lg border border-neutral-200 px-2" disabled={!hours.open} onChange={(event) => updateHours(day, { to: event.target.value })} type="time" value={hours.to} />
              <label className="flex items-center gap-2 text-xs font-bold text-neutral-600">
                <input checked={hours.open} onChange={(event) => updateHours(day, { open: event.target.checked })} type="checkbox" />
                {hours.open ? t("dashboard.open") : t("dashboard.closed")}
              </label>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("dashboard.aboutUs")} {t("lang.en")}
          <textarea className="min-h-32 rounded-xl border border-neutral-200 p-3 outline-none focus:border-primary" maxLength={500} onChange={(event) => update("aboutEn", event.target.value)} value={store.aboutEn || ""} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("dashboard.aboutUs")} {t("lang.km")}
          <textarea className="min-h-32 rounded-xl border border-neutral-200 p-3 outline-none focus:border-primary" maxLength={500} onChange={(event) => update("aboutKm", event.target.value)} value={store.aboutKm || ""} />
        </label>
      </div>
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-black text-neutral-900">{t("merchant.onboardingTitle")}</h3>
            <p className="text-sm text-neutral-500">{t("merchant.onboardingSubtitle")}</p>
          </div>
          {merchantStatus === "loaded" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-emerald-700">
              {t("merchant.onboarded")}
            </span>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("merchant.merchantId")}
            <input className="h-11 rounded-xl border border-neutral-200 bg-neutral-100 px-3 text-sm text-neutral-700 outline-none" readOnly value={store.merchantId || t("merchant.generatedOnSave")} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("merchant.taxId")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" maxLength={50} onChange={(event) => update("taxIdentificationNumber", event.target.value)} value={store.taxIdentificationNumber || ""} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("merchant.businessDomain")}
            <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary" onChange={(event) => update("businessDomain", event.target.value)} value={store.businessDomain}>
              {[
                { id: "RETAIL", label: t("merchant.domainRetail") },
                { id: "WHOLESALE", label: t("merchant.domainWholesale") },
                { id: "ELECTRONICS", label: t("merchant.domainElectronics") },
                { id: "AUTOMOTIVE", label: t("merchant.domainAutomotive") },
                { id: "REAL_ESTATE", label: t("merchant.domainRealEstate") },
                { id: "SERVICES", label: t("merchant.domainServices") },
                { id: "FOOD", label: t("merchant.domainFood") },
                { id: "AGRI", label: t("merchant.domainAgri") },
                { id: "FASHION", label: t("merchant.domainFashion") },
              ].map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700 sm:col-span-2">
            {t("merchant.catalogEndpoints")}
            <textarea className="min-h-24 rounded-xl border border-neutral-200 p-3 outline-none focus:border-primary" placeholder={t("merchant.catalogHelp")} onChange={(event) => update("initialCatalogEndpoints", event.target.value)} value={store.initialCatalogEndpoints || ""} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("merchant.merchantName")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" maxLength={100} onChange={(event) => update("merchantName", event.target.value)} value={store.merchantName || ""} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("merchant.contactEmail")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" type="email" maxLength={100} onChange={(event) => update("contactEmail", event.target.value)} value={store.contactEmail || ""} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("merchant.contactPhone")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" maxLength={24} onChange={(event) => update("contactPhone", event.target.value)} value={store.contactPhone || ""} />
          </label>
          <label className="grid gap-2 text-sm font-bold text-neutral-700">
            {t("merchant.telegramChannel")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" maxLength={80} onChange={(event) => update("telegramChannel", event.target.value)} value={store.telegramChannel || ""} />
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {merchantError ? <p className="text-sm font-bold text-red-600">{merchantError}</p> : null}
          <Button onClick={save} disabled={saving} type="button">
            {t("merchant.onboardButton")}
          </Button>
        </div>
      </section>
      <Button className="justify-self-start" onClick={save} disabled={saving} loading={saving}>{t("dashboard.saveStore")}</Button>
    </div>
  )
}
