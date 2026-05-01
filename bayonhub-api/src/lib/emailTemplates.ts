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

// TODO: wire to SendGrid or AWS SES when ready.
