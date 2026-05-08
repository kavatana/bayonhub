export function trackEvent(eventName, properties = {}) {
  if (typeof window === "undefined") return
  const analyticsEndpoint = window.__ANALYTICS_ENDPOINT__
  const analyticsPayload = { event: eventName, ...properties, timestamp: Date.now() }
  if (import.meta.env.DEV) {
    console.log("[Analytics]", eventName, properties)
  }
  if (analyticsEndpoint) {
    fetch(analyticsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(analyticsPayload),
    }).catch(() => {})
  }
}
