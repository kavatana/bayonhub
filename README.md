# BayonHub Frontend

BayonHub is now structured as a maintainable static frontend:

- `Bayonhub02.html` is the page entry.
- `assets/styles.css` contains the responsive business UI.
- `assets/app.js` contains rendering, filters, saved listings, posting, leads, reports, and the backend adapter.

## Backend Contract

Set `window.BAYONHUB_API_BASE_URL` before `assets/app.js` loads to use a real API. Without it, the app uses `localStorage` demo data.

Expected endpoints:

- `GET /api/listings`
- `POST /api/listings`
- `POST /api/listings/:id/view`
- `POST /api/listings/:id/save`
- `DELETE /api/listings/:id/save`
- `POST /api/leads`
- `POST /api/reports`

Listing payload fields used by the UI:

```json
{
  "id": 1001,
  "title": "iPhone 15 Pro Max",
  "price": 899,
  "category": "Phones",
  "location": "Phnom Penh",
  "district": "BKK1",
  "condition": "Like new",
  "sellerId": "store-sokha-mobile",
  "sellerName": "Sokha Mobile",
  "verified": true,
  "views": 1820,
  "postedAt": "2026-04-27T08:30:00+07:00",
  "premium": true,
  "imageUrl": "https://example.com/listing.jpg",
  "description": "Clear buyer-facing description."
}
```
