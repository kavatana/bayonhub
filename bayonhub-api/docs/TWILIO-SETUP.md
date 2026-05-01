# Setting Up Twilio SMS OTP

1. Sign up for a Twilio account at twilio.com
2. Go to the Console Dashboard and copy:
   - Account SID
   - Auth Token
   - Twilio Phone Number (must be SMS-enabled)
3. In Railway dashboard → Variables → Add:
   TWILIO_ACCOUNT_SID=ACxxx
   TWILIO_AUTH_TOKEN=xxx
   TWILIO_PHONE_NUMBER=+1xxx
4. Verify your phone number in the Twilio Console if you are using a Trial Account.
5. Trial accounts can only send SMS to verified caller IDs. For production, upgrade to a paid account.
6. Cambodia support: Twilio supports sending SMS to Cambodia (+855). Ensure your account has permissions for Cambodia in the "Messaging → Settings → Geo-Permissions" section.
