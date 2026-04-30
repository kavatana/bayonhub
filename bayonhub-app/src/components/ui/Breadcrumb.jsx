import { Link } from "react-router-dom"
import { useTranslation } from "../../hooks/useTranslation"
import { cn } from "../../lib/utils"

export default function Breadcrumb({ crumbs = [], loading = false, error = null, empty = false, className = "" }) {
  const { t } = useTranslation()
  const mobileCrumbs = crumbs.length > 2 ? crumbs.slice(-2) : crumbs

  if (loading) return <div className={cn("h-5 w-48 animate-pulse rounded bg-neutral-200", className)} />
  if (error) return <p className={cn("text-sm text-red-600", className)}>{error}</p>
  if (empty || !crumbs.length) return null

  const renderCrumb = (crumb, index, list) => {
    const isLast = index === list.length - 1
    return (
      <li key={`${crumb.href || crumb.label}-${index}`} className="flex min-w-0 items-center gap-2">
        {index > 0 ? <span className="text-neutral-300">/</span> : null}
        {isLast || !crumb.href ? (
          <span className="truncate text-primary">{crumb.label}</span>
        ) : (
          <Link className="truncate transition hover:text-primary" to={crumb.href}>
            {crumb.label}
          </Link>
        )}
      </li>
    )
  }

  return (
    <nav aria-label={t("ui.breadcrumb")} className={cn("text-sm font-semibold text-neutral-500", className)}>
      <ol className="flex min-w-0 items-center gap-2 sm:hidden">
        {crumbs.length > 2 ? (
          <li className="flex shrink-0 items-center gap-2 text-neutral-400">
            <span>{t("ui.ellipsis")}</span>
            <span className="text-neutral-300">/</span>
          </li>
        ) : null}
        {mobileCrumbs.map((crumb, index) => renderCrumb(crumb, index, mobileCrumbs))}
      </ol>
      <ol className="hidden min-w-0 items-center gap-2 sm:flex">
        {crumbs.map((crumb, index) => renderCrumb(crumb, index, crumbs))}
      </ol>
    </nav>
  )
}
