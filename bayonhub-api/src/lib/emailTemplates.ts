import { sendEmail } from "./email"

export const WELCOME_EMAIL = (name: string) => ({
  subject: "Welcome to BayonHub",
  html: `
    <p>Hi ${name},</p>
    <p>Welcome to BayonHub. Your account is ready to use.</p>
    <p>You can post listings, save favorites, and manage seller tools from your dashboard.</p>
    <p>Team BayonHub</p>
  `,
})

export const SELLER_INVITE_EMAIL = (sellerName: string, listingTitle: string) => ({
  subject: `Your listing "${listingTitle}" is now live on BayonHub`,
  text: `
Hi ${sellerName},

Your listing "${listingTitle}" has been published on BayonHub.

View it here: https://bayonhub.com

BayonHub is Cambodia's newest marketplace — free to list,
trusted by verified sellers.

Want to boost your listing to the top?
Reply to this email or visit bayonhub.com/dashboard

Team BayonHub
  `,
  html: `
    <p>Hi ${sellerName},</p>
    <p>Your listing <strong>"${listingTitle}"</strong> has been published on BayonHub.</p>
    <p><a href="https://bayonhub.com">View it on BayonHub</a></p>
    <p>BayonHub is Cambodia's newest marketplace — free to list, trusted by verified sellers.</p>
    <p>Want to boost your listing to the top? Reply to this email or visit bayonhub.com/dashboard.</p>
    <p>Team BayonHub</p>
  `,
})

export const PASSWORD_RESET_EMAIL = (name: string, code: string) => ({
  subject: "Reset your BayonHub password",
  html: `
    <p>Hi ${name},</p>
    <p>Your BayonHub password reset code is <strong>${code}</strong>.</p>
    <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
    <p>Team BayonHub</p>
  `,
})

export const PROMOTION_CONFIRMATION_EMAIL = (reference: string) => ({
  subject: "BayonHub promotion payment confirmed",
  html: `
    <p>Your BayonHub promotion payment has been confirmed.</p>
    <p>Transaction reference: <strong>${reference}</strong></p>
    <p>Your listing promotion is now active.</p>
    <p>Team BayonHub</p>
  `,
})

export async function sendSellerInviteEmail(to: string, sellerName: string, listingTitle: string): Promise<boolean> {
  const email = SELLER_INVITE_EMAIL(sellerName, listingTitle)
  return sendEmail({ to, subject: email.subject, html: email.html })
}

export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const email = WELCOME_EMAIL(name)
  return sendEmail({ to, subject: email.subject, html: email.html })
}

export async function sendPasswordResetEmail(to: string, name: string, code: string): Promise<boolean> {
  const email = PASSWORD_RESET_EMAIL(name, code)
  return sendEmail({ to, subject: email.subject, html: email.html })
}

export async function sendPromotionConfirmationEmail(to: string, reference: string): Promise<boolean> {
  const email = PROMOTION_CONFIRMATION_EMAIL(reference)
  return sendEmail({ to, subject: email.subject, html: email.html })
}
