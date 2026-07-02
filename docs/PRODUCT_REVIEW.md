# Convoy — Full Product Review & Redesign Plan

*Review date: July 2026 · Scope: entire application (code, product, UX, security)*

Convoy is a real-time, many-to-many group location-sharing PWA (React + Vite + Firebase RTDB
+ Google Maps). The concept is strong — "share a code, see everyone on one map" — and the
foundations (live sync, chat, waypoints, SOS) already exist. This document covers:

1. [Why location wasn't working on trip start (fixed)](#1-the-trip-start-location-bug--fixed-in-this-branch)
2. [The biggest product gap: your stated permission model isn't implemented](#2-critical-gap-the-adminjoiner-visibility-model-doesnt-exist-yet)
3. [Other bugs found in review](#3-other-bugs-found)
4. [Product redesign — the proper use case](#4-product-redesign--trip-lifecycle)
5. [Functionality roadmap (P0 → P2)](#5-functionality-roadmap)
6. [UI redesign direction + mockups](#6-ui-redesign)
7. [Security & production readiness](#7-security--production-readiness)

---

## 1. The trip-start location bug — FIXED in this branch

"I'm not getting location when starting any trip" was **three stacked bugs**:

### Bug 1 — the 8-second GPS trap → permanent observer mode
`JoinPage.jsx` requested the position with `timeout: 8000` and no `maximumAge`. A cold,
high-accuracy GPS fix routinely takes 10–30 s (longer indoors). When it timed out, the app
silently joined you as an **observer** — and nothing in the app ever cleared the observer
flag, so `useTrip` blocked every location push **for the entire trip**, even after GPS
locked seconds later.

**Fix:** timeout raised to 20 s, `maximumAge: 30000` (a recent cached fix resolves
instantly), and `TripPage` now **auto-upgrades** an observer to a sharing member the moment
a real fix arrives, with a "GPS locked" toast.

### Bug 2 — trip init wiped your coordinates
`useTrip` initialised the member record with `set()` — a *full node replace* — using
`memberData`, which contains **no lat/lng**. If your first GPS fix was pushed before init's
network round-trip finished, the coordinates were deleted. Combined with Bug 3, they were
often never written again.

**Fix:** init now uses `update()` (merge) and never touches lat/lng.

### Bug 3 — stationary users never push and go "offline"
Location was pushed only when `myPos` changed, and `useGeolocation` filters out movement
under 3 m as noise. Starting a trip while standing still (i.e. always) meant no second push
ever happened — and after 30 s of no `lastSeen` updates, everyone else marked you **stale /
offline**.

**Fix:** a 20-second heartbeat in `useTrip` refreshes `lastSeen`, `isOnline` and the latest
position regardless of movement.

Also fixed while in there: `usedColors` was never populated on join, so `assignColor()`
always picked the first palette color — several members could get identical markers.

---

## 2. CRITICAL GAP: the admin/joiner visibility model doesn't exist yet

You described the intended product as:

> "Admin can see the location of all the people; the other joiners can not see everyone —
> they can see the destination and the middle points."

**What the code actually does:** `useMembers` subscribes every member to
`trips/{code}/members` and renders *all* members to *everyone*. The only creator-only
control is waypoint type (rest/destination) in `WaypointPicker`. There is **no role-based
location visibility at all** — and with the current Firebase rules (`.read: true`), even a
non-member who knows the code can read every location from the raw database.

This is the single most important feature to build, because it is also your **privacy
story** — the thing that makes people comfortable using a location app abroad.

### Proposed visibility model

| Capability | Organizer (admin) | Member | Observer/Guest |
|---|---|---|---|
| See all members live | ✅ | Configurable per trip | ❌ |
| See destination + waypoints | ✅ | ✅ | ✅ |
| See organizer's position | ✅ | ✅ (lead vehicle) | ❌ |
| See own position | ✅ | ✅ | ✅ |
| Set destination / rest stops | ✅ | ❌ | ❌ |
| Approve join requests | ✅ | ❌ | — |
| End trip for everyone | ✅ | ❌ | — |
| Per-member "ghost mode" (pause sharing) | — | ✅ | — |

Trip-level sharing presets the organizer picks at creation:
- **Everyone sees everyone** (today's behavior — good for small friend groups)
- **Hub & spoke** (members see only organizer + route; organizer sees all — your stated model)
- **Proximity mode** (members see others only within X km — useful for big convoys)

### Enforcement — must be server-side, not UI-only

Client-side filtering can be bypassed by reading the DB directly. Restructure data so rules
can enforce visibility:

```
trips/{code}/
  meta/            { createdBy, mode, isActive, createdAt, endedAt }
  roles/{uid}      "organizer" | "member" | "observer"
  positions/{uid}  { lat, lng, speed, heading, battery, lastSeen }   ← rule-guarded
  profiles/{uid}   { name, transport, color, joinedAt }              ← readable by trip members
  waypoints/       readable by all trip members
  chat/
  sos/
```

With RTDB rules, `positions/{uid}` becomes readable only by the organizer + the user
themselves in hub-and-spoke mode. (If rules get too gnarly, this is the point to move to
Firestore or put Cloud Functions in front — see §7.)

---

## 3. Other bugs found

| # | Severity | Where | Issue |
|---|---|---|---|
| 1 | High | README / Firebase rules | Rules only cover `trips/*`; the `users/{uid}/trips` history writes are **silently denied** — trip history never saves. Add a `users` rule. |
| 2 | High | `SOSButton.jsx` / `TripPage.jsx` | SOS records are never resolved. Every old SOS re-fires the alarm overlay + vibration for anyone who (re)joins, forever. Needs a "resolve" action and `resolved` filtering by timestamp. |
| 3 | Med | `ConvoyMap.jsx` | `center={myPos ?? …}` re-centers the map on **every** GPS tick, fighting the user's panning/zooming. Center once, then only on the ◎ button. |
| 4 | Med | `ConvoyMap.jsx`, `TopBar.jsx` | Zustand selectors return fresh objects without `useShallow` → re-render on every store change (map re-renders on every chat message). |
| 5 | Med | `useMembers.js` | `myPos` in the effect deps re-subscribes the Firebase listener on every GPS movement — wasteful; compute distances outside the subscription. |
| 6 | Med | `TripPage.jsx` | Battery warning effect runs once on mount, when battery is still the default `100` — the warning can never fire. Should watch the value. |
| 7 | Med | Mobile browsers | No Screen Wake Lock → phone locks → browser suspends JS → location stops for that member. Use `navigator.wakeLock` + visibilitychange re-acquire. This is the #1 real-world reliability issue for a tracking PWA. |
| 8 | Low | `useTrip.js` | The 5-second `timeEnough` condition is only *evaluated* when `myPos` changes — it never fires on its own (now mitigated by the heartbeat). |
| 9 | Low | `useBattery.js` | `removeEventListener` passes a new anonymous fn — never unsubscribes. |
| 10 | Low | `TopBar.jsx` | `onlineCount + 1` always counts yourself as live, even when offline/observer. |
| 11 | Low | `TripPage.jsx` | Connection toast fires "Connection lost" on first mount before the first `.info/connected` snapshot arrives. |
| 12 | Low | `MemberMarker.jsx` | Heading rotation rotates the whole avatar circle (emoji ends up sideways). Rotate a separate direction arrow instead. |
| 13 | Low | Store | Zustand store isn't persisted → any page refresh mid-trip bounces you to the join screen to re-enter your name. Use `persist` middleware (sessionStorage). |

---

## 4. Product redesign — trip lifecycle

Today a "trip" is just a code that lives forever. A real product needs a **lifecycle**:

```
DRAFT ──▶ ACTIVE ──▶ ENDED (summary saved) ──▶ auto-deleted after N days
  │
  └─ organizer sets: name, destination, mode of sharing, join approval on/off
```

### Create flow (organizer) — "destination-first"
1. Sign in (already required) → **"Start a trip"**
2. Name the trip ("Goa Ride 🏍"), search & set **destination** up front (today you can only
   set it after joining, buried in the Pin tab)
3. Pick sharing mode (everyone / hub-and-spoke / proximity)
4. Get a code + share sheet + **QR code** (huge for in-person groups)

### Join flow (member)
1. Open link / scan QR → trip preview: name, organizer, destination, member count,
   **what will be shared with whom** (explicit privacy consent screen)
2. One tap join → GPS acquired *in the background* while you're already on the map
   (never block joining on a GPS fix — the fix in this branch makes that graceful)

### During trip
- ETA-to-destination per member, "X km behind the leader"
- Auto-alerts: member fell > X km behind, member stopped > 10 min, member battery < 15 %,
  member offline > 5 min → system message in chat + push notification
- Rest-stop check-ins: "8/10 arrived at ☕ Chai Point"

### End trip
- Organizer ends for all → summary screen for everyone (distance, duration, top speed, map
  of the actual route travelled) → history saved → **RTDB node deleted** (privacy + cost)

### Abroad / international use (your stated goal)
- **i18n** from day one (react-i18next) + RTL support
- Unit setting (km/mi)
- **Offline resilience**: queue position writes while offline, sync on reconnect; cache map
  tiles for the planned route
- SMS-able invite links (WhatsApp deep link) since data roaming is spotty
- Consider Firebase RTDB region choice for latency (default is US)

---

## 5. Functionality roadmap

### P0 — correctness & trust (do before any launch)
- [x] Location-on-start bug (this branch)
- [ ] Server-enforced roles & visibility model (§2)
- [ ] Real Firebase security rules (§7)
- [ ] Trip lifecycle: end trip, auto-expire, delete data
- [ ] SOS resolve flow (mark safe, who's responding)
- [ ] Screen Wake Lock + visibility-change recovery
- [ ] Store persistence across refresh

### P1 — makes it feel like a product
- [ ] Destination-first trip creation + QR invite
- [ ] Join preview + privacy consent screen
- [ ] Smart alerts (fell behind / stopped / low battery / offline)
- [ ] Per-member ETA & distance-to-destination
- [ ] Push notifications (FCM) — chat, SOS, alerts while backgrounded
- [ ] Ghost mode / pause sharing toggle per member
- [ ] Breadcrumb trail (actual route travelled, for the summary map)

### P2 — delight & growth
- [ ] Trip templates & recurring groups ("Sunday Riders")
- [ ] Voice notes in chat (roaming-friendly)
- [ ] Live "follow" camera mode on a chosen member
- [ ] Geofenced arrival auto-check-in
- [ ] Native wrapper (Capacitor) for true background tracking — a PWA fundamentally cannot
      track with the screen off on iOS; this is the eventual ceiling

---

## 6. UI redesign

**See the interactive mockups: [`docs/mockups/convoy-ui-concepts.html`](mockups/convoy-ui-concepts.html)**
(open in any browser — 6 phone-frame screens).

### Diagnosis of the current UI
- **Two apps in one**: the join screen is a clean light fintech card; the trip screen is a
  neon-green "hacker terminal" (Space Mono, `#00FF88`, uppercase labels). Pick one voice.
- Emoji are doing icon duty everywhere (tabs 🗺️👥💬, markers 🚗, waypoints ☕) — feels
  prototype-y and renders inconsistently across platforms. Use Lucide icons (already a
  dependency) + custom map pins.
- Dashed lines drawn from you to *every* member clutters the map at > 3 members.
- Information hierarchy: trip code, live count, route ETA, invite, leave — all crammed in a
  60 px top bar at 10 px font.

### Proposed direction — "calm navigation" design language
- **One dark, map-first theme**: deep navy surface (`#0B1220`), single accent
  `#3B82F6` → teal `#2DD4BF` for routes; member colors stay as identity accents. The neon
  green stays for exactly one thing: *you*.
- Typography: Inter everywhere; mono only for the trip code. Sentence case, larger minimums
  (12 px+).
- **Top bar → floating "trip pill"**: trip name + ETA chip + member avatars stack; tap to
  expand trip details/invite. Map gets the full bleed.
- **Bottom sheet, not tab panels**: one persistent sheet with 3 detents (peek: member
  avatar row · half: member list/chat · full: route & stops). This is the Google
  Maps/FindMy pattern users already know.
- **Marker system**: teardrop pin with member color, initial/photo inside, small rotating
  direction arrow *outside* the pin, speed chip on select. Offline = desaturated + dashed
  "last seen" ring.
- **Organizer badge** (crown/shield) on the admin's pin & list row — makes the role model
  visible.
- SOS: keep the hold-to-trigger button but move it into the sheet header as a persistent
  red pill; full-screen takeover for receivers with two actions: **Navigate** / **I'm
  responding**, and organizer-only **Mark safe**.
- Empty states with purpose: after creating, the map shows a share card ("You're live.
  Bring your convoy.") with code + QR, instead of a lone marker.

---

## 7. Security & production readiness

Current state: **anyone with a trip code (or just the DB URL) can read and write everything
in a trip** — spoof any member's location, wipe waypoints, trigger fake SOS. The README's
recommended rules are `.read: true / .write: true`.

Minimum production rules (with the §2 data model):

```jsonc
{
  "rules": {
    "trips": {
      "$code": {
        "meta":      { ".read": "auth != null", ".write": "auth != null && (!data.exists() || data.child('createdBy').val() === auth.uid)" },
        "roles":     { ".read": "auth != null", "$uid": { ".write": "auth.uid === $uid || root.child('trips').child($code).child('meta/createdBy').val() === auth.uid" } },
        "positions": {
          "$uid": {
            ".write": "auth.uid === $uid",
            ".read":  "auth.uid === $uid
                       || root.child('trips').child($code).child('meta/createdBy').val() === auth.uid
                       || root.child('trips').child($code).child('meta/mode').val() === 'everyone'"
          }
        },
        "waypoints": { ".read": "auth != null", ".write": "root.child('trips').child($code).child('meta/createdBy').val() === auth.uid" },
        "chat":      { ".read": "auth != null", ".write": "auth != null" }
      }
    },
    "users": { "$uid": { ".read": "auth.uid === $uid", ".write": "auth.uid === $uid" } }
  }
}
```

Requires **Firebase Anonymous Auth for guests** (one line: `signInAnonymously`) so every
member has an `auth.uid` — guests keep the no-account UX, rules get a real identity. Also:

- Validate writes (`.validate` lat is a number in range, name length ≤ 20, etc.)
- Rate-limit chat/SOS via `newData.child('timestamp')` checks or Cloud Functions
- Scheduled Cloud Function to delete trips where `endedAt` (or `createdAt`) > 7 days
- Restrict the Maps API key by domain + API; move Directions calls behind a proxy if usage
  grows (each member currently makes their own Directions request — organizer should
  compute the route once and share the encoded polyline via RTDB, which is also cheaper)

---

## Suggested build order

1. **Week 1–2 (P0):** security rules + anonymous auth + data model restructure + trip
   lifecycle + wake lock. *(The location fix is already merged in this branch.)*
2. **Week 3–4:** visibility modes (§2) + destination-first creation + QR invites + join
   consent screen — this is the launchable "super app" core.
3. **Week 5+:** alerts, ETA per member, FCM push, UI redesign rollout per §6 mockups.
