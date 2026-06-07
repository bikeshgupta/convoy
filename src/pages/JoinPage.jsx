import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useTripStore from '../store/tripStore'
import { TRANSPORT_OPTIONS } from '../utils/transport'
import { generateTripCode, validateTripCode } from '../utils/tripCode'
import { assignColor } from '../utils/colors'
import { generateMemberId, db, ref, get, set, push, serverTimestamp } from '../firebase'

const STORAGE_KEYS = {
  memberId:  'convoy_member_id',
  name:      'convoy_user_name',
  transport: 'convoy_user_transport',
}

function getOrCreateMemberId() {
  const stored = localStorage.getItem(STORAGE_KEYS.memberId)
  if (stored) return stored
  const id = generateMemberId()
  localStorage.setItem(STORAGE_KEYS.memberId, id)
  return id
}

export default function JoinPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const savedName      = localStorage.getItem(STORAGE_KEYS.name) ?? ''
  const savedTransport = localStorage.getItem(STORAGE_KEYS.transport) ?? 'car'

  const [name,      setName]      = useState(savedName)
  const [code,      setCode]      = useState(params.get('code') ?? '')
  const [transport, setTransport] = useState(savedTransport)
  const [loading,   setLoading]   = useState(false)
  const [tripInfo,  setTripInfo]  = useState(null)

  const { setMyInfo, setTripCode, setMemberId, setMyColor, setObserver, reset } = useTripStore()

  useEffect(() => { reset() }, []) // eslint-disable-line

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

  const join = async () => {
    if (!name.trim() || !code.trim()) return
    const upperCode = code.toUpperCase()
    if (!validateTripCode(upperCode)) {
      toast.error('Invalid trip code format')
      return
    }

    setLoading(true)
    const memberId = getOrCreateMemberId()
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

  const isReturningUser = !!savedName

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #EEF2FF 0%, #F0FDF4 55%, #E0F2FE 100%)' }}
    >
      {/* Subtle dot grid */}
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
          className="text-center mb-10"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div
            className="font-display"
            style={{ fontSize: 76, letterSpacing: 10, lineHeight: 1, color: '#0F172A' }}
          >
            CONVOY
          </div>
          <p className="font-body text-slate-500 text-sm mt-2 tracking-wide">
            Everyone sees everyone. Nobody gets left behind.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="w-full max-w-sm rounded-3xl p-7 space-y-5"
          style={{
            background:  '#FFFFFF',
            boxShadow:   '0 8px 32px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.06)',
            border:      '1px solid rgba(226,232,240,0.8)',
          }}
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
        >
          {/* Returning user badge */}
          {isReturningUser && (
            <motion.div
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <span className="text-base">👋</span>
              <span className="font-body text-emerald-700 text-sm font-medium">
                Welcome back, {savedName}!
              </span>
            </motion.div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="font-mono text-slate-400 text-xs uppercase tracking-widest">
              Your Name
            </label>
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
            <label className="font-mono text-slate-400 text-xs uppercase tracking-widest">
              Trip Code
            </label>
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
            <label className="font-mono text-slate-400 text-xs uppercase tracking-widest">
              Your Vehicle
            </label>
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
                  <span className="font-mono text-slate-500" style={{ fontSize: 9 }}>
                    {opt.label}
                  </span>
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
            { icon: '💬', label: 'Group chat' },
            { icon: '🗺️', label: 'Waypoints' },
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

function getTripInfoColor(tripInfo, code) {
  if (code.length < 6) return '#94A3B8'
  if (!tripInfo)       return '#94A3B8'
  return tripInfo.exists ? '#10B981' : '#3B82F6'
}

function getTripInfoText(tripInfo, code) {
  if (code.length < 6) return 'Enter code shared by group'
  if (!tripInfo)        return 'Checking...'
  if (tripInfo.exists)  return `● ${tripInfo.count} member${tripInfo.count !== 1 ? 's' : ''} active`
  return '✦ New trip will be created'
}
