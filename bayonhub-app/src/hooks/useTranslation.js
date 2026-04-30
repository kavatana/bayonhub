import { useCallback } from "react"
import { translate } from "../lib/translations"
import { useUIStore } from "../store/useUIStore"

export function useTranslation() {
  const language = useUIStore((state) => state.language)
  const t = useCallback((key, replacements) => translate(language, key, replacements), [language])
  return {
    language,
    t,
  }
}
