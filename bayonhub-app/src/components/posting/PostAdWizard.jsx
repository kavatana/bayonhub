import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import { Check, ChevronLeft, X, Send, Share2 } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { CATEGORIES } from "../../lib/categories"
import { getCategoryForm } from "../../lib/categoryForms"
import { getDistrictsForProvince, PROVINCES } from "../../lib/locations"
import { cn, formatPrice, listingUrl, telegramShare } from "../../lib/utils"
import { validatePhone } from "../../lib/validation"
import { useAuthStore } from "../../store/useAuthStore"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import ABAPayModal from "../payments/ABAPayModal"
import Button from "../ui/Button"
import Overlay from "../ui/Overlay"
import StepIndicator from "../ui/StepIndicator"
import MediaUploader from "./MediaUploader"

const MapView = lazy(() => import("../ui/MapView"))

function getInitialData(listing = null, prefill = null) {
  if (!listing) {
    return {
      title: "",
      price: "",
      currency: "USD",
      categoryId: prefill?.categoryId || "",
      subcategoryId: prefill?.subcategoryId || "",
      detailCategoryId: "",
      fields: {},
      images: [],
      phone: "",
      province: "Phnom Penh",
      district: "",
      commune: "",
      addressDetail: "",
      lat: null,
      lng: null,
      promotion: "standard",
    }
  }

  const category = CATEGORIES.find(
    (item) =>
      item.label.en === listing.category ||
      item.subcategories.some((subcategory) => subcategory.label.en === listing.subcategory),
  )
  const subcategory = category?.subcategories.find((item) => item.label.en === listing.subcategory)
  const listingImages = Array.isArray(listing.images) && listing.images.length ? listing.images : [listing.imageUrl].filter(Boolean)

  return {
    title: listing.title || "",
    price: listing.price || "",
    currency: listing.currency || "USD",
    categoryId: category?.id || "",
    subcategoryId: subcategory?.id || "",
    detailCategoryId: "",
    fields: {
      description: listing.description || "",
      condition: listing.condition || "",
      ...(listing.facets || {}),
    },
    images: listingImages.map((image, index) => ({
      id: `${listing.id || "listing"}-${index}`,
      preview: typeof image === "string" ? image : image.url,
      url: typeof image === "string" ? image : image.url,
      name: typeof image === "string" ? `image-${index + 1}` : image.name || `image-${index + 1}`,
      order: index,
      isPrimary: index === 0,
    })),
    phone: listing.phone || "",
    province: listing.location || "Phnom Penh",
    district: listing.district || "",
    commune: listing.commune || "",
    addressDetail: listing.addressDetail || "",
    lat: listing.lat || null,
    lng: listing.lng || null,
    promotion: listing.promotion || "standard",
  }
}

export default function PostAdWizard({
  initialListing = null,
  onRequestClose,
  onSubmitListing,
  openOverride,
  submitLabelKey,
}) {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const storeOpen = useUIStore((state) => state.postModalOpen)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const pendingAction = useUIStore((state) => state.pendingAction)
  const setPendingAction = useUIStore((state) => state.setPendingAction)
  const createListing = useListingStore((state) => state.createListing)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const [isSuccess, setIsSuccess] = useState(false)
  const [createdListing, setCreatedListing] = useState(null)
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [showDraftSaved, setShowDraftSaved] = useState(false)
  const open = openOverride ?? storeOpen

  const DRAFT_KEY = "bayonhub:postDraft"

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState(() => getInitialData(initialListing))
  const [touched, setTouched] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [khqrOpen, setKhqrOpen] = useState(false)

  const panelRef = useRef(null)
  const bodyRef = useRef(null)

  const draftCheckedRef = useRef(false)
  useEffect(() => {
    if (!open) {
      draftCheckedRef.current = false
      return
    }

    if (open && !initialListing && !isSuccess && !draftCheckedRef.current) {
      const saved = localStorage.getItem(DRAFT_KEY)
      draftCheckedRef.current = true
      if (!saved) return

      try {
        const parsed = JSON.parse(saved)
        const age = Date.now() - Number(parsed.savedAt || 0)
        if (age > 72 * 60 * 60 * 1000) {
          localStorage.removeItem(DRAFT_KEY)
          return
        }
        window.requestAnimationFrame(() => {
          setShowDraftBanner(true)
        })
      } catch {
        localStorage.removeItem(DRAFT_KEY)
      }
    }
  }, [open, initialListing, isSuccess])

  useEffect(() => {
    if (!open || initialListing || isSuccess) return
    const savedDraft = {
      formData: data,
      currentStep: step,
      savedAt: Date.now(),
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(savedDraft))
    
    window.requestAnimationFrame(() => {
      setShowDraftSaved(true)
    })

    const hideTimer = window.setTimeout(() => setShowDraftSaved(false), 2000)
    return () => window.clearTimeout(hideTimer)
  }, [data, step, open, initialListing, isSuccess])

  const steps = [t("post.stepCategory"), t("post.stepDetails"), t("post.stepMedia"), t("post.stepLocation"), t("post.stepReview")]
  const category = CATEGORIES.find((item) => item.id === data.categoryId)
  const subcategory = category?.subcategories.find((item) => item.id === data.subcategoryId)
  const detailCategory = subcategory?.subcategories?.find((item) => item.id === data.detailCategoryId)
  const detailCategories = subcategory?.subcategories || []
  const formFields = useMemo(() => getCategoryForm(data.subcategoryId), [data.subcategoryId])
  const districts = useMemo(() => {
    const province = PROVINCES.find((item) => item.label.en === data.province)
    return getDistrictsForProvince(province?.slug)
  }, [data.province])
  const coverImage = data.images.find((image) => image.isPrimary) || data.images[0]

  useGSAP(
    () => {
      if (!open || !panelRef.current) return
      gsap.fromTo(panelRef.current, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" })
    },
    { scope: panelRef, dependencies: [open] },
  )

  useEffect(() => {
    if (!open || initialListing || pendingAction?.type !== "post") return undefined
    const frame = window.requestAnimationFrame(() => {
      setData(getInitialData(null, pendingAction.prefill))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [initialListing, open, pendingAction])

  useEffect(() => {
    if (!open || data.phone || !user?.phone) return undefined
    const frame = window.requestAnimationFrame(() => {
      setData((current) => ({ ...current, phone: user.phone }))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [data.phone, open, user?.phone])

  useGSAP(
    () => {
      if (!bodyRef.current) return
      gsap.fromTo(
        bodyRef.current,
        { xPercent: direction > 0 ? 100 : -100, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 0.28, ease: "power2.out" },
      )
    },
    { scope: bodyRef, dependencies: [step] },
  )

  if (!open) return null

  function resetWizard() {
    setData(getInitialData(initialListing, pendingAction?.type === "post" ? pendingAction.prefill : null))
    setStep(0)
    setDirection(1)
    setTouched({})
    setErrors({})
    setLoading(false)
    setIsSuccess(false)
    setCreatedListing(null)
  }

  function loadDraft() {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) {
      setShowDraftBanner(false)
      return
    }

    try {
      const draftData = JSON.parse(saved)
      if (draftData?.formData) {
        setData(draftData.formData)
        setStep(Math.min(Math.max(Number(draftData.currentStep || 0), 0), steps.length - 1))
        toast.success(t("post.draftLoaded"))
      }
    } catch (e) {
      console.error("Failed to load draft", e)
      localStorage.removeItem(DRAFT_KEY)
    }
    setShowDraftBanner(false)
  }

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY)
    resetWizard()
    setShowDraftBanner(false)
  }

  function closeWizard() {
    resetWizard()
    setPendingAction(null)
    if (onRequestClose) {
      onRequestClose()
      return
    }
    togglePostModal(false)
  }

  function updateField(name, value) {
    setData((current) => ({ ...current, [name]: value }))
  }

  function updateDynamicField(name, value) {
    setData((current) => ({
      ...current,
      fields: { ...current.fields, [name]: value },
    }))
  }

  function validateStep(targetStep = step) {
    const nextErrors = {}
    if (targetStep === 0 && !data.subcategoryId) nextErrors.category = t("post.validationCategory")
    if (targetStep === 1) {
      if (!data.title.trim() || data.title.trim().length < 4) nextErrors.title = t("post.validationTitle")
      if (!Number(data.price) || Number(data.price) < 1) nextErrors.price = t("post.validationPrice")
      const phoneResult = validatePhone(data.phone)
      if (!phoneResult.valid) nextErrors.phone = t(`validation.${phoneResult.error}`)
      formFields.forEach((field) => {
        if (field.required && !data.fields[field.id]) nextErrors[field.id] = t("ui.required")
      })
    }
    if (targetStep === 2 && !data.images.length) nextErrors.images = t("post.validationMedia")
    if (targetStep === 3 && (!data.province || !data.district)) nextErrors.location = t("post.validationLocation")
    setErrors(nextErrors)
    return !Object.keys(nextErrors).length
  }

  function goTo(nextStep) {
    if (nextStep > step && !validateStep(step)) {
      toast.error(t("post.validationErrorToast"))
      return
    }
    setDirection(nextStep > step ? 1 : -1)
    setStep(nextStep)
  }

  async function submit() {
    const allValid = [0, 1, 2, 3].every((target) => validateStep(target))
    if (!allValid) return
    if (!isAuthenticated) {
      setPendingAction({ type: "post", prefill: data })
      toggleAuthModal(true)
      return
    }
    setLoading(true)
    try {
      const submitAction = onSubmitListing || createListing
      const phoneResult = validatePhone(data.phone)
      const listing = await submitAction({
        title: data.title.trim(),
        price: Number(data.price),
        currency: data.currency,
        category: category?.label.en,
        categorySlug: category?.slug || category?.id,
        subcategory: detailCategory?.label.en || subcategory?.label.en,
        subcategorySlug: detailCategory?.slug || subcategory?.slug || subcategory?.id,
        condition: data.fields.condition || "Used",
        location: data.province,
        province: data.province,
        district: data.district,
        commune: data.commune,
        addressDetail: data.addressDetail,
        lat: data.lat,
        lng: data.lng,
        sellerName: user?.name || t("app.name"),
        phone: phoneResult.normalized,
        description: data.fields.description || data.title,
        facets: Object.fromEntries(
          Object.entries(data.fields).filter(([key]) => !["description", "condition"].includes(key)),
        ),
        images: data.images,
        imageUrl: coverImage?.preview || coverImage?.url,
        promotion: data.promotion,
        premium: data.promotion !== "standard",
        status: "active",
        leads: 0,
      })
      if (listing) {
        localStorage.removeItem(DRAFT_KEY)
        setCreatedListing(listing)
        setIsSuccess(true)
        if (data.promotion !== "standard") {
          setKhqrOpen(true)
        }
      } else {
        toast.error(t("post.error"))
      }
    } catch (err) {
      toast.error(err?.message || t("post.error"))
    } finally {
      setLoading(false)
    }
  }

  const selectionPath = [
    category ? t(`category.${category.id}`) : "",
    subcategory ? t(`category.${subcategory.id}`) : "",
    detailCategory ? t(`category.${detailCategory.id}`) : "",
  ]
    .filter(Boolean)
    .join(" / ")

  return (
    <>
      {khqrOpen ? <ABAPayModal onClose={() => setKhqrOpen(false)} open={khqrOpen} promotionState={data.promotion} /> : null}
      <Overlay
        ref={panelRef}
        ariaLabel={t("post.title")}
        backdropClassName="z-[80] grid p-0 md:place-items-center md:p-4"
        className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl md:h-[88vh] md:max-w-2xl md:rounded-2xl"
        onClose={closeWizard}
        open={open}
      >
        <header className="shrink-0 border-b border-neutral-100 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              aria-label={t("ui.close")}
              className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 text-neutral-500"
              onClick={closeWizard}
              type="button"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-black text-neutral-900">{t("post.title")}</h2>
              {showDraftSaved && !isSuccess ? (
                <p className="text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1 opacity-100 transition-opacity duration-300">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("post.draftSaved")}
                </p>
              ) : null}
            </div>
            <span className="h-10 w-10" aria-hidden="true" />
          </div>
          {!isSuccess && <StepIndicator currentStep={step} steps={steps} />}
        </header>

        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto p-4">
          {showDraftBanner && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl bg-primary/5 p-4 border border-primary/20">
              <div className="flex-1">
                <p className="text-sm font-bold text-neutral-900">{t("post.draftFound")}</p>
                <p className="text-xs text-neutral-500">{t("post.draftFoundSub")}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={discardDraft}>{t("ui.discard")}</Button>
                <Button size="sm" onClick={loadDraft}>{t("ui.continue")}</Button>
              </div>
            </div>
          )}
          {step === 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="max-h-[52vh] overflow-auto rounded-xl border border-neutral-200 bg-white p-2">
                  <p className="px-2 py-2 text-xs font-black uppercase tracking-widest text-neutral-400">{t("post.chooseCategory")}</p>
                  {CATEGORIES.map((item) => (
                    <button
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold transition",
                        data.categoryId === item.id ? "bg-primary text-white" : "text-neutral-700 hover:bg-neutral-100",
                      )}
                      key={item.id}
                      onClick={() => setData((current) => ({ ...current, categoryId: item.id, subcategoryId: "", detailCategoryId: "" }))}
                      type="button"
                    >
                      {t(`category.${item.id}`)}
                    </button>
                  ))}
                </div>
                <div className="max-h-[52vh] overflow-auto rounded-xl border border-neutral-200 bg-white p-2">
                  <p className="px-2 py-2 text-xs font-black uppercase tracking-widest text-neutral-400">{t("post.chooseSubcategory")}</p>
                  {category?.subcategories.map((item) => (
                    <button
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm font-bold transition",
                        data.subcategoryId === item.id ? "bg-primary text-white" : "text-neutral-700 hover:bg-neutral-100",
                      )}
                      key={item.id}
                      onClick={() => setData((current) => ({ ...current, subcategoryId: item.id, detailCategoryId: "" }))}
                      type="button"
                    >
                      {t(`category.${item.id}`)}
                    </button>
                  )) || <p className="px-3 py-6 text-sm text-neutral-500">{t("ui.empty")}</p>}
                </div>
                {detailCategories.length ? (
                  <div className="max-h-[52vh] overflow-auto rounded-xl border border-neutral-200 bg-white p-2">
                    <p className="px-2 py-2 text-xs font-black uppercase tracking-widest text-neutral-400">{t("post.chooseDetailCategory")}</p>
                    {detailCategories.map((item) => (
                      <button
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-sm font-bold transition",
                          data.detailCategoryId === item.id ? "bg-primary text-white" : "text-neutral-700 hover:bg-neutral-100",
                        )}
                        key={item.id}
                        onClick={() => updateField("detailCategoryId", item.id)}
                        type="button"
                      >
                        {t(`category.${item.id}`)}
                      </button>
                    ))}
                  </div>
                ) : subcategory ? (
                  <div className="grid place-items-center rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-black text-emerald-700">
                    {t("post.categorySelected")}
                  </div>
                ) : null}
              </div>
              {selectionPath ? (
                <p className="rounded-xl bg-neutral-50 p-3 text-sm font-bold text-neutral-700">
                  {t("post.selectionPath")}: <span className="text-primary">{selectionPath}</span>
                </p>
              ) : null}
              {errors.category ? <p className="text-sm font-semibold text-red-600">{errors.category}</p> : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("post.listingTitle")}
                <input
                  className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary"
                  onBlur={() => setTouched((current) => ({ ...current, title: true }))}
                  onChange={(event) => updateField("title", event.target.value)}
                  value={data.title}
                />
                {(touched.title || errors.title) && errors.title ? <span className="text-xs text-red-600">{errors.title}</span> : null}
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("post.price")}
                <span className="flex overflow-hidden rounded-xl border border-neutral-200 focus-within:border-primary">
                  <span className="grid h-11 place-items-center border-r border-neutral-200 px-3 text-sm font-black text-neutral-600">
                    {data.currency === "KHR" ? "៛" : "$"}
                  </span>
                  <input
                    className="h-11 min-w-0 flex-1 px-3 outline-none"
                    min="1"
                    onBlur={() => setTouched((current) => ({ ...current, price: true }))}
                    onChange={(event) => updateField("price", event.target.value)}
                    type="number"
                    value={data.price}
                  />
                </span>
                <div className="flex gap-2" role="radiogroup" aria-label={t("post.currency")}>
                  {["USD", "KHR"].map((currency) => (
                    <button
                      className={`rounded-full px-4 py-1.5 text-xs font-black transition ${data.currency === currency ? "bg-primary text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}
                      key={currency}
                      onClick={() => updateField("currency", currency)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                          e.preventDefault()
                          updateField("currency", "USD")
                        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                          e.preventDefault()
                          updateField("currency", "KHR")
                        }
                      }}
                      role="radio"
                      aria-checked={data.currency === currency}
                      tabIndex={data.currency === currency ? 0 : -1}
                      type="button"
                    >
                      {t(`post.price${currency}`)}
                    </button>
                  ))}
                </div>
                {(touched.price || errors.price) && errors.price ? <span className="text-xs text-red-600">{errors.price}</span> : null}
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("auth.phone")}
                <input
                  className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary"
                  inputMode="tel"
                  onBlur={() => {
                    setTouched((current) => ({ ...current, phone: true }))
                    const phoneResult = validatePhone(data.phone)
                    if (phoneResult.valid) updateField("phone", phoneResult.normalized)
                  }}
                  onChange={(event) => updateField("phone", event.target.value)}
                  value={data.phone}
                />
                {(touched.phone || errors.phone) && errors.phone ? <span className="text-xs text-red-600">{errors.phone}</span> : null}
              </label>
              {formFields.map((field) => (
                <label className="grid gap-2 text-sm font-bold text-neutral-700" key={field.id}>
                  {field.label[language]}
                  {field.type === "textarea" ? (
                    <textarea
                      className="min-h-28 rounded-xl border border-neutral-200 p-3 outline-none focus:border-primary"
                      onBlur={() => setTouched((current) => ({ ...current, [field.id]: true }))}
                      onChange={(event) => updateDynamicField(field.id, event.target.value)}
                      value={data.fields[field.id] || ""}
                    />
                  ) : null}
                  {field.type === "select" ? (
                    <select
                      className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary"
                      onBlur={() => setTouched((current) => ({ ...current, [field.id]: true }))}
                      onChange={(event) => updateDynamicField(field.id, event.target.value)}
                      value={data.fields[field.id] || ""}
                    >
                      <option value="">{t("ui.select")}</option>
                      {(field.options || []).map((option) => {
                        const value = typeof option === "string" ? option : option.value
                        const label = typeof option === "string" ? option : option.label[language]
                        return (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      })}
                    </select>
                  ) : null}
                  {field.type === "boolean" ? (
                    <input
                      checked={Boolean(data.fields[field.id])}
                      className="h-5 w-5 rounded border-neutral-300 text-primary focus:ring-primary"
                      onChange={(event) => updateDynamicField(field.id, event.target.checked)}
                      type="checkbox"
                    />
                  ) : null}
                  {["text", "number", "price"].includes(field.type) ? (
                    <input
                      className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary"
                      max={field.max}
                      min={field.min}
                      onBlur={() => setTouched((current) => ({ ...current, [field.id]: true }))}
                      onChange={(event) => updateDynamicField(field.id, event.target.value)}
                      type={field.type === "text" ? "text" : "number"}
                      value={data.fields[field.id] || ""}
                    />
                  ) : null}
                  {(touched[field.id] || errors[field.id]) && errors[field.id] ? <span className="text-xs text-red-600">{errors[field.id]}</span> : null}
                </label>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <MediaUploader error={errors.images} onChange={(images) => updateField("images", images)} value={data.images} />
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("post.province")}
                <select
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary"
                  onChange={(event) => setData((current) => ({ ...current, province: event.target.value, district: "" }))}
                  value={data.province}
                >
                  {PROVINCES.map((province) => (
                    <option key={province.id} value={province.label.en}>
                      {province.label[language]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("post.district")}
                <select
                  className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary"
                  onChange={(event) => updateField("district", event.target.value)}
                  value={data.district}
                >
                  <option value="">{t("ui.select")}</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.label.en}>
                      {district.label[language]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("post.commune")}
                <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => updateField("commune", event.target.value)} value={data.commune} />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("post.addressDetail")}
                <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => updateField("addressDetail", event.target.value)} placeholder={t("post.addressPlaceholder")} value={data.addressDetail} />
              </label>
              <div className="grid gap-2">
                <p className="text-sm font-bold text-neutral-600">{t("post.tapMapToPin")}</p>
                <Suspense fallback={<div className="h-56 w-full animate-pulse rounded-xl bg-neutral-100" />}>
                  <MapView
                    className="h-56 w-full rounded-xl"
                    interactive
                    lat={data.lat || 11.5564}
                    lng={data.lng || 104.9282}
                    markers={
                      data.lat && data.lng
                        ? [
                            {
                              id: "listing-location",
                              draggable: true,
                              lat: data.lat,
                              lng: data.lng,
                              onDragEnd: ({ lat, lng }) => setData((current) => ({ ...current, lat, lng })),
                            },
                          ]
                        : []
                    }
                    onLocationSelect={({ lat, lng }) => setData((current) => ({ ...current, lat, lng }))}
                    zoom={12}
                  />
                </Suspense>
                <p className="text-xs font-semibold text-neutral-400">
                  {t("post.coordinates", {
                    lat: Number(data.lat || 11.5564).toFixed(4),
                    lng: Number(data.lng || 104.9282).toFixed(4),
                  })}
                </p>
              </div>
              {errors.location ? <p className="text-sm font-semibold text-red-600">{errors.location}</p> : null}
            </div>
          ) : null}

          {step === 4 ? (
            !isAuthenticated ? (
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-black text-neutral-900">{t("post.almostThere")}</h3>
                <p className="mt-2 max-w-md text-sm text-neutral-500">{t("post.createAccountToPost")}</p>
                <div className="mt-6 grid w-full gap-3 sm:max-w-sm">
                  <Button onClick={() => {
                    setPendingAction({ type: "post", prefill: data })
                    toggleAuthModal(true)
                  }}>
                    {t("auth.register")}
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    setPendingAction({ type: "post", prefill: data })
                    toggleAuthModal(true)
                  }}>
                    {t("auth.login")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-400">{t("post.reviewSummary")}</p>
                  <div className="mt-4 flex gap-4">
                    <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                      {coverImage ? <img alt={data.title} className="h-full w-full object-cover" src={coverImage.preview || coverImage.url} /> : null}
                    </div>
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-lg font-black text-neutral-900">{data.title}</h3>
                      <p className="mt-1 text-xl font-black text-primary">{formatPrice(data.price, data.currency)}</p>
                      <p className="mt-2 text-sm font-semibold text-neutral-500">{selectionPath}</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {data.province}
                        {data.district ? `, ${data.district}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-sm font-black text-neutral-900">{t("post.promotion")}</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["standard", t("post.standardFree")],
                      ["boost", t("post.boost")],
                      ["top", t("post.topAd")],
                    ].map(([value, label]) => (
                      <button
                        className={cn(
                          "rounded-2xl border p-4 text-left text-sm font-black transition",
                          data.promotion === value ? "border-primary bg-primary text-white" : "border-neutral-200 bg-white text-neutral-800",
                        )}
                        key={value}
                        onClick={() => updateField("promotion", value)}
                        type="button"
                      >
                        <span className="flex items-center justify-between gap-3">
                          {label}
                          {data.promotion === value ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : null}

          {isSuccess && (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-neutral-900">{t("post.successTitle")}</h3>
              <p className="mt-2 max-w-sm text-neutral-500">{t("post.successSubtitle")}</p>
              
              <div className="mt-8 grid w-full gap-3 sm:max-w-sm">
                <Button onClick={() => { closeWizard(); navigate(listingUrl(createdListing)) }}>
                  {t("post.viewListing")}
                </Button>
                <Button variant="secondary" onClick={resetWizard}>
                  {t("post.postAnother")}
                </Button>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button variant="ghost" size="sm" onClick={() => telegramShare(window.location.origin + listingUrl(createdListing), createdListing?.title)}>
                    <Send className="h-4 w-4 mr-2" />
                    Telegram
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + listingUrl(createdListing))}`, "_blank")}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                </div>
              </div>
              
              <p className="mt-10 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                {t("post.expiresIn")}
              </p>
            </div>
          )}
        </div>

        {!isSuccess && (
          <footer className="flex shrink-0 items-center gap-3 border-t border-neutral-100 p-4">
            {step > 0 ? (
              <Button onClick={() => goTo(step - 1)} variant="secondary">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {t("ui.back")}
              </Button>
            ) : null}
            {step < steps.length - 1 ? (
              <Button className="ml-auto" disabled={step === 0 && !data.subcategoryId} onClick={() => goTo(step + 1)}>
                {t("ui.continue")}
              </Button>
            ) : (
              <Button className="ml-auto w-full sm:w-auto" loading={loading} onClick={submit}>
                {submitLabelKey ? t(submitLabelKey) : t("post.postAd")}
              </Button>
            )}
          </footer>
        )}
      </Overlay>
    </>
  )
}
