import { memo, useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import { useTranslation } from "../../hooks/useTranslation"
import { formatPrice } from "../../lib/utils"
import Button from "./Button"
import Modal from "./Modal"

const loanTerms = [
  { value: 12, labelKey: "loan.term12" },
  { value: 24, labelKey: "loan.term24" },
  { value: 36, labelKey: "loan.term36" },
  { value: 48, labelKey: "loan.term48" },
  { value: 60, labelKey: "loan.term60" },
]

const banks = [
  { key: "bank.aba", phone: "023 225 333" },
  { key: "bank.acleda", phone: "023 998 777" },
  { key: "bank.canadia", phone: "023 868 222" },
  { key: "bank.prince", phone: "023 988 688" },
]

function LoanCalculator({ defaultPrice = 10000, currency = "USD", loading = false, error = null }) {
  const { t } = useTranslation()
  const [bankModalOpen, setBankModalOpen] = useState(false)
  const [carPrice, setCarPrice] = useState(Number(defaultPrice) || 10000)
  const [downPaymentPercent, setDownPaymentPercent] = useState(30)
  const [loanTerm, setLoanTerm] = useState(48)
  const interestRate = 12
  const hasPrice = Number(carPrice) > 0

  const results = useMemo(() => {
    const price = Number(carPrice) || 0
    const downPayment = Math.round(price * (Number(downPaymentPercent) / 100))
    const loanAmount = Math.max(price - downPayment, 0)
    const monthlyRate = interestRate / 100 / 12
    const monthlyPayment =
      loanAmount > 0
        ? loanAmount * monthlyRate / (1 - (1 + monthlyRate) ** -Number(loanTerm))
        : 0
    const totalPayment = monthlyPayment * Number(loanTerm)
    const totalInterest = Math.max(totalPayment - loanAmount, 0)

    return {
      downPayment,
      loanAmount,
      monthlyPayment,
      totalInterest,
      totalPayment,
    }
  }, [carPrice, downPaymentPercent, loanTerm])

  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-neutral-100" aria-label={t("ui.loading")} />
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
  }

  if (!hasPrice) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-300 bg-white p-5 text-center">
        <h2 className="font-black text-neutral-900">{t("loan.calculator")}</h2>
        <p className="mt-2 text-sm font-semibold text-neutral-500">{t("loan.empty")}</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <header className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Calculator className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-black text-neutral-900">{t("loan.calculator")}</h2>
      </header>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("loan.carPrice")}
          <input
            className="h-11 rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-primary"
            min="0"
            onChange={(event) => setCarPrice(Number(event.target.value))}
            type="number"
            value={carPrice}
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          <span className="flex items-center justify-between gap-3">
            <span>{t("loan.downPayment")}</span>
            <span>{downPaymentPercent}%</span>
          </span>
          <input
            className="accent-primary"
            max="60"
            min="10"
            onChange={(event) => setDownPaymentPercent(Number(event.target.value))}
            step="5"
            type="range"
            value={downPaymentPercent}
          />
          <span className="text-xs text-neutral-500">{formatPrice(results.downPayment, currency)}</span>
        </label>

        <label className="grid gap-2 text-sm font-bold text-neutral-700">
          {t("loan.loanTerm")}
          <select
            className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary"
            onChange={(event) => setLoanTerm(Number(event.target.value))}
            value={loanTerm}
          >
            {loanTerms.map((term) => (
              <option key={term.value} value={term.value}>
                {t(term.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-3 py-2 text-sm font-bold text-neutral-700">
          <span>{t("loan.interestRate")}</span>
          <span>{interestRate}%</span>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-primary/5 p-4">
        <p className="text-sm font-bold text-neutral-600">{t("loan.monthlyPayment")}</p>
        <p className="mt-1 font-display text-3xl font-black text-primary">
          {formatPrice(Math.round(results.monthlyPayment), currency)}
        </p>
        <div className="mt-4 grid gap-2 text-sm font-semibold text-neutral-600">
          <div className="flex justify-between gap-3">
            <span>{t("loan.loanAmount")}</span>
            <span>{formatPrice(results.loanAmount, currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>{t("loan.totalInterest")}</span>
            <span>{formatPrice(Math.round(results.totalInterest), currency)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>{t("loan.totalPayment")}</span>
            <span>{formatPrice(Math.round(results.totalPayment), currency)}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold leading-5 text-neutral-500">{t("loan.disclaimer")}</p>
      <Button className="mt-4 w-full" onClick={() => setBankModalOpen(true)} variant="ghost">
        {t("loan.contactBank")}
      </Button>

      <Modal open={bankModalOpen} onClose={() => setBankModalOpen(false)} title={t("loan.contactBank")} size="sm">
        <div className="grid gap-2">
          {banks.map((bank) => (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-50 p-3 text-sm font-bold text-neutral-700" key={bank.key}>
              <span>{t(bank.key)}</span>
              <span>{bank.phone}</span>
            </div>
          ))}
        </div>
      </Modal>
    </section>
  )
}

export default memo(LoanCalculator)
