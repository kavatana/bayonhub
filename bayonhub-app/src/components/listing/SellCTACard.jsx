import { PlusCircle } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { useTranslation } from '../../hooks/useTranslation'

export default function SellCTACard() {
  const { togglePostModal } = useUIStore()
  const { t } = useTranslation()

  return (
    <div
      onClick={togglePostModal}
      className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 cursor-pointer p-6 min-h-[200px]"
      role="button"
      tabIndex={0}
      aria-label={t("listing.sellYours")}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') togglePostModal() }}
    >
      <PlusCircle
        size={40}
        className="text-neutral-300 dark:text-neutral-600 group-hover:text-primary transition-colors duration-200"
      />
      <div className="text-center">
        <p className="font-semibold text-neutral-700 dark:text-neutral-200 group-hover:text-primary transition-colors">
          {t("listing.sellYours")}
        </p>
        <p className="text-sm text-neutral-400 dark:text-neutral-400 mt-1">
          {t("listing.sellYoursSub")}
        </p>
      </div>
    </div>
  )
}
