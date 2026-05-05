import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Clock, Loader2, ShieldCheck, Upload } from "lucide-react"
import toast from "react-hot-toast"
import imageCompression from "browser-image-compression"

import client from "../../api/client"
import { useTranslation } from "../../hooks/useTranslation"
import Button from "../ui/Button"

export default function VerificationTab() {
  const { t } = useTranslation()
  const [status, setStatus] = useState("loading")
  const [application, setApplication] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    idType: "NATIONAL_ID",
    idNumber: "",
  })
  const [files, setFiles] = useState({
    idFront: null,
    idBack: null,
    selfie: null,
  })

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await client.get("/api/kyc/status")
        setApplication(response.data.application)
        setStatus("idle")
      } catch {
        setStatus("idle")
      }
    }
    fetchStatus()
  }, [])

  async function handleFileChange(event, field) {
    const file = event.target.files[0]
    if (!file) return

    try {
      const options = {
        maxWidthOrHeight: 1600,
        maxSizeMB: 1,
        useWebWorker: true,
      }
      const compressed = await imageCompression(file, options)
      setFiles((prev) => ({ ...prev, [field]: compressed }))
    } catch {
      toast.error(t("ui.error"))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!files.idFront) {
      toast.error(t("dashboard.kycIdFront") + " " + t("ui.required"))
      return
    }

    setSubmitting(true)
    try {
      const data = new FormData()
      data.append("fullName", formData.fullName)
      data.append("idType", formData.idType)
      data.append("idNumber", formData.idNumber)
      if (files.idFront) data.append("idFront", files.idFront)
      if (files.idBack) data.append("idBack", files.idBack)
      if (files.selfie) data.append("selfie", files.selfie)

      const response = await client.post("/api/kyc/submit", data)
      setApplication({ status: response.data.status, fullName: formData.fullName })
      toast.success(t("ui.success"))
    } catch (error) {
      toast.error(error.response?.data?.error || t("ui.error"))
    } finally {
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="grid min-h-64 place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (application?.status === "PENDING") {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Clock className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-black text-neutral-900">{t("dashboard.kycPending")}</h2>
        <p className="mt-2 text-sm font-bold text-neutral-500">{t("dashboard.kycPendingDesc")}</p>
      </div>
    )
  }

  if (application?.status === "VERIFIED") {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-black text-neutral-900">{t("dashboard.kycVerified")}</h2>
        <p className="mt-2 text-sm font-bold text-neutral-500">{t("dashboard.kycVerifiedDesc")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-black text-neutral-900">{t("dashboard.verificationTitle")}</h2>
        <p className="mt-1 text-sm font-bold text-neutral-500">{t("dashboard.verificationDesc")}</p>
      </header>

      {application?.status === "REJECTED" && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-black text-red-700">{t("dashboard.kycRejected")}</h3>
              <p className="mt-1 text-sm font-bold text-red-600">
                {application.reviewNote || t("dashboard.kycRejectedDesc")}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">
              {t("dashboard.kycFullName")}
            </label>
            <input
              required
              className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm font-bold outline-none focus:border-primary"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">
              {t("dashboard.kycIdType")}
            </label>
            <select
              className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm font-bold outline-none focus:border-primary"
              value={formData.idType}
              onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
            >
              <option value="NATIONAL_ID">{t("dashboard.kycNationalId")}</option>
              <option value="PASSPORT">{t("dashboard.kycPassport")}</option>
              <option value="DRIVING_LICENSE">{t("dashboard.kycDriving")}</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400">
              {t("dashboard.kycIdNumber")}
            </label>
            <input
              required
              className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm font-bold outline-none focus:border-primary"
              type="text"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { id: "idFront", label: "dashboard.kycIdFront" },
            { id: "idBack", label: "dashboard.kycIdBack" },
            { id: "selfie", label: "dashboard.kycSelfie" },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                {t(field.label)}
              </label>
              <div className="relative aspect-video w-full">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  onChange={(e) => handleFileChange(e, field.id)}
                />
                <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 transition hover:border-primary/40 hover:bg-primary/5">
                  {files[field.id] ? (
                    <img
                      src={URL.createObjectURL(files[field.id])}
                      alt="Preview"
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <>
                      <Upload className="mb-2 h-6 w-6 text-neutral-400" />
                      <span className="text-[10px] font-bold text-neutral-400">{t("ui.upload")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-primary/5 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
            <p className="text-xs font-bold leading-relaxed text-neutral-600">
              {t("dashboard.verificationDesc")}
            </p>
          </div>
        </div>

        <Button className="w-full" disabled={submitting} loading={submitting} type="submit">
          {t("dashboard.kycSubmit")}
        </Button>
      </form>
    </div>
  )
}
