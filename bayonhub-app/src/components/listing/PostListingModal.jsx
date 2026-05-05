import { useMemo, useState } from "react"
import toast from "react-hot-toast"
import { CATEGORIES } from "../../lib/categories"
import { PROVINCES } from "../../lib/locations"
import { useTranslation } from "../../hooks/useTranslation"
import { useListingStore } from "../../store/useListingStore"
import { useUIStore } from "../../store/useUIStore"
import Button from "../ui/Button"
import Modal from "../ui/Modal"

const initialForm = {
  title: "",
  price: "",
  condition: "Like new",
  category: "Vehicles",
  subcategory: "Cars",
  location: "Phnom Penh",
  district: "",
  sellerName: "",
  phone: "",
  description: "",
}

function compressImage(file, maxWidthPx = 1200, qualityJpeg = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener("error", () => reject(new Error("read")))
    reader.addEventListener("load", () => {
      const image = new Image()
      image.addEventListener("error", () => reject(new Error("image")))
      image.addEventListener("load", () => {
        const scale = Math.min(1, maxWidthPx / image.width)
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", qualityJpeg))
      })
      image.src = reader.result
    })
    reader.readAsDataURL(file)
  })
}

export default function PostListingModal() {
  const { t, language } = useTranslation()
  const open = useUIStore((state) => state.postModalOpen)
  const togglePostModal = useUIStore((state) => state.togglePostModal)
  const createListing = useListingStore((state) => state.createListing)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [previews, setPreviews] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  const selectedCategory = useMemo(
    () => CATEGORIES.find((category) => category.label.en === form.category) || CATEGORIES[0],
    [form.category],
  )

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleImages(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 5)
    setPreviews(files.map((file) => URL.createObjectURL(file)))
    setImages(await Promise.all(files.map((file) => compressImage(file))))
  }

  function validate() {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = t("post.required")
    if (form.title.trim() && form.title.trim().length < 4) nextErrors.title = t("post.validationTitle")
    if (!Number(form.price) || Number(form.price) < 1) nextErrors.price = t("post.validationPrice")
    if (!form.sellerName.trim()) nextErrors.sellerName = t("post.required")
    if (!form.description.trim() || form.description.trim().length < 12) {
      nextErrors.description = t("post.validationDescription")
    }
    setErrors(nextErrors)
    return !Object.keys(nextErrors).length
  }

  async function submit(event) {
    event.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const listing = await createListing({
        ...form,
        price: Number(form.price),
        images,
      })
      if (listing) {
        setForm(initialForm)
        setImages([])
        setPreviews([])
        togglePostModal(false)
      }
    } catch (err) {
      toast.error(err?.message || t("ui.error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={() => togglePostModal(false)} title={t("post.title")} size="lg">
      <form className="grid gap-4" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-semibold text-neutral-700">
          {t("post.listingTitle")}
          <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update("title", event.target.value)} value={form.title} />
          {errors.title ? <span className="text-xs text-red-600">{errors.title}</span> : null}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("post.price")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" min="1" onChange={(event) => update("price", event.target.value)} type="number" value={form.price} />
            {errors.price ? <span className="text-xs text-red-600">{errors.price}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("post.condition")}
            <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary" onChange={(event) => update("condition", event.target.value)} value={form.condition}>
              {[
                ["Like new", "condition.likeNew"],
                ["Good", "condition.good"],
                ["Used", "condition.used"],
                ["For rent", "condition.forRent"],
                ["New", "condition.new"],
              ].map(([condition, key]) => (
                <option key={condition} value={condition}>{t(key)}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("post.category")}
            <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary" onChange={(event) => update("category", event.target.value)} value={form.category}>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.label.en}>{category.label[language]}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("post.subcategory")}
            <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary" onChange={(event) => update("subcategory", event.target.value)} value={form.subcategory}>
              {selectedCategory.subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.label.en}>{subcategory.label[language]}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("post.location")}
            <select className="h-11 rounded-xl border border-neutral-200 bg-white px-3 outline-none focus:border-primary" onChange={(event) => update("location", event.target.value)} value={form.location}>
              {PROVINCES.map((province) => (
                <option key={province.id} value={province.label.en}>{province.label[language]}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("post.district")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update("district", event.target.value)} value={form.district} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("post.seller")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update("sellerName", event.target.value)} value={form.sellerName} />
            {errors.sellerName ? <span className="text-xs text-red-600">{errors.sellerName}</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            {t("post.phone")}
            <input className="h-11 rounded-xl border border-neutral-200 px-3 outline-none focus:border-primary" onChange={(event) => update("phone", event.target.value)} value={form.phone} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-neutral-700">
          {t("post.images")}
          <input accept="image/*" capture="environment" className="rounded-xl border border-neutral-200 p-3" multiple onChange={handleImages} type="file" />
          <span className="text-xs text-neutral-500">{t("post.imageHelp")}</span>
        </label>
        {previews.length ? (
          <div className="flex gap-2 overflow-x-auto">
            {previews.map((preview) => (
              <img alt={t("post.images")} className="h-20 w-24 rounded-xl object-cover" key={preview} src={preview} />
            ))}
          </div>
        ) : null}
        <label className="grid gap-2 text-sm font-semibold text-neutral-700">
          {t("post.description")}
          <textarea className="min-h-32 rounded-xl border border-neutral-200 p-3 outline-none focus:border-primary" onChange={(event) => update("description", event.target.value)} value={form.description} />
          {errors.description ? <span className="text-xs text-red-600">{errors.description}</span> : null}
        </label>
        <Button loading={loading} type="submit">{t("post.submit")}</Button>
      </form>
    </Modal>
  )
}
