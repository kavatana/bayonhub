import { useState } from "react"
import { useDropzone } from "react-dropzone"
import toast from "react-hot-toast"
import { useTranslation } from "../../hooks/useTranslation"
import { CATEGORIES } from "../../lib/categories"
import { useAuthStore } from "../../store/useAuthStore"
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
    hours: user?.store?.hours || Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => [day, { open: true, from: "08:00", to: "18:00" }])),
    ...user?.store,
  }))
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

  function save() {
    updateUser({ store })
    toast.success(t("dashboard.savedSuccess"))
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
              <input className="h-10 rounded-lg border border-neutral-200 px-2" disabled={!hours.open} onChange={(event) => updateHours(day, { from: event.target.value })} type="time" value={hours.from} />
              <input className="h-10 rounded-lg border border-neutral-200 px-2" disabled={!hours.open} onChange={(event) => updateHours(day, { to: event.target.value })} type="time" value={hours.to} />
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
      <Button className="justify-self-start" onClick={save}>{t("dashboard.saveStore")}</Button>
    </div>
  )
}
