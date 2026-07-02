import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, Bike, Activity, Footprints, Mountain, Anchor,
  RefreshCw, Check, Info, ChevronRight, Users,
} from 'lucide-react'
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

const TRANSPORT_ICONS = {
  car:      Car,
  bike:     Bike,
  cycling:  Activity,
  walking:  Footprints,
  trekking: Mountain,
  boat:     Anchor,
}

// Vehicles moving along the road grid
const VEHICLES = [
  { x1: -10, y1: 155, x2: 410, y2: 155, color: '#60a5fa', duration: 9,  delay: 0   },
  { x1: 410, y1: 325, x2: -10, y2: 325, color: '#f87171', duration: 13, delay: 2   },
  { x1: -10, y1: 490, x2: 410, y2: 490, color: '#34d399', duration: 10, delay: 5.5 },
  { x1:  85, y1: -10, x2:  85, y2: 810, color: '#fbbf24', duration: 14, delay: 1   },
  { x1: 210, y1: 810, x2: 210, y2: -10, color: '#a78bfa', duration: 10, delay: 3.5 },
  { x1: 330, y1: -10, x2: 330, y2: 810, color: '#60a5fa', duration: 12, delay: 7   },
  { x1: -10, y1: 655, x2: 410, y2: 655, color: '#f472b6', duration: 11, delay: 4   },
]

// Pulsing location pins at road intersections
const PINS = [
  { x: 85,  y: 155, delay: 0   },
  { x: 210, y: 325, delay: 0.9 },
  { x: 330, y: 155, delay: 1.7 },
  { x: 85,  y: 490, delay: 2.5 },
  { x: 330, y: 490, delay: 0.4 },
  { x: 210, y: 655, delay: 1.3 },
]

function AnimatedMapBackground() {
  return (
    <div className="fixed inset-0" style={{ background: '#09151f' }}>
      <svg
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <filter id="jv-glow-dot" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="jv-glow-pin" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* City blocks */}
        {[
          [10, 175, 55, 120], [100, 175, 80, 120], [220, 175, 80, 120], [340, 175, 55, 120],
          [10, 345, 55, 115], [100, 345, 80, 115], [220, 345, 80, 115], [340, 345, 55, 115],
          [10, 510, 55, 115], [100, 510, 80, 115], [220, 510, 80, 115], [340, 510, 55, 115],
          [10, 675, 55, 95],  [100, 675, 80,  95], [220, 675, 80,  95], [340, 675, 55,  95],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="#0e1e2e" rx={3} />
        ))}

        {/* Road surface */}
        {[
          'M -10 155 L 410 155', 'M -10 325 L 410 325',
          'M -10 490 L 410 490', 'M -10 655 L 410 655',
          'M 85 -10 L 85 810',   'M 210 -10 L 210 810',
          'M 330 -10 L 330 810',
        ].map((d, i) => (
          <path key={i} d={d} stroke="#122030" strokeWidth={13} fill="none" />
        ))}

        {/* Road edge lines */}
        {[
          'M -10 148 L 410 148', 'M -10 162 L 410 162',
          'M -10 318 L 410 318', 'M -10 332 L 410 332',
          'M -10 483 L 410 483', 'M -10 497 L 410 497',
          'M -10 648 L 410 648', 'M -10 662 L 410 662',
          'M 78 -10 L 78 810',   'M 92 -10 L 92 810',
          'M 203 -10 L 203 810', 'M 217 -10 L 217 810',
          'M 323 -10 L 323 810', 'M 337 -10 L 337 810',
        ].map((d, i) => (
          <path key={i} d={d} stroke="#18303f" strokeWidth={0.6} fill="none" />
        ))}

        {/* Center lane dashes */}
        {[
          'M -10 155 L 410 155', 'M -10 325 L 410 325',
          'M -10 490 L 410 490', 'M -10 655 L 410 655',
          'M 85 -10 L 85 810',   'M 210 -10 L 210 810',
          'M 330 -10 L 330 810',
        ].map((d, i) => (
          <path key={i} d={d} stroke="#1b3a52" strokeWidth={1} strokeDasharray="14 10" fill="none" />
        ))}

        {/* Moving vehicles */}
        {VEHICLES.map((v, i) => (
          <motion.g
            key={i}
            initial={{ x: v.x1, y: v.y1 }}
            animate={{ x: v.x2, y: v.y2 }}
            transition={{ duration: v.duration, delay: v.delay, repeat: Infinity, ease: 'linear' }}
            filter="url(#jv-glow-dot)"
          >
            <circle r={3.5} fill={v.color} opacity={0.9} />
          </motion.g>
        ))}

        {/* Pulsing location pins */}
        {PINS.map((pin, i) => (
          <g key={i} transform={`translate(${pin.x},${pin.y})`} filter="url(#jv-glow-pin)">
            <motion.circle
              r={5}
              fill="#3b82f6"
              animate={{ r: [5, 22], opacity: [0.7, 0] }}
              transition={{ duration: 2.6, delay: pin.delay, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.circle
              r={5}
              fill="#93c5fd"
              animate={{ r: [5, 13], opacity: [0.5, 0] }}
              transition={{ duration: 2.6, delay: pin.delay + 0.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <circle r={4} fill="#2563eb" />
            <circle r={2} fill="#bfdbfe" />
          </g>
        ))}
      </svg>

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 85% 85% at 50% 50%, rgba(9,21,31,0.1) 0%, rgba(9,21,31,0.72) 100%)',
        }}
      />
      {/* Top / bottom fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(9,21,31,0.55) 0%, transparent 18%, transparent 82%, rgba(9,21,31,0.55) 100%)',
        }}
      />
    </div>
  )
}

export default function JoinPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { user, loading: authLoading, signInWithGoogle } = useAuth()

  const savedTransport = localStorage.getItem(STORAGE_KEYS.transport) ?? 'car'

  const [name,      setName]      = useState('')
  const [code,      setCode]      = useState(params.get('code') ?? '')
  const [transport, setTransport] = useState(savedTransport)
  const [loading,   setLoading]   = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [tripInfo,  setTripInfo]  = useState(null)

  const { setMyInfo, setTripCode, setMemberId, setMyColor, setObserver, setMyPos, reset } = useTripStore()

  useEffect(() => { reset() }, []) // eslint-disable-line

  useEffect(() => {
    if (user) {
      setName(user.displayName?.split(' ')[0] ?? localStorage.getItem(STORAGE_KEYS.name) ?? '')
    } else if (!authLoading) {
      setName(localStorage.getItem(STORAGE_KEYS.name) ?? '')
    }
  }, [user, authLoading])

  useEffect(() => {
    if (code.length < 6 || !db) { setTripInfo(null); return }
    const t = setTimeout(async () => {
      try {
        const snap       = await get(ref(db, `trips/${code}/members`))
        const count      = snap.exists() ? Object.keys(snap.val()).length : 0
        const usedColors = snap.exists() ? Object.values(snap.val()).map(m => m.color).filter(Boolean) : []
        const metaSnap   = await get(ref(db, `trips/${code}/meta`))
        setTripInfo({ exists: metaSnap.exists(), count, usedColors })
      } catch { setTripInfo(null) }
    }, 400)
    return () => clearTimeout(t)
  }, [code])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      const msg = err?.code === 'auth/popup-blocked'
        ? 'Pop-up blocked — please allow pop-ups for this site'
        : err?.code === 'auth/network-request-failed'
        ? 'Network error — check your connection'
        : 'Sign-in failed. Please try again.'
      toast.error(msg)
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
    if (tripInfo !== null && !tripInfo.exists && !user) {
      toast('Sign in with Google to start a new trip', { icon: null })
      return
    }
    setLoading(true)
    const memberId = user ? user.uid : getOrCreateGuestId()
    const color    = assignColor(tripInfo?.usedColors ?? [])
    localStorage.setItem(STORAGE_KEYS.name,     name.trim())
    localStorage.setItem(STORAGE_KEYS.transport, transport)

    const doJoin = async (observer = false, pos = null) => {
      setMyInfo(name.trim(), transport)
      setTripCode(upperCode)
      setMemberId(memberId)
      setMyColor(color)
      setObserver(observer)
      if (pos) setMyPos(pos)

      if (db && !observer) {
        const memberRef   = ref(db, `trips/${upperCode}/members/${memberId}`)
        const existing    = await get(memberRef)
        const isRejoin    = existing.exists()
        const memberColor = isRejoin ? (existing.val()?.color ?? color) : color
        setMyColor(memberColor)
        await set(memberRef, {
          name: name.trim(), transport, color: memberColor,
          lat: pos?.lat ?? null, lng: pos?.lng ?? null, speed: 0, heading: 0, battery: 100,
          accuracy: 0, lastSeen: serverTimestamp(), isOnline: true,
          joinedAt: isRejoin ? existing.val().joinedAt : serverTimestamp(),
        })
        await push(ref(db, `trips/${upperCode}/chat`), {
          text:       isRejoin ? `${name.trim()} rejoined the trip` : `${name.trim()} joined the trip`,
          senderName: 'System',
          senderId:   'system',
          timestamp:  serverTimestamp(),
          type:       'system',
        })
      }
      navigate(`/trip/${upperCode}`)
    }

    try {
      // 8s was too short for a cold high-accuracy GPS fix — users were being
      // silently dumped into observer mode. Accept a fix up to 30s old so a
      // recent cached position resolves instantly.
      const fix = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 20000, maximumAge: 30000, enableHighAccuracy: true,
        })
      })
      await doJoin(false, { lat: fix.coords.latitude, lng: fix.coords.longitude })
    } catch {
      toast("Joining as observer — you'll start sharing once GPS is found")
      await doJoin(true)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#09151f' }}>
        <div className="text-sm animate-pulse" style={{ color: '#3b6a8a' }}>Loading…</div>
      </div>
    )
  }

  const showNewTripNotice = tripInfo !== null && !tripInfo.exists && !user

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedMapBackground />

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-10 pb-8 max-w-sm mx-auto overflow-y-auto">

        {/* Wordmark */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              textShadow: '0 0 36px rgba(59,130,246,0.55)',
            }}
          >
            CONVOY
          </h1>
          <p className="text-sm mt-1.5" style={{ color: '#5b8aaa' }}>
            Trusted group travel coordination
          </p>
        </motion.div>

        {/* ── Single unified card ───────────────────────────────────── */}
        <motion.div
          className="w-full rounded-card overflow-hidden"
          style={{
            background:  'rgba(255,255,255,0.97)',
            boxShadow:   '0 28px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Profile header — slides in when signed in */}
          <AnimatePresence initial={false}>
            {user && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              >
                <div className="flex items-center justify-between px-6 pt-5 pb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="w-8 h-8 rounded-full flex-shrink-0"
                        style={{ outline: '2px solid #E2E8F0', outlineOffset: 1 }}
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#EFF6FF' }}
                      >
                        <Users size={14} color="#2563EB" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 leading-tight truncate">
                        {user.displayName ?? user.email}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Signed in with Google</div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/history')}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-btn transition-opacity hover:opacity-80 flex-shrink-0 ml-2"
                    style={{ background: '#EFF6FF', color: '#2563EB' }}
                  >
                    My Trips
                    <ChevronRight size={12} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="h-px" style={{ background: '#F1F5F9' }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* All form fields + CTAs in one block — no dividers */}
          <div className="px-6 pt-5 pb-6 space-y-4">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                maxLength={20}
                placeholder="e.g. Priya"
                className="w-full px-4 py-3 text-sm text-slate-800 outline-none transition-all rounded-input"
                style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff' }}
                onBlur={e  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }}
              />
            </div>

            {/* Trip Code */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500">Trip Code</label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TREK2847"
                  maxLength={10}
                  className="w-full px-4 py-3 pr-24 text-sm text-slate-800 outline-none transition-all rounded-input"
                  style={{
                    background:    '#F8FAFC',
                    border:        '1.5px solid #E2E8F0',
                    fontFamily:    '"Space Mono", monospace',
                    letterSpacing: '0.06em',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#fff' }}
                  onBlur={e  => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }}
                />
                <button
                  onClick={() => setCode(generateTripCode())}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#2563EB' }}
                >
                  <RefreshCw size={11} strokeWidth={2.5} />
                  Generate
                </button>
              </div>
              <p className="text-xs ml-0.5" style={{ color: getTripInfoColor(tripInfo, code) }}>
                {getTripInfoText(tripInfo, code)}
              </p>
            </div>

            {/* Travel Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-500">Travel Mode</label>
              <div className="grid grid-cols-3 gap-1.5">
                {TRANSPORT_OPTIONS.map(opt => {
                  const Icon = TRANSPORT_ICONS[opt.id] ?? Car
                  const sel  = transport === opt.id
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => setTransport(opt.id)}
                      className="flex flex-col items-center gap-1.5 py-2.5 rounded-input transition-colors"
                      style={{
                        background: sel ? '#EFF6FF' : '#F8FAFC',
                        border:     `1.5px solid ${sel ? '#2563EB' : '#E2E8F0'}`,
                      }}
                      whileTap={{ scale: 0.93 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <Icon size={19} color={sel ? '#2563EB' : '#94A3B8'} strokeWidth={1.75} />
                      <span
                        className="text-[11px] font-medium leading-none"
                        style={{ color: sel ? '#1E40AF' : '#64748B' }}
                      >
                        {opt.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* ── Action buttons — single section, no divider ──────────── */}
            <AnimatePresence mode="wait" initial={false}>
              {showNewTripNotice ? (
                <motion.div
                  key="new-trip-notice"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2 pt-1"
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2.5 rounded-input"
                    style={{ background: '#EFF6FF' }}
                  >
                    <Info size={12} color="#2563EB" className="flex-shrink-0" />
                    <span className="text-xs" style={{ color: '#1E40AF' }}>
                      Creating a new trip requires a Google account
                    </span>
                  </div>
                  <motion.button
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-btn font-semibold text-sm text-white disabled:opacity-60"
                    style={{ background: '#2563EB' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <GoogleIconWhite />
                    {signingIn ? 'Signing in…' : 'Sign in to Start Trip'}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="normal-actions"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="space-y-2 pt-1"
                >
                  {/* Primary CTA */}
                  <motion.button
                    onClick={join}
                    disabled={!name.trim() || !code.trim() || loading || showNewTripNotice}
                    className="w-full py-3.5 rounded-btn font-semibold text-sm text-white disabled:opacity-40"
                    style={{ background: loading ? '#374151' : '#111827' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    {loading ? 'Locating…' : tripInfo?.exists ? 'Join Trip' : 'Start Trip'}
                  </motion.button>

                  {/* Google sign-in — secondary, only when not signed in */}
                  {!user && (
                    <>
                      <motion.button
                        onClick={handleGoogleSignIn}
                        disabled={signingIn}
                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-btn text-sm font-medium text-slate-600 disabled:opacity-60 hover:opacity-90 transition-opacity"
                        style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <GoogleIcon />
                        {signingIn ? 'Signing in…' : 'Continue with Google'}
                      </motion.button>

                      <div className="flex items-center justify-center gap-3 pt-0.5 flex-wrap">
                        {['Save trips', 'Sync devices', 'View history'].map(b => (
                          <div key={b} className="flex items-center gap-1">
                            <Check size={10} color="#10B981" strokeWidth={2.5} />
                            <span className="text-[11px] text-slate-400">{b}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-xs text-center mt-4"
          style={{ color: '#3d6680' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Works across iPhone, Android and desktop
        </motion.p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function GoogleIconWhite() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="rgba(255,255,255,0.9)"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="rgba(255,255,255,0.9)"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="rgba(255,255,255,0.9)"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="rgba(255,255,255,0.9)"/>
    </svg>
  )
}

function getTripInfoColor(tripInfo, code) {
  if (code.length < 6) return '#94A3B8'
  if (!tripInfo)       return '#94A3B8'
  return tripInfo.exists ? '#10B981' : '#2563EB'
}

function getTripInfoText(tripInfo, code) {
  if (code.length < 6) return 'Enter the code shared by your group'
  if (!tripInfo)       return 'Checking…'
  if (tripInfo.exists) return `${tripInfo.count} member${tripInfo.count !== 1 ? 's' : ''} active`
  return 'New trip will be created'
}
