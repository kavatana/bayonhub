import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  from?: string
}): Promise<boolean> {
  if (!resend || !options.to.trim()) {
    console.warn("[Email] RESEND_API_KEY not set or recipient missing — email skipped:", options.subject)
    return false
  }
  try {
    await resend.emails.send({
      from: options.from || "BayonHub <no-reply@bayonhub.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    console.info("[Email] Sent:", options.subject, "to", options.to)
    return true
  } catch (err) {
    console.error("[Email] Failed to send:", err)
    return false
  }
}
