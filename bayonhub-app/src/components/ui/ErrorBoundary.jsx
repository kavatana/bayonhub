import { Component } from "react"
import ErrorPage from "../../pages/ErrorPage"

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

      return <ErrorPage />
    }
    return this.props.children
  }
}
