import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import useTripStore from '../store/tripStore'
import { useAuth } from '../contexts/AuthContext'
import { TRANSPORT_OPTIONS } from '../utils/transport'
import { generateTripCode, validateTripCode } from '../utils/tripCode'
import { assignColor } from '../utils/colors'
import { generateMemberId, db, ref, get, set, push, serverTimestamp } from '../firebase'

const STORAGE_KEYS = {
  guestId:   'convoy_guest_id',
  name:      'convoy_user_name',
  transport: 'convoy_user_transport',
}

function getOrCreateGuestId() {
  const stored = localStorage.getItem(STORAGE_KEYS.guestId)
  if (stored) return stored
  const id = generateMemberId()
  localStorage.setItem(STORAGE_KEYS.guestId, id)
  return id
}

export default function JoinPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, loading: authLoading, signInWithGoogle } = useAuth()

  const savedTransport = localStorage.getItem(STORAGE_KEYS.transport) ?? 'car'

  const [name,       setName]       = useState('')
  const [code,       setCode]       = useState(params.get('code') ?? '')
  const [transport,  setTransport]  = useState(savedTransport)
  const [loading,    setLoading]    = useState(false)
  const [signingIn,  setSigningIn]  = useState(false)
  const [tripInfo,   setTripInfo]   = useState(null)

  const { setMyInfo, setTripCode, setMemberId, setMyColor, setObserver, reset } = useTripStore()

  useEffect(() => { reset() }, []) // eslint-disable-line

  // Pre-fill name from Google profile or localStorage
  useEffect(() => {
    if (user) {
      setName(user.displayName?.split(' ')[0] ?? localStorage.getItem(STORAGE_KEYS.name) ?? '')
    } else if (!authLoading) {
      setName(localStorage.getItem(STORAGE_KEYS.name) ?? '')
    }
  }, [user, authLoading])

  // Check trip existence when code is long enough
  useEffect(() => {
    if (code.length < 6 || !db) { setTripInfo(null); return }
    const t = setTimeout(async () => {
      try {
        const snap = await get(ref(db, `trips/${code}/members`))
        const count = snap.exists() ? Object.keys(snap.val()).length : 0
        const metaSnap = await get(ref(db, `trips/${code}/meta`))
        setTripInfo({ exists: metaSnap.exists(), count })
      } catch { setTripInfo(null) }
    }, 400)
    return () => clearTimeout(t)
  }, [code])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch {
      toast.error('Sign-in failed. Please try again.')
    } finally {
      setSigningIn(false)
    }
  }

  const join = async () => {
    if (!name.trim() || !code.trim()) return
    const upperCode = code.toUpperCase()
    if (!validateTripCode(upperCode)) {
      toast.error('Invalid trip code format')
      return
    }

    setLoading(true)

    // Authenticated users get their UID as stable cross-device memberId
    const memberId = user ? user.uid : getOrCreateGuestId()
    const color    = assignColor(tripInfo?.usedColors ?? [])

    localStorage.setItem(STORAGE_KEYS.name,      name.trim())
    localStorage.setItem(STORAGE_KEYS.transport,  transport)

    const doJoin = async (observer = false) => {
      setMyInfo(name.trim(), transport)
      setTripCode(upperCode)
      setMemberId(memberId)
      setMyColor(color)
      setObserver(observer)

      if (db && !observer) {
        const memberRef  = ref(db, `trips/${upperCode}/members/${memberId}`)
        const existing   = await get(memberRef)
        const isRejoin   = existing.exists()
        const memberColor = isRejoin ? (existing.val()?.color ?? color) : color

        setMyColor(memberColor)

        await set(memberRef, {
          name:      name.trim(),
          transport,
          color:     memberColor,
          lat:       null,
          lng:       null,
          speed:     0,
          heading:   0,
          battery:   100,
          accuracy:  0,
          lastSeen:  serverTimestamp(),
          isOnline:  true,
          joinedAt:  isRejoin ? existing.val().joinedAt : serverTimestamp(),
        })

        await push(ref(db, `trips/${upperCode}/chat`), {
          text:       isRejoin
            ? `${name.trim()} rejoined the trip`
            : `${name.trim()} joined the trip`,
          senderName: 'System',
          senderId:   'system',
          timestamp:  serverTimestamp(),
          type:       'system',
        })
      }

      navigate(`/trip/${upperCode}`)
    }

    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true })
      })
      await doJoin(false)
    } catch {
      toast('Joining as observer (view only)', { icon: '👁️' })
      await doJoin(true)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(150deg, #EEF2FF 0%, #F0FDF4 55%, #E0F2FE 100%)' }}
      >
        <div className="font-mono text-slate-500 text-sm animate-pulse">Loading…</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #EEF2FF 0%, #F0FDF4 55%, #E0F2FE 100%)' }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
          backgroundSize:  '28px 28px',
          opacity:         0.6,
        }}
      />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-14 pb-10">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="font-display" style={{ fontSize: 76, letterSpacing: 10, lineHeight: 1, color: '#0F172A' }}>
            CONVOY
          </div>
          <p className="font-body text-slate-500 text-sm mt-2 tracking-wide">
            Everyone sees everyone. Nobody gets left behind.
          </p>
        </motion.div>

        {/* Auth / Profile bar */}
        <motion.div
          className="w-full max-w-sm mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div
                key="profile"
                className="flex items-center justify-between rounded-2xl px-4 py-3"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(15,23,42,0.07)', border: '1px solid rgba(226,232,240,0.8)' }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="avatar" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
                  )}
                  <div>
                    <div className="font-body text-slate-800 text-sm font-semibold leading-tight">
                      {user.displayName ?? user.email}
                    </div>
                    <div className="font-mono text-slate-400 text-xs">Signed in with Google</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: '#F1F5F9', color: '#475569' }}
                >
                  My Trips
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="signin"
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="w-full flex items-center justify-center gap-3 rounded-2xl px-4 py-3.5 font-body font-semibold text-sm text-slate-700 transition-all disabled:opacity-60"
                style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(15,23,42,0.07)', border: '1px solid rgba(226,232,240,0.8)' }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.98 }}
              >
                <GoogleIcon />
                {signingIn ? 'Signing in…' : 'Sign in with Google'}
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Form card */}
        <motion.div
          className="w-full max-w-sm rounded-3xl p-7 space-y-5"
          style={{
            background:  '#FFFFFF',
            boxShadow:   '0 8px 32px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.06)',
            border:      '1px solid rgba(226,232,240,0.8)',
          }}
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {!user && (
            <p className="font-mono text-slate-400 text-center" style={{ fontSize: 10 }}>
              Sign in above to save trip history across devices
            </p>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 text-xs uppercase tracking-widest">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
              maxLength={20}
              placeholder="e.g. Rahul"
              className="w-full rounded-xl px-4 py-3 font-body text-slate-800 text-sm outline-none transition-colors"
              style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
              onFocus={e => (e.target.style.borderColor = '#10B981')}
              onBlur={e  => (e.target.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Trip code */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 text-xs uppercase tracking-widest">Trip Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. TREK2847"
              className="w-full rounded-xl px-4 py-3 font-mono text-slate-800 text-sm outline-none tracking-widest transition-colors"
              style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
              onFocus={e => (e.target.style.borderColor = '#10B981')}
              onBlur={e  => (e.target.style.borderColor = '#E2E8F0')}
            />
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-mono text-xs" style={{ color: getTripInfoColor(tripInfo, code) }}>
                {getTripInfoText(tripInfo, code)}
              </span>
              <button
                onClick={() => setCode(generateTripCode())}
                className="font-mono text-xs font-bold transition-opacity hover:opacity-70"
                style={{ color: '#10B981' }}
              >
                Generate →
              </button>
            </div>
          </div>

          {/* Transport */}
          <div className="space-y-2">
            <label className="font-mono text-slate-400 text-xs uppercase tracking-widest">Your Vehicle</label>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {TRANSPORT_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setTransport(opt.id)}
                  className="flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 flex-shrink-0 transition-all"
                  style={{
                    background: transport === opt.id ? '#F0FDF4' : '#F8FAFC',
                    border:     transport === opt.id ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
                  }}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="font-mono text-slate-500" style={{ fontSize: 9 }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Join button */}
          <motion.button
            onClick={join}
            disabled={!name.trim() || !code.trim() || loading}
            className="w-full py-4 rounded-xl font-mono font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-40"
            style={{ background: '#00FF88', color: '#0F172A', letterSpacing: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? '📡 Locating...' : 'Join Trip →'}
          </motion.button>

          <p className="font-mono text-slate-400 text-center" style={{ fontSize: 11 }}>
            No account needed · Works on any phone
          </p>
        </motion.div>

        {/* Features row */}
        <motion.div
          className="flex gap-6 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { icon: '📍', label: 'Live tracking' },
            { icon: '💬', label: 'Group chat'   },
            { icon: '🗺️', label: 'Waypoints'    },
          ].map(f => (
            <div key={f.label} className="flex flex-col items-center gap-1">
              <span className="text-xl">{f.icon}</span>
              <span className="font-mono text-slate-400" style={{ fontSize: 10 }}>{f.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function getTripInfoColor(tripInfo, code) {
  if (code.length < 6) return '#94A3B8'
  if (!tripInfo)        return '#94A3B8'
  return tripInfo.exists ? '#10B981' : '#3B82F6'
}

function getTripInfoText(tripInfo, code) {
  if (code.length < 6) return 'Enter code shared by group'
  if (!tripInfo)        return 'Checking...'
  if (tripInfo.exists)  return `● ${tripInfo.count} member${tripInfo.count !== 1 ? 's' : ''} active`
  return '✦ New trip will be created'
}
