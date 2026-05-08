self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  const title = data.title || "BayonHub"
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { link: data.link || "/" },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const link = event.notification.data?.link || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const targetUrl = new URL(link, self.location.origin).href
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) return client.focus()
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
