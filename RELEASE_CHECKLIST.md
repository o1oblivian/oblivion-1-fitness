# Launch Checklist — Oblivion 1 Fitness Club

**Status key**

| Status | Meaning |
|--------|---------|
| `LOCKED` | Passed by Atlas, Bravo, Comet and the Master test (or owner phone). Files are on the lock list. |
| `3/3 PASS` | All three agents passed it. Not locked yet because its files are involved in an open bug below. |
| `PARTIAL` | Some agents passed, some blocked or failed. |
| `FAIL` | Broken. See the bug list. |
| `BLOCKED` | Could not be tested (reason given). |
| `RETEST` | Fix is in code. Retest on the next APK. |
| `PHONE` | Only the owner can test it on the phone. |

Agent run: Oct 15–16, 2026. Atlas, Bravo and Comet worked independently (own throwaway accounts, phone-sized Edge on localhost). Master retest Oct 16 (db.mjs + in-app REPORT3.md). Evidence is in `%TEMP%\o1qa\<name>\REPORT3.md`.

**These PASS marks are browser-on-localhost, not the installed APK.** The owner’s phone (1.0.77–1.0.81) failed Google sign-in, sign-out, Upgrade, and a G-Shock step photo that this list had marked passing. Do not treat a green row as phone-verified unless the Note says the owner confirmed it.

**Launch ready = every row is `LOCKED` or `DONE`, and the pre-push gate passes.**

---

## 1. Phone app: features

### Account

| # | Test | Status | Atlas | Bravo | Comet | Master | Note |
|---|------|--------|-------|-------|-------|--------|------|
| A1 | Google sign-in | PHONE | | | | | Owner confirmed it works through Brave |
| A2 | Email sign-in | 3/3 PASS | PASS | PASS | PASS | | |
| A3 | Sign out | FAIL | PASS | BLOCKED | PASS | | Browser passed. Phone: Sign out froze or landed on Workout. Fix is in source, not in APK 1.0.81. |
| A4 | Onboarding runs once | LOCKED | PASS | PASS | PASS | PASS | Retest Oct 16: onboarding_completed persists; no re-consultation after sign-in |
| A5 | Screen edges | 3/3 PASS | PASS | PASS | PASS | | Browser only. Glance at it on the phone. |
| A6 | Delete account | PARTIAL | BLOCKED | BLOCKED | PASS | | Comet's account was deleted, and its old login was rejected afterwards |

### Workout

| # | Test | Status | Atlas | Bravo | Comet | Master | Note |
|---|------|--------|-------|-------|-------|--------|------|
| W1 | Log a set | 3/3 PASS | PASS | PASS | PASS | | |
| W2 | Finish workout, shows in Log | 3/3 PASS | PASS | PASS | PASS | | Week card shows double volume (bug 5) |
| W3 | Watch photo scan | FAIL | PASS | PASS | PASS | PASS | Browser lab photos only. Owner’s G-Shock (about 6,151 steps) returned “No numbers found” on the APK. Segmented-digit read is in source, not in 1.0.81. |
| W4 | Treadmill photo scan | 3/3 PASS | PASS | PASS | PASS | PASS | Time, km and kcal correct, steps blank. Speed reads 1.2 instead of 2.4 and the type says "watch" (bug 9) |
| W5 | Save cardio | 3/3 PASS | PASS | PASS | PASS | | Manual entry is labelled "Watch" (bug 9) |
| W6 | Hero card | PARTIAL | PASS | BLOCKED | PASS | | 358×430 card, dial centred, 46 to 54 px clear of the nav |
| W7 | Steps estimate from distance | 3/3 PASS | PASS | PASS | PASS | | Shows `~2,590 est.`; the hero shows 2,590 after saving |

### Fuel

| # | Test | Status | Atlas | Bravo | Comet | Master | Note |
|---|------|--------|-------|-------|-------|--------|------|
| F1 | Plate photo scan | LOCKED | PASS | PASS | PASS | PASS | Owner also confirmed on the phone |
| F2 | Barcode scan | PHONE | | | | | Owner confirmed (Lindt) |
| F3 | Barcode grams to 0 | PHONE | | | | | RETEST on the next APK |
| F4 | Package label scan | LOCKED | PASS | PASS | PASS | PASS | 230 kcal, P3, C37, F8 exactly |
| F5 | Add food | 3/3 PASS | PASS | PASS | PASS | | |
| F6 | Delete a meal in Fuel | 3/3 PASS | PASS | PASS | PASS | | |

### Log

| # | Test | Status | Atlas | Bravo | Comet | Master | Note |
|---|------|--------|-------|-------|-------|--------|------|
| L1 | Categories show the day's data | FAIL | PASS | PASS | FAIL | | Food shown 3 times (bug 4); kg column shows the total (bug 10) |
| L2 | Row swipe, headers don't swipe | 3/3 PASS | PASS | PASS | PASS | | |
| L3 | Delete the steps-only row | PARTIAL | FAIL | PASS | PASS | | Burn stays, phantom steps (bug 8) |
| L4 | Delete one meal in Log | 3/3 PASS | PASS | PASS | PASS | | Comet saw Fuel pick up tripled data afterwards (bug 4) |
| L5 | Lift history tabs | 3/3 PASS | PASS | PASS | PASS | | |
| L6 | Week / Month / Chart | 3/3 PASS | PASS | PASS | PASS | | |

### Buddy, Coach, Settings

| # | Test | Status | Atlas | Bravo | Comet | Master | Note |
|---|------|--------|-------|-------|-------|--------|------|
| B1 | Buddy deck has real users only | PHONE | | | | | |
| B2 | Buddy profile edit | FAIL | FAIL | PARTIAL | FAIL | | Photo duplicated and not on the card (bug 13) |
| C1 | Coach tab | FAIL | FAIL | BLOCKED | BLOCKED | | 400 errors, View unfiltered (bug 14) |
| S1 | Medical disclaimer | BLOCKED | BLOCKED | BLOCKED | BLOCKED | | Banner only shows to coaches (bug 16) |
| S2 | Membership | FAIL | | | | | Phone: Upgrade spins and the Play payment sheet never opens on a sideloaded APK. |
| S3 | Profile edit | FAIL | FAIL | BLOCKED | PASS | | Cloud save fails (bug 2) |
| S4 | Toasts | 3/3 PASS | PASS | PASS | PASS | | 24 to 39 px tall, 8 px above the nav |
| S5 | Padding / control sizes | FAIL | FAIL | FAIL | FAIL | | Bug 18 |
| S6 | Notifications | PHONE | | | | | |
| S7 | Buy subscription | FAIL | | | | | Owner: payment window did not open. Needs a Play internal-test install, not a sideloaded APK. |
| S8 | Restore purchase | PHONE | | | | | |

### Stability

| # | Test | Status | Atlas | Bravo | Comet | Master | Note |
|---|------|--------|-------|-------|-------|--------|------|
| X1 | A full day with no crash | PHONE | | | | | |
| X2 | Offline | PARTIAL | PASS | BLOCKED | FAIL | | Misleading offline messages (bug 17) |
| X3 | Reload keeps login and data | 3/3 PASS | PASS | PASS | PASS | | |

---

## 2. Code gates

| # | Check | Status | Atlas | Bravo | Comet | Master |
|---|-------|--------|-------|-------|-------|--------|
| G1 | `tsc --noEmit`: 0 errors | DONE | PASS | PASS | PASS | PASS |
| G2 | oxlint: 0 errors | DONE | PASS | PASS | PASS | PASS |
| G3 | Manifest permissions match the allowed list | DONE | PASS | PASS | PASS | PASS |
| G4 | localhost:3000 responds | DONE | PASS | PASS | PASS | PASS |
| G5 | Release build | DONE | | | | | Signed APK/AAB 1.0.80 (RC keys + products) — Desktop / `releases/` |

## 3. Server and backend

| # | Item | Status | Note |
|---|------|--------|------|
| D1 | Deploy `server.ts` to Render | TODO | Needs a push. Faster cardio scans and CORS. |
| D2 | `GEMINI_API_KEY` set on Render | DONE | Live scans work. The local `.env` has no Gemini key. |
| D3 | Supabase redirect allow-list | DONE | Google sign-in works |
| D4 | Row-level security | STALE | Old FAIL. Oct 16 retest marked bug 1 LOCKED (own row only). Row was not updated. Not rechecked today. |
| D5 | RevenueCat products | DONE | Keys + `o1fc_pro` / `o1fc_pro_monthly` / `o1fc_founder_pass` wired Oct 16 (APK 1.0.80). Phone verify S7/S8. |

## 4. Play Store

| # | Item | Status | Note |
|---|------|--------|------|
| P1 | Signed AAB uploaded | TODO | |
| P2 | versionCode higher than the last upload | CHECK | `build.gradle` has 74 / 1.0.74 (all agents and Master); the last APK was named 1.0.76 |
| P3 | Target SDK 36 | DONE | All agents and Master |
| P4 | Public privacy policy URL | DONE | `/privacy` returns 200 with real content (all agents and Master). Shows "â€¢" glitches. |
| P5 | Public account deletion URL | DONE | `/delete-account` returns 200 (all agents and Master) |
| P6 | Data safety form | TODO | |
| P7 | Content rating | TODO | |
| P8 | Health declaration | TODO | |
| P9 | Store listing images | TODO | |
| P10 | Internal testing | TODO | |
| P11 | Closed test: 12 testers for 14 days | TODO | |

---

## Bugs found (who found it)

**Launch blockers** (migration applied by owner). Retest Oct 16.
1. **LOCKED · Profiles RLS.** Atlas, Bravo, Comet, Master: own row only; anon 401.
2. **LOCKED · Profile cloud save.** Atlas, Bravo, Comet, Master: no 400; full_name/settings save. Caveat: Settings name only reaches the server on the next app load (new bug below).
3. **LOCKED · Onboarding completion.** Atlas, Bravo, Comet, Master: `onboarding_completed=true`; consultation does not repeat after sign-in.
4. **LOCKED · Food logged once.** Atlas, Bravo, Comet, Master: one Hold to log → one Log row, matching Fuel kcal.
5. **LOCKED · Workout counted once.** Atlas, Bravo, Comet, Master: Sets = 1 / Volume after Finish; one `completed_sessions` row; same after reload.
6. **LOCKED · Backup completes.** Atlas, Bravo, Comet, Master: `POST completed_sessions` 201; `GET …activity_type` 200 (value may be null — bug 26).
7. **LOCKED · Cardio adds up.** Atlas, Bravo, Comet, Master: 2+1 km → Log `3 km · 30 min · 300 kcal`.
8. **LOCKED · Burn removed on cardio delete.** Atlas, Bravo, Comet, Master: Fuel Burned 300→0 after Log swipe-delete; stayed 0 after reload.

**Wrong data shown**
9. **PARTIAL · "Watch" labels and speed.** (Atlas, Bravo, Comet, Master) Manual cardio is now labelled "Cardio". The treadmill speed and type are still read by the server and remain open.
10. **Log kg column** shows the total volume (480) instead of the weight (60). (Bravo)
11. **Zero macros show "--" in Log.** (Atlas, Bravo, Comet)
12. **Settings and Buddy disagree** on name and age. (Atlas, Comet)
22. **Name / weight edit syncs late.** Settings Save name / Done sends no request; the cloud copy updates only on the next app load. Signing out first can lose the edit. (Atlas, Bravo, Comet, Master)
23. **Name not restored after re-login.** Log still shows "Set your name" while `profiles.full_name` is set. (Atlas)
24. **Missing tables.** `athlete_profiles` and `telemetry_records` do not exist (404 on session start and during Delete account). (Atlas, Bravo, Comet, Master)
25. **Weekly card contradicts the count.** "No sessions logged" under Volume while Sets = 1. (Atlas, Bravo)
26. **`completed_sessions.activity_type` empty** for strength sessions. (Atlas, Bravo, Master)
27. **Age has no range check** in Settings. (Bravo)
28. **Nav label** is "Buddy" while project rules say "Radar". (Bravo)

**Features**
13. **Buddy photo:** one upload creates 2 or 3 copies and doesn't appear on the card. (Atlas, Bravo, Comet)
14. **Coach tab:** 4× 400 errors ("marcus_reid" is not a UUID); View isn't filtered to the coach. (Atlas)
15. **"Log sleep" has no input.** (Atlas)
16. **Medical disclaimer** only shows to coaches. (Atlas, Comet)
17. **Misleading offline messages:** "No programs published", "Sign in to be seen". (Comet)

**Polish**
18. **Control sizes:** some over 44 px, some tap targets only 10 to 20 px. (Atlas, Bravo, Comet)
19. **Grammar:** "1 sets", "1 unsynced change have not"; deleting steps asks "Delete today's cardio?". (Bravo, Comet)
20. **Encoding glitches:** "Saut├⌐ed" in meal names; "â€¢" on the privacy page. (Atlas, Master)
21. **Scroll carries over** between tabs; the previous email stays filled in after sign-out. (Atlas)

**Test accounts:** Atlas, Bravo, Comet and Master throwaways from the Oct 16 retest were deleted through the app (login rejected afterwards).
