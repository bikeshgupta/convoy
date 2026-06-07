# CONVOY 🗺️

**Real-time many-to-many group trip tracker. Everyone sees everyone. Nobody gets left behind.**

CONVOY is a production-ready Progressive Web App that lets any group share live locations on a map — no accounts, no downloads required. Just share a trip code and everyone appears on the same map in real-time.

---

## Features

- 🗺️ **Live map** — all members' positions update in real-time on a shared Google Map
- 📍 **No accounts** — join with just a name and a shared trip code
- 🚗 **Transport modes** — Car, Bike, Cycling, Walking, Trekking, Boat
- 👥 **Member list** — sorted by distance, with speed, battery and heading
- 💬 **Group chat** — real-time chat with system messages for events
- 📌 **Waypoints** — drop pins with emoji categories visible to everyone
- 🆘 **SOS button** — long-press to trigger an emergency alert with location
- 👁️ **Observer mode** — join without GPS (view-only)
- 🔋 **Battery reporting** — members' battery levels shown in the UI
- 📱 **PWA** — installable, works offline with cached data
- 🌙 **Dark map theme** — custom dark Google Maps style
- ✈️ **Heading arrows** — markers rotate based on direction of travel
- 🏁 **Trip summary** — stats + confetti when you leave

---

## Tech Stack

| Package | Purpose |
|---|---|
| `vite` + `@vitejs/plugin-react` | Build tooling |
| `react` 18 | UI framework |
| `firebase` | Realtime Database |
| `@react-google-maps/api` | Google Maps integration |
| `tailwindcss` v3 | Utility CSS |
| `framer-motion` | Animations |
| `react-router-dom` v6 | Routing |
| `zustand` | State management |
| `react-hot-toast` | Toast notifications |
| `date-fns` | Date formatting |
| `@headlessui/react` | Accessible UI primitives |
| `lucide-react` | Icons |
| `nanoid` | ID generation |
| `canvas-confetti` | Trip summary celebration |
| `vite-plugin-pwa` | PWA manifest + service worker |

---

## Getting Started

```bash
git clone <your-repo-url>
cd convoy
npm install
cp .env.example .env
# Fill in your environment variables (see below)
npm run dev
```

Open http://localhost:5173

---

## Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `VITE_FIREBASE_API_KEY` | Firebase project API key | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL | Firebase Console → Realtime Database |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_APP_ID` | App ID | Firebase Console → Project Settings → General |

> **Note:** The app runs gracefully without any keys set. The map shows a placeholder and Firebase features are disabled.

---

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Click **Build → Realtime Database → Create Database**
3. Choose a region, start in **test mode** (you'll add rules below)
4. Copy the Database URL (e.g. `https://your-project-default-rtdb.firebaseio.com`)
5. Go to **Project Settings → General → Your apps → Add app → Web**
6. Register the app, copy the config values into your `.env`
7. Go to **Realtime Database → Rules** and paste:

```json
{
  "rules": {
    "trips": {
      "$tripCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

8. Click **Publish**

---

## Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Go to **APIs & Services → Library**
4. Enable **Maps JavaScript API**
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. (Recommended) Restrict the key to your domain and to the Maps JavaScript API
7. Copy the key into `VITE_GOOGLE_MAPS_API_KEY` in your `.env`

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo in the [Vercel dashboard](https://vercel.com/new). Vercel auto-detects Vite.

Add all environment variables under **Settings → Environment Variables** in your Vercel project.

---

## Firebase Database Rules

For development (permissive):

```json
{
  "rules": {
    "trips": {
      "$tripCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

For production (add auth or rate-limiting as needed).

---

## Screenshots

> _Add screenshots here_

---

## License

MIT
