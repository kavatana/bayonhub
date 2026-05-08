
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/utils'

export default function FormField({ field, fieldName, value, onChange, error }) {
  const { language } = useTranslation()
  const label = field.label?.[language] || fieldName

  const baseInputClass = cn(
    "w-full rounded-2xl border px-4 text-base font-semibold outline-none transition dark:bg-neutral-800 dark:text-white",
    "min-h-[48px]", // Minimum touch target 48px
    error 
      ? "border-red-500 bg-red-50 focus:border-red-600 focus:ring-4 focus:ring-red-500/10 dark:border-red-500/50 dark:bg-red-950/20" 
      : "border-neutral-200 bg-neutral-50 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-neutral-700 dark:focus:border-primary"
  )

  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-neutral-900 dark:text-white">
        {label}
      </label>
      
      {field.type === 'select' ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(fieldName, e.target.value)}
          className={baseInputClass}
        >
          <option value="">{label}...</option>
          {field.options?.map((opt) => {
            const optVal = typeof opt === 'string' ? opt : opt.value
            const optLabel = typeof opt === 'string' ? opt : (opt.label?.[language] || opt.value)
            return (
              <option key={optVal} value={optVal}>
                {optLabel}
              </option>
            )
          })}
        </select>
      ) : field.type === 'number' ? (
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(fieldName, e.target.value)}
          placeholder={label}
          className={baseInputClass}
        />
      ) : field.type === 'date' ? (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(fieldName, e.target.value)}
          className={baseInputClass}
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(fieldName, e.target.value)}
          placeholder={label}
          className={baseInputClass}
        />
      )}
      
      {error ? <span className="text-sm font-semibold text-red-600">{error}</span> : null}
    </div>
  )
}
