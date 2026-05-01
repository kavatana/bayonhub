import { useEffect, useState } from "react"
import { UploadCloud } from "lucide-react"
import toast from "react-hot-toast"
import client, { hasApiBackend } from "../../api/client"
import { changePassword, updateProfile } from "../../api/users"
import { useTranslation } from "../../hooks/useTranslation"
import { validatePhone } from "../../lib/validation"
import { useAuthStore } from "../../store/useAuthStore"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"

const ID_TYPES = ["NATIONAL_ID", "PASSPORT", "DRIVING_LICENSE"]

function getTierLabel(t, tier) {
  if (tier === "IDENTITY") return t("kyc.tierIDENTITY")
  if (tier === "PHONE") return t("kyc.tierPHONE")
  return t("kyc.tierNONE")
}

function getKycStatusLabel(t, status) {
  if (status === "APPROVED") return t("kyc.statusAPPROVED")
  if (status === "REJECTED") return t("kyc.statusREJECTED")
  if (status === "NEEDS_RESUBMIT") return t("kyc.statusNEEDS_RESUBMIT")
  if (status === "PENDING") return t("kyc.statusPENDING")
  return t("kyc.notSubmitted")
}

function getIdTypeLabel(t, idType) {
  if (idType === "PASSPORT") return t("kyc.idTypePASSPORT")
  if (idType === "DRIVING_LICENSE") return t("kyc.idTypeDRIVING_LICENSE")
  return t("kyc.idTypeNATIONAL_ID")
}

export default function SettingsTab() {
  const { t, language } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const toggleAuthModal = useUIStore((state) => state.toggleAuthModal)
  const [form, setForm] = useState({
    avatar: user?.avatar || "",
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    notifications: user?.notifications || { leads: true, messages: true, promotions: false },
  })
  const [phoneError, setPhoneError] = useState("")
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [kycLoading, setKycLoading] = useState(false)
  const [kycSubmitting, setKycSubmitting] = useState(false)
  const [kycError, setKycError] = useState("")
  const [kycApplication, setKycApplication] = useState(null)
  const [kycForm, setKycForm] = useState({
    fullName: user?.name || "",
    idType: "NATIONAL_ID",
    idNumber: "",
    idFront: null,
    idBack: null,
    selfie: null,
  })

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setForm((current) => ({
        ...current,
        avatar: user?.avatarUrl || user?.avatar || "",
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        notifications: user?.notifications || current.notifications,
      }))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [user])

  useEffect(() => {
    if (!hasApiBackend()) return undefined
    let cancelled = false
    const frame = window.requestAnimationFrame(() => {
      if (!cancelled) setKycLoading(true)
    })
    client
      .get("/api/kyc/status")
      .then((response) => {
        if (!cancelled) setKycApplication(response.data.application || null)
      })
      .catch(() => {
        if (!cancelled) setKycError(t("kyc.statusError"))
      })
      .finally(() => {
        if (!cancelled) setKycLoading(false)
      })
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [t])

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function save() {
    const phoneResult = validatePhone(form.phone)
    if (!phoneResult.valid) {
      setPhoneError(t(`validation.${phoneResult.error}`))
      return
    }
    if (form.newPassword || form.currentPassword || form.confirmPassword) {
      if (form.newPassword !== form.confirmPassword) {
        toast.error(t("auth.passwordMismatch"))
        return
      }
    }
    setSaving(true)
    try {
      const updatedUser = await updateProfile({
        avatarUrl: form.avatar,
        name: form.name,
        email: form.email,
        phone: phoneResult.normalized,
        language,
        notifications: form.notifications,
      })
      updateUser({
        ...updatedUser,
        avatar: updatedUser.avatarUrl || form.avatar,
        phone: phoneResult.normalized,
        notifications: form.notifications,
      })
      if (form.newPassword && form.currentPassword) {
        await changePassword(form.currentPassword, form.newPassword)
      }
      setForm((current) => ({
        ...current,
        phone: phoneResult.normalized,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
      setPhoneError("")
      toast.success(t("dashboard.savedSuccess"))
    } catch {
      toast.error(t("ui.error"))
    } finally {
      setSaving(false)
    }
  }

  function updateKyc(name, value) {
    setKycForm((current) => ({ ...current, [name]: value }))
  }

  async function handleKycFile(name, file) {
    if (!file) return
    const { default: imageCompression } = await import("browser-image-compression")
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    })
    updateKyc(name, compressed)
  }

  async function submitKyc() {
    if (!hasApiBackend()) {
      setKycError(t("kyc.apiRequired"))
      return
    }
    if (!kycForm.idFront || !kycForm.fullName.trim() || !kycForm.idNumber.trim()) {
      setKycError(t("kyc.required"))
      return
    }
    const body = new FormData()
    body.append("fullName", kycForm.fullName.trim())
    body.append("idType", kycForm.idType)
    body.append("idNumber", kycForm.idNumber.trim())
    body.append("idFront", kycForm.idFront)
    if (kycForm.idBack) body.append("idBack", kycForm.idBack)
    if (kycForm.selfie) body.append("selfie", kycForm.selfie)

    setKycSubmitting(true)
    setKycError("")
    try {
      const response = await client.post("/api/kyc/submit", body, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setKycApplication({
        id: response.data.applicationId,
        status: response.data.status,
        fullName: kycForm.fullName,
        idType: kycForm.idType,
        idNumber: kycForm.idNumber,
      })
      toast.success(t("kyc.pending"))
    } catch {
      setKycError(t("kyc.submitError"))
    } finally {
      setKycSubmitting(false)
    }
  }

  function handleAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener("load", () => update("avatar", reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <label className="grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-neutral-300 bg-neutral-50 text-center text-xs font-bold text-neutral-500">
          {form.avatar ? <img alt={t("dashboard.displayName")} className="h-full w-full object-cover" src={form.avatar} /> : t("dashboard.displayName")}
          <input accept="image/*" className="hidden" onChange={handleAvatar} type="file" />
        </label>
        <div>
          <p className="font-black text-neutral-900">{form.phone || t("auth.phone")}</p>
          <p className="mt-1 text-sm font-bold text-primary">{user?.verified ? t("auth.verified") : t("auth.verifyPhone")}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("dashboard.displayName")}
          <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update("name", event.target.value)} value={form.name} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("dashboard.email")}
          <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update("email", event.target.value)} type="email" value={form.email} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("auth.phone")}
          <input
            className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary"
            inputMode="tel"
            onBlur={() => {
              const phoneResult = validatePhone(form.phone)
              if (phoneResult.valid) {
                update("phone", phoneResult.normalized)
                setPhoneError("")
              } else {
                setPhoneError(t(`validation.${phoneResult.error}`))
              }
            }}
            onChange={(event) => {
              update("phone", event.target.value)
              setPhoneError("")
            }}
            value={form.phone}
          />
          {phoneError ? <span className="text-xs text-red-600">{phoneError}</span> : null}
        </label>
      </div>
      <section>
        <h3 className="mb-3 font-black text-neutral-900">{t("auth.languagePreference")}</h3>
        <div className="flex gap-3">
          {["en", "km"].map((code) => (
            <button className={`rounded-full px-4 py-2 text-sm font-black ${language === code ? "bg-primary text-white" : "bg-white text-neutral-700"}`} key={code} onClick={() => setLanguage(code)} type="button">
              {t(`lang.${code}`)}
            </button>
          ))}
        </div>
      </section>
      <Button className="justify-self-start" onClick={() => toggleAuthModal(true)} variant="secondary">{t("auth.verifyPhone")}</Button>
      <section className={`grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 ${language === "km" ? "font-khmer leading-8" : ""}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-black text-neutral-900">{t("kyc.title")}</h3>
            <p className="text-sm font-semibold text-neutral-500">
              {t("kyc.currentTier")}: {getTierLabel(t, user?.verificationTier || (user?.verified ? "PHONE" : "NONE"))}
            </p>
          </div>
          <span className="self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
            {getKycStatusLabel(t, kycApplication?.status)}
          </span>
        </div>

        {kycLoading ? <p className="text-sm font-bold text-neutral-500">{t("ui.loading")}</p> : null}
        {kycError ? <p className="text-sm font-bold text-red-600">{kycError}</p> : null}
        {kycApplication?.status === "PENDING" ? (
          <p className="rounded-xl bg-primary/5 p-3 text-sm font-bold text-primary">{t("kyc.pending")}</p>
        ) : null}
        {kycApplication?.status === "APPROVED" ? (
          <p className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">{t("kyc.approved")}</p>
        ) : null}
        {kycApplication?.status === "REJECTED" ? (
          <div className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
            <p>{t("kyc.rejected")}</p>
            {kycApplication.reviewNote ? <p className="mt-2">{kycApplication.reviewNote}</p> : null}
          </div>
        ) : null}

        {(!kycApplication || kycApplication.status === "REJECTED" || kycApplication.status === "NEEDS_RESUBMIT") &&
        (user?.verificationTier === "PHONE" || user?.verified) ? (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("kyc.fullName")}
                <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => updateKyc("fullName", event.target.value)} value={kycForm.fullName} />
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700">
                {t("kyc.idType")}
                <select className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => updateKyc("idType", event.target.value)} value={kycForm.idType}>
                  {ID_TYPES.map((idType) => (
                    <option key={idType} value={idType}>
                      {getIdTypeLabel(t, idType)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-neutral-700 sm:col-span-2">
                {t("kyc.idNumber")}
                <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => updateKyc("idNumber", event.target.value)} value={kycForm.idNumber} />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["idFront", t("kyc.uploadId"), true],
                ["idBack", t("kyc.uploadIdBack"), false],
                ["selfie", t("kyc.uploadSelfie"), false],
              ].map(([name, label, required]) => (
                <label className="grid cursor-pointer place-items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-center text-xs font-bold text-neutral-600" key={name}>
                  <UploadCloud aria-hidden="true" className="h-6 w-6 text-primary" />
                  <span>{label}</span>
                  <span className="text-neutral-400">
                    {kycForm[name]?.name || (required ? t("post.required") : t("kyc.optional"))}
                  </span>
                  <input accept="image/*" className="hidden" onChange={(event) => handleKycFile(name, event.target.files?.[0])} type="file" />
                </label>
              ))}
            </div>

            <Button className="justify-self-start" loading={kycSubmitting} onClick={submitKyc}>
              {t("kyc.submit")}
            </Button>
          </div>
        ) : null}
      </section>
      <section className="grid gap-4">
        <h3 className="font-black text-neutral-900">{t("dashboard.changePassword")}</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["currentPassword", t("dashboard.currentPassword")],
            ["newPassword", t("dashboard.newPassword")],
            ["confirmPassword", t("auth.confirmPassword")],
          ].map(([name, label]) => (
            <label className="grid gap-2 text-sm font-bold text-neutral-700" key={name}>
              {label}
              <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update(name, event.target.value)} type="password" value={form[name]} />
            </label>
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-black text-neutral-900">{t("dashboard.notificationPrefs")}</h3>
        <div className="grid gap-2">
          {Object.entries(form.notifications).map(([name, checked]) => (
            <label className="flex items-center justify-between rounded-xl bg-white p-3 text-sm font-bold text-neutral-700" key={name}>
              {t(`pref.${name}`)}
              <input checked={checked} onChange={(event) => update("notifications", { ...form.notifications, [name]: event.target.checked })} type="checkbox" />
            </label>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-red-100 bg-red-50 p-4">
        <h3 className="font-black text-red-700">{t("dashboard.dangerZone")}</h3>
        <Button className="mt-3" onClick={() => setDeactivateOpen(true)} variant="danger">{t("dashboard.deactivate")}</Button>
        {deactivateOpen ? (
          <div className="mt-3 flex gap-2">
            <Button onClick={() => setDeactivateOpen(false)} size="sm" variant="secondary">{t("ui.cancel")}</Button>
            <Button onClick={() => setDeactivateOpen(false)} size="sm" variant="danger">{t("ui.confirm")}</Button>
          </div>
        ) : null}
      </section>
      <Button className="justify-self-start" loading={saving} onClick={save}>{t("ui.save")}</Button>
    </div>
  )
}
