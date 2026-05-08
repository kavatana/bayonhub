import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from '../../hooks/useTranslation'
import { getFormSchema, getRequiredFields, getOptionalFields } from '../../lib/categoryForms'
import FormField from './FormField'

export default function CategoryForm({ categoryId, formData, onChange, errors }) {
  const { t } = useTranslation()
  const [showOptional, setShowOptional] = useState(false)
  
  const schema = getFormSchema(categoryId)
  const requiredFields = getRequiredFields(categoryId)
  const optionalFields = getOptionalFields(categoryId)

  // Auto-generate car title
  useEffect(() => {
    if (categoryId === 'cars') {
      const make = formData?.make
      const model = formData?.model
      const year = formData?.year
      if (make && model && year) {
        const generatedTitle = `${make} ${model} ${year}`
        if (formData.title !== generatedTitle) {
          onChange('title', generatedTitle)
        }
      }
    }
  }, [categoryId, formData?.make, formData?.model, formData?.year, formData?.title, onChange])

  if (!schema) return null

  return (
    <div className="grid gap-5">
      <div className="grid gap-5">
        {requiredFields.map(fieldName => {
          const field = schema.fields[fieldName]
          if (!field) return null
          return (
            <FormField
              key={fieldName}
              fieldName={fieldName}
              field={field}
              value={formData?.[fieldName]}
              onChange={onChange}
              error={errors?.[fieldName]}
            />
          )
        })}
      </div>
      
      {optionalFields.length > 0 ? (
        <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="flex w-full items-center justify-between font-bold text-neutral-900 dark:text-white"
          >
            <span>{t("form.moreDetails")}</span>
            {showOptional ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
          
          {showOptional ? (
            <div className="mt-5 grid gap-5">
              {optionalFields.map(fieldName => {
                const field = schema.fields[fieldName]
                if (!field) return null
                return (
                  <FormField
                    key={fieldName}
                    fieldName={fieldName}
                    field={field}
                    value={formData?.[fieldName]}
                    onChange={onChange}
                    error={errors?.[fieldName]}
                  />
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
