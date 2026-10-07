# Oblivion 1 — Store launch checklists

Ping me with **“external done”** plus which items are complete. I will then wire the matching integration.

Apple & Google developer accounts: **done** (you confirmed).

---

## A. You (external) — ping me when each block is done

### A1. App Store Connect (iOS)
- [ ] App record bundle id `com.o1fc.fitness`
- [ ] Paid Apps / paid applications agreement + banking/tax
- [ ] Subscription group + products (IDs you will use, e.g. monthly / annual / founder)
- [ ] In-App Purchase capability on the App ID
- [ ] Sign in with Apple enabled on the App ID + Services ID + key
- [ ] Privacy Policy URL, Terms URL, support URL (https, public)
- [ ] Account deletion URL (https) — Guideline 5.1.1(v)
- [ ] Sandbox testers for IAP

### A2. Google Play Console (Android)
- [ ] App `com.o1fc.fitness`
- [ ] Payments profile + merchant
- [ ] Subscription products (same commercial intent as iOS)
- [ ] License testers
- [ ] Data safety form (camera, account, purchases, fitness logs)
- [ ] Privacy Policy URL
- [ ] Play App Signing SHA-1 / SHA-256 (needed for Google OAuth)

### A3. RevenueCat
- [x] Product IDs: `o1fc_pro_monthly`, `o1fc_pro_travel_monthly`, `o1fc_founder_pass`
- [x] Default offering mapped
- [ ] Confirm `appl_` / `goog_` keys in env match **this** RC project
- [ ] Store products created in App Store Connect + Play with those exact IDs, then linked in RC
- [x] Entitlement `o1fc_pro` attached to all three products
- [ ] Webhook URL (wait until production API URL exists) + `REVENUECAT_WEBHOOK_AUTH`

### A4. Supabase
- [ ] Email auth on
- [ ] **Apple** provider (required if Google is also offered)
- [ ] **Google** provider
- [ ] Redirect URLs: `com.o1fc.fitness://auth/callback`, `http://localhost:3000/**`, production https origin
- [ ] RPC `delete_user_account` (or equivalent) works with the signed-in user
- [ ] Service role key ready for **server only** (do not put it in the app)

### A5. Hosting / Gemini / Stripe (server)
- [x] Production HTTPS API that runs this repo’s Express `server.ts` (not localhost) — `https://oblivion-1-fitness.onrender.com`
- [x] Send me `VITE_API_BASE_URL` e.g. `https://api.yourdomain.com`
- [ ] `GEMINI_API_KEY` on that server
- [ ] Stripe **live** keys only on that server + webhook → `/api/stripe/webhook`
- [ ] Stripe Connect + Identity enabled if coach payouts/KYC must be live
- [ ] Public https pages: `/privacy`, `/terms`, `/delete-account`

### A6. Send me these strings when ready
- Product IDs (iOS + Android)
- RevenueCat offering / entitlement names if not `default` / `o1fc_pro`
- `VITE_API_BASE_URL`
- Privacy / terms / delete-account URLs
- `REVENUECAT_WEBHOOK_AUTH` (server only)

---

## B. Me (internal / code) — I can do without waiting

| ID | Work | Status |
|---|---|---|
| B1 | Native RevenueCat Capacitor plugin (store sheet, not web `rcb_`) | Plugin installed + wired |
| B2 | Route `/api/*` to `VITE_API_BASE_URL` in native builds (scanners + fuel AI) | Fetch prefix ready; needs your URL |
| B3 | Remove local/web “grant Pro without paying” | Web no longer grants Pro |
| B4 | `isPro` from trial + **verified** store entitlement, not default `true` | Queued |
| B5 | All writes/IAP use `auth.uid()`, drop `default-athlete` | Queued |
| B6 | Account delete must fully delete Auth user + rows (Apple requirement) | Queued |
| B7 | Strip Stripe Connect/Identity **simulated/mocked** in production | Queued |
| B8 | Align iOS usage strings with real features (camera/BLE); drop unused mic/speech if unused | Queued |
| B9 | **`npx cap sync` immediately before launch / store push** (after `npm run build`). Required so `@capacitor/geolocation` and web assets land in Android/iOS. Not needed for Brave/LAN. | Do before native package |

## C. Me — blocked until you ping

- Map real product IDs into paywall / `purchasePackage`
- Point webhook + production env
- Verify TestFlight + internal-track IAP, Sign in with Apple, camera scan against live Gemini
- Store screenshots / reviewer notes from a real signed build

---

When you finish a block, message: **“A3 done, products are …”** (or **“external done”**). I stay on standby for that.
