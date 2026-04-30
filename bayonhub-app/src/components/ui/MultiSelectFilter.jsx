import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

export default function MultiSelectFilter({
  options = [],
  selected = [],
  onChange,
  label,
  searchable = false,
  loading = false,
  error = null,
  empty = false,
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const visibleOptions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => String(option.label).toLowerCase().includes(needle))
  }, [options, query])
  const allSelected = options.length > 0 && selected.length === options.length

  function toggleValue(value) {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange?.(next)
  }

  function toggleAll() {
    onChange?.(allSelected ? [] : options.map((option) => option.value))
  }

  return (
    <div className="relative" aria-invalid={Boolean(error)}>
      <button
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 text-left text-sm font-semibold text-neutral-800 transition hover:border-primary"
        disabled={loading}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="truncate">{label}</span>
        <span className="flex items-center gap-2">
          {selected.length ? (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary px-2 text-xs font-black text-white">
              {selected.length}
            </span>
          ) : null}
          <ChevronDown className={cn("h-4 w-4 text-neutral-400 transition", open && "rotate-180")} aria-hidden="true" />
        </span>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl">
          <button
            className="mb-3 text-sm font-bold text-primary"
            onClick={toggleAll}
            type="button"
          >
            {allSelected ? t("ui.clear") : t("ui.selectAll")}
          </button>
          {searchable ? (
            <input
              className="mb-3 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("filter.search")}
              value={query}
            />
          ) : null}
          <div className="max-h-[220px] space-y-2 overflow-auto pr-1">
            {empty || !visibleOptions.length ? (
              <p className="py-4 text-sm text-neutral-500">{t("ui.noOptions")}</p>
            ) : (
              visibleOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  <input
                    checked={selected.includes(option.value)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                    onChange={() => toggleValue(option.value)}
                    type="checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              ))
            )}
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
