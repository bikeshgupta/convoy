import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  off,
  push,
  update,
  remove,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database'
import { nanoid } from 'nanoid'

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_DATABASE_URL',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const missing = requiredVars.filter(k => !import.meta.env[k])
if (missing.length > 0) {
  console.warn(
    'Firebase env variables not set. Copy .env.example to .env and fill in your keys.\nMissing:',
    missing.join(', ')
  )
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let db = null

if (!missing.length) {
  try {
    app = initializeApp(firebaseConfig)
    db = getDatabase(app)
  } catch (e) {
    console.error('Firebase initialization failed:', e)
  }
}

export function generateMemberId() {
  return nanoid(8)
}

export { app, db, ref, set, get, onValue, off, push, update, remove, onDisconnect, serverTimestamp }
