import { createContext, useContext, useEffect, useState } from 'react'
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  firebaseSignOut,
  onAuthStateChanged,
} from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still loading, null = auth not configured, object = signed in
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    if (!auth) { setUser(null); return }

    // Handle the result when we land back from a redirect sign-in on mobile
    getRedirectResult(auth).catch(() => {})

    const unsub = onAuthStateChanged(auth, u => {
      if (u) {
        setUser(u)
      } else {
        // Guests get an anonymous auth uid so security rules always have an
        // identity to check — no more unauthenticated database access
        signInAnonymously(auth).catch(() => setUser(null))
      }
    })
    return unsub
  }, [])

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not configured')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      // Popups are blocked in some mobile browsers — fall back to redirect
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, googleProvider)
      } else {
        throw e
      }
    }
  }

  // Signing out of Google drops back to a fresh anonymous session
  const signOut = () => auth && firebaseSignOut(auth)

  const isGoogleUser = !!user && !user.isAnonymous

  return (
    <AuthContext.Provider value={{ user, isGoogleUser, loading: user === undefined, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
