import { Component } from "react"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: "" }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "Unknown error" }
  }

  componentDidCatch(error, info) {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }
    console.error("[ErrorBoundary]", JSON.stringify(errorReport, null, 2))
  }

  handleCopyError = () => {
    const text = `BayonHub Error Report\nURL: ${window.location.href}\nTime: ${new Date().toISOString()}\nError: ${this.state.errorMessage}\nUA: ${navigator.userAgent}`
    navigator.clipboard.writeText(text).catch(() => {})
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="grid min-h-[40vh] place-items-center p-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-black text-neutral-900 dark:text-white">Something went wrong</h2>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">An unexpected error occurred. Please try reloading the page.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark"
                onClick={() => window.location.reload()}
                type="button"
              >
                Reload Page
              </button>
              <button
                className="rounded-xl border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                onClick={this.handleCopyError}
                type="button"
              >
                Copy Error Details
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
