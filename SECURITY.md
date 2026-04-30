# BayonHub Security — Pre-Launch Checklist

> **Status:** Backend integration in progress.
> This document tracks every security decision before VITE_API_URL
> points at a real production backend.

---

## 1 · JWT Storage Migration

### Current state
JWT tokens stored in localStorage under bayonhub:authToken
(src/api/client.js). Intentional for offline-first development only.

### Risk
localStorage is readable by any JavaScript on the same origin.
XSS attack can exfiltrate the token.

### Migration path (before go-live)

| Step | Action | File |
|---|---|---|
| 1 | Express issues Secure; HttpOnly; SameSite=Strict cookies on login/register | bayonhub-api/ |
| 2 | Set withCredentials: true in Axios client | src/api/client.js |
| 3 | Delete localStorage Bearer token interceptor block | src/api/client.js |
| 4 | Replace 401 handler localStorage.removeItem with POST /api/auth/logout | src/api/client.js |
| 5 | Remove authToken from STORAGE_KEYS and all setItem calls | src/store/useAuthStore.js |
| 6 | Keep authUser (non-sensitive profile) in localStorage | src/store/useAuthStore.js |

---

## 2 · CSRF Protection

### Current state
withCredentials: false. No CSRF headers sent.
Stub comment exists at src/api/client.js.

### Migration path

| Step | Action |
|---|---|
| 1 | Install csurf or Helmet CSRF middleware in Express |
| 2 | Backend sets XSRF-TOKEN non-HttpOnly cookie on every response |
| 3 | Uncomment X-XSRF-TOKEN header in Axios request interceptor |
| 4 | All POST/PUT/PATCH/DELETE routes validate X-XSRF-TOKEN header |

---

## 3 · Input Validation

| Surface | State | Action |
|---|---|---|
| Listing title/description | Plain text, no dangerouslySetInnerHTML | ✅ Safe |
| Phone numbers | +855 regex validated, digits only in links | ✅ Safe |
| Image uploads | All through browser-image-compression | ✅ Safe |
| User-supplied URLs | Only wa.me and t.me targets | ✅ Safe |
| OTP code | 6-digit numeric, client validated | ⚠️ Backend must validate server-side |

---

## 4 · Content Security Policy

Recommended production policy:
Content-Security-Policy:
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://images.unsplash.com https://*.r2.cloudflarestorage.com;
connect-src 'self' https://api.bayonhub.com;
frame-src https://www.google.com;
object-src 'none';
base-uri 'self';
form-action 'self';

---

## 5 · Sensitive Data in localStorage

| Key | Contains | Action |
|---|---|---|
| bayonhub:authToken | JWT | Migrate to HttpOnly cookie |
| bayonhub:authUser | { id, name, phone, language } | Acceptable |
| bayonhub:listings | Seed + user listings | Acceptable |
| bayonhub:saved | Array of listing IDs | Acceptable |
| bayonhub:messages | Mock chat messages | Clear on logout |
| bayonhub:actionLog | Contact rate limit counters | Acceptable |

---

## 6 · Dependency Audit

Run before every production deploy:
```bash
npm audit --audit-level=high
```

---

## 7 · Go-Live Security Gate

All must be true before VITE_API_URL points at production:

- [ ] JWT in Secure; HttpOnly; SameSite=Strict cookie
- [ ] withCredentials: true in Axios client
- [ ] CSRF Double-Submit Cookie pattern active
- [ ] npm audit returns 0 high/critical vulnerabilities
- [ ] CSP header deployed on hosting platform
- [ ] OTP verified server-side before token issued
- [ ] Twilio active and sendOtp wired to real SMS
- [ ] ABA KHQR SDK integrated with real QR generation
- [ ] No sensitive data in console.warn calls
- [ ] Rate limiting active on /api/auth/* routes
- [ ] IS_PRODUCTION guard blocks localStorage token in prod frontend
- [ ] All P0 findings from QA audit resolved