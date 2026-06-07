import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useTripStore from '../store/tripStore'
import { TRANSPORT_OPTIONS } from '../utils/transport'
import { generateTripCode, validateTripCode } from '../utils/tripCode'
import { assignColor } from '../utils/colors'
import { generateMemberId, db, ref, get, set, push, serverTimestamp } from '../firebase'

export default function JoinPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [name,      setName]      = useState('')
  const [code,      setCode]      = useState(params.get('code') ?? '')
  const [transport, setTransport] = useState('car')
  const [loading,   setLoading]   = useState(false)
  const [tripInfo,  setTripInfo]  = useState(null) // null | { exists, count }

  const { setMyInfo, setTripCode, setMemberId, setMyColor, setObserver, reset } = useTripStore()

  useEffect(() => { reset() }, []) // eslint-disable-line

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

  const join = async () => {
    if (!name.trim() || !code.trim()) return
    const upperCode = code.toUpperCase()
    if (!validateTripCode(upperCode)) {
      toast.error('Invalid trip code format')
      return
    }

    setLoading(true)
    const memberId = generateMemberId()
    const color    = assignColor(tripInfo?.usedColors ?? [])

    const doJoin = async (observer = false) => {
      setMyInfo(name.trim(), transport)
      setTripCode(upperCode)
      setMemberId(memberId)
      setMyColor(color)
      setObserver(observer)

      if (db && !observer) {
        const memberRef = ref(db, `trips/${upperCode}/members/${memberId}`)
        await set(memberRef, {
          name:      name.trim(),
          transport,
          color,
          lat:       null,
          lng:       null,
          speed:     0,
          heading:   0,
          battery:   100,
          accuracy:  0,
          lastSeen:  serverTimestamp(),
          isOnline:  true,
          joinedAt:  serverTimestamp(),
        })

        // System chat message
        await push(ref(db, `trips/${upperCode}/chat`), {
          text:       `${name.trim()} joined the trip`,
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

  return (
    <div className="min-h-screen bg-bgdeep flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:  'radial-gradient(circle, #1A3A5C 1px, transparent 1px)',
          backgroundSize:   '28px 28px',
          opacity:          0.3,
        }}
      />

      {/* Logo */}
      <motion.div
        className="text-center mb-8 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="font-display text-primary" style={{ fontSize: 72, letterSpacing: 8, lineHeight: 1 }}>
          CONVOY
        </div>
        <p className="font-mono text-textmuted text-center mt-2" style={{ fontSize: 13 }}>
          Everyone sees everyone. Nobody gets left behind.
        </p>
      </motion.div>

      {/* Form card */}
      <motion.div
        className="relative z-10 w-full max-w-sm rounded-3xl p-7 space-y-5"
        style={{ background: '#0D1A2A', border: '1px solid #1A3A5C', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {/* Name */}
        <div className="space-y-1.5">
          <label className="font-mono text-textmuted text-xs uppercase tracking-widest">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
            maxLength={20}
            placeholder="e.g. Rahul"
            className="w-full rounded-xl px-4 py-3 font-body text-textprimary text-sm outline-none focus:border-primary transition-colors"
            style={{ background: '#112236', border: '1px solid #1A3A5C' }}
          />
        </div>

        {/* Trip code */}
        <div className="space-y-1.5">
          <label className="font-mono text-textmuted text-xs uppercase tracking-widest">Trip Code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. TREK2847"
            className="w-full rounded-xl px-4 py-3 font-mono text-textprimary text-sm outline-none tracking-widest focus:border-primary transition-colors"
            style={{ background: '#112236', border: '1px solid #1A3A5C' }}
          />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs" style={{ color: getTripInfoColor(tripInfo, code) }}>
              {getTripInfoText(tripInfo, code)}
            </span>
            <button
              onClick={() => setCode(generateTripCode())}
              className="font-mono text-accent text-xs hover:underline"
            >
              Generate random code
            </button>
          </div>
        </div>

        {/* Transport */}
        <div className="space-y-2">
          <label className="font-mono text-textmuted text-xs uppercase tracking-widest">Your Vehicle</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TRANSPORT_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => setTransport(opt.id)}
                className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 flex-shrink-0 transition-colors"
                style={{
                  background: transport === opt.id ? '#00FF8810' : '#112236',
                  border:     transport === opt.id ? '1px solid #00FF8860' : '1px solid #1A3A5C',
                }}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="font-mono text-textmuted" style={{ fontSize: 9 }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Join button */}
        <motion.button
          onClick={join}
          disabled={!name.trim() || !code.trim() || loading}
          className="w-full py-3.5 rounded-xl font-mono font-bold text-black text-sm uppercase tracking-widest disabled:opacity-50"
          style={{ background: '#00FF88', letterSpacing: 2 }}
          whileTap={{ scale: 0.97 }}
        >
          {loading ? '📡 Locating...' : 'Join Trip'}
        </motion.button>

        <p className="font-mono text-textmuted text-center" style={{ fontSize: 11 }}>
          No account needed · Works on any phone
        </p>
      </motion.div>
    </div>
  )
}

function getTripInfoColor(tripInfo, code) {
  if (code.length < 6) return '#4A7A9B'
  if (!tripInfo) return '#4A7A9B'
  return tripInfo.exists ? '#00FF88' : '#00D4FF'
}

function getTripInfoText(tripInfo, code) {
  if (code.length < 6) return 'Enter code shared by group'
  if (!tripInfo) return 'Checking...'
  if (tripInfo.exists) return `● ${tripInfo.count} member${tripInfo.count !== 1 ? 's' : ''} active`
  return '✦ New trip will be created'
}
