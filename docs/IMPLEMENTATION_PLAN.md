# Convoy — Phase-wise Implementation Plan

Working agreement: each phase ships on its own branch with a PR. Anything requiring the
Firebase console, Google Cloud console, or real-device GPS testing is marked **[You]** —
everything else is implementable in a session here.

---

## ✅ Phase 1 — Redesign + reliability fixes (DONE, this branch)

**Goal:** the app looks like the approved "warm paper + forest green" concept and the
known small bugs are gone.

Shipped:
- [x] Design tokens in `tailwind.config.js` (paper/surface/field/line, ink/sub/mute,
      brand green, amber, danger) — legacy class names remapped so the whole app inherits
- [x] Fraunces serif for wordmark/titles; Inter for UI (Bebas Neue removed)
- [x] Light "printed touring map" Google Maps style (`mapStyle.js`)
- [x] JoinPage: light paper map background, serif wordmark, green CTAs
- [x] TripPage: white tab bar with Lucide icons (emoji tabs gone), light banners,
      restyled SOS overlay
- [x] TopBar: light glass bar, green live pill, green Invite button
- [x] New marker system: green "You" dot + pulse, teardrop member pins with initials
      and white info chips, restyled waypoint pins
- [x] All panels restyled (members, chat, route, waypoint picker, member detail,
      trip summary, history, 404, loading screen)
- [x] Every emoji replaced with Lucide icons: waypoint categories now store an
      `icon` id resolved via `src/utils/waypointIcons.js`, detail-card stats,
      trip summary, SOS overlay, map controls, toasts and chat send button all
      use line icons; emoji removed from system chat messages and share text
- [x] Muted earth-tone member palette + transport colors (no blue, no neon)
- [x] PWA manifest + theme-color updated
- **Minor fixes:**
- [x] Map no longer re-centers on every GPS tick (fights panning) — centers once
- [x] Removed dashed lines from you to every member (map clutter)
- [x] Battery warning actually fires when level drops below 20% (was checking once at mount)
- [x] "Connection lost" toast no longer fires on initial page load
- [x] Stale SOS alerts (>10 min old) no longer re-alarm everyone who joins
- [x] `useMembers` no longer resubscribes to Firebase on every GPS movement
- [x] `useBattery` event listener cleanup actually removes the listener
- [x] Store persisted to sessionStorage — a page refresh mid-trip no longer kicks you
      back to the join screen
- [x] Screen Wake Lock during trips (`useWakeLock`) so phones don't sleep and stop sharing
- [x] Live count no longer counts you while in observer mode

**[You] to verify on device:** join a trip on two phones, confirm markers/labels look
right on the real Google Map, confirm the screen stays awake during a trip.

---

## Phase 2 — Trust: auth, data model, security rules

**Goal:** nobody can read or spoof locations without being in the trip. This unblocks the
visibility model, so it comes before features.

- [ ] Anonymous Firebase Auth for guests (`signInAnonymously`) — every member gets an
      `auth.uid`; replace localStorage guest IDs; keep Google sign-in for organizers
- [ ] Restructure RTDB schema:
      `trips/{code}/{meta, roles/{uid}, profiles/{uid}, positions/{uid}, waypoints, chat, sos}`
      (split identity from live position so rules can guard positions separately)
- [ ] Write `database.rules.json` in-repo: positions writable only by owner; waypoints
      writable only by organizer; validation on lat/lng ranges, name length, chat rate
- [ ] Migrate hooks (`useTrip`, `useMembers`, `useChat`) to the new paths
- [ ] SOS resolve flow: "I'm safe" (triggerer) / "Mark resolved" (organizer), resolved
      alerts cleared from the map
- [ ] Trip lifecycle part 1: organizer "End trip for everyone" → `meta.status = 'ended'`,
      members get the summary screen, trip becomes non-joinable
- [ ] Lint cleanup: remaining `refs during render` / `Date.now in render` errors
- **[You]:** enable Anonymous Auth in Firebase console; deploy rules (`firebase deploy
  --only database`); two-device test that a non-member UID cannot read positions

## Phase 3 — The differentiator: roles & visibility modes

**Goal:** the product you described — organizer sees all; joiners see the route, stops
and organizer only.

- [ ] Sharing mode on trip creation: **Everyone** / **Hub & spoke** / **Proximity (5 km)**
      stored in `meta.mode`, enforced in rules + filtered in `useMembers`
- [ ] Destination-first create flow: trip name + destination search + mode picker
      (replaces "code first, destination buried in Pin tab")
- [ ] Join preview screen: trip name, organizer, destination, member count, and an
      explicit "who will see your location" consent line before joining
- [ ] QR code on the invite/share sheet (`qrcode` lib) + WhatsApp share link
- [ ] Organizer badge on map pin + member list; per-member "Pause sharing" (ghost mode)
- [ ] Fleet panel for the organizer: alert rows float to top (fell behind / stopped /
      offline / low battery) with one-tap Ping
- **[You]:** 3+ device field test of hub-and-spoke mode on a real ride

## Phase 4 — Awareness: ETA, alerts, notifications

**Goal:** the app tells you when something needs attention, instead of you staring at dots.

- [ ] Per-member ETA to destination + distance-behind-leader (shared route polyline,
      computed once by the organizer and stored in RTDB — cheaper than per-member
      Directions calls)
- [ ] Alert engine (client-side, organizer device): fell >X km behind, stopped >10 min,
      battery <15%, offline >5 min → system chat message + alerts node
- [ ] FCM push notifications: chat messages, SOS, alerts while app is backgrounded
- [ ] Rest-stop check-ins: "6/9 arrived at ☕ Chai Point" (geofence radius ~100 m)
- [ ] Breadcrumb trail: store simplified actual-route points for the summary map
- **[You]:** create FCM/VAPID keys in Firebase console; iOS PWA push requires
  installing to home screen (iOS 16.4+) — device test

## Phase 5 — Launch polish

**Goal:** production-ready for the abroad/international use case.

- [ ] Trip end summary v2: actual route map, per-member stats, shareable trip card image
- [ ] Auto-expiry: scheduled Cloud Function deletes trips 7 days after end
      (**[You]:** requires Blaze plan — or fallback: client-side cleanup on join)
- [ ] i18n scaffolding (react-i18next) + km/mi unit setting
- [ ] Offline resilience: queue position writes while offline, flush on reconnect
- [ ] Error monitoring (Sentry) + basic analytics (trip created/joined/ended)
- [ ] Lighthouse/PWA audit pass; app icons, splash screens, install prompt
- [ ] README refresh with real screenshots; landing copy
- **[You]:** Vercel env vars per environment; restrict Maps API key to production domain;
  pick RTDB region closest to your users

## Later / parking lot

- Capacitor native wrapper — true background tracking with screen off (the PWA ceiling)
- Voice notes in chat; live "follow member" camera mode; trip templates/recurring groups
