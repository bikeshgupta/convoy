import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Users, MapPin, MessageCircle, Map } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { db, ref, get } from '../firebase'
import { formatDuration } from '../utils/time'

export default function HistoryPage() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [trips,    setTrips]    = useState([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) { navigate('/'); return }
    if (!db)   { setFetching(false); return }

    get(ref(db, `users/${user.uid}/trips`))
      .then(snap => {
        if (snap.exists()) {
          const data = Object.values(snap.val())
            .sort((a, b) => (b.exitedAt ?? 0) - (a.exitedAt ?? 0))
          setTrips(data)
        }
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [user, loading]) // eslint-disable-line

  if (loading || fetching) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)' }}
      >
        <div className="text-sm text-slate-400 animate-pulse">Loading history…</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)' }}
    >
      {/* Subtle dot grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
          backgroundSize:  '32px 32px',
          opacity:         0.35,
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-4 pt-10 pb-12 max-w-sm mx-auto">

        {/* Header */}
        <motion.div
          className="w-full mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-slate-500 mb-5 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1
                className="font-sans font-extrabold"
                style={{ fontSize: 28, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1.1 }}
              >
                My Trips
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {user.displayName ?? user.email}
              </p>
            </div>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="w-11 h-11 rounded-full shadow-sm"
                style={{ outline: '2px solid #fff', outlineOffset: 1 }}
              />
            )}
          </div>
        </motion.div>

        {/* Trip list */}
        {trips.length === 0 ? (
          <motion.div
            className="w-full rounded-card p-10 text-center bg-white"
            style={{ boxShadow: '0 4px 20px rgba(15,23,42,0.07)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F1F5F9' }}
            >
              <Map size={24} color="#94A3B8" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-slate-700">No trips yet</p>
            <p className="text-xs text-slate-400 mt-1">Your completed trips will appear here</p>
            <button
              onClick={() => navigate('/')}
              className="mt-5 px-6 py-2.5 rounded-btn text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: '#111827' }}
            >
              Start a Trip
            </button>
          </motion.div>
        ) : (
          <div className="w-full space-y-3">
            {trips.map((trip, i) => (
              <TripCard
                key={trip.tripCode ?? i}
                trip={trip}
                index={i}
                onRejoin={() => navigate(`/?code=${trip.tripCode}`)}
              />
            ))}
          </div>
        )}

        {/* Sign out */}
        <motion.button
          onClick={async () => { await signOut(); navigate('/') }}
          className="mt-8 text-xs text-slate-400 hover:text-red-400 transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Sign out
        </motion.button>
      </div>
    </div>
  )
}

function TripCard({ trip, index, onRejoin }) {
  const date     = trip.exitedAt
    ? new Date(trip.exitedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'
  const duration = trip.exitedAt && trip.joinedAt
    ? formatDuration(trip.exitedAt - trip.joinedAt)
    : '—'

  const stats = [
    { Icon: Clock,         value: duration,              label: 'duration'  },
    { Icon: Users,         value: trip.memberCount ?? 1,  label: 'members'   },
    { Icon: MapPin,        value: trip.waypointCount ?? 0, label: 'waypoints' },
    { Icon: MessageCircle, value: trip.messageCount ?? 0,  label: 'messages'  },
  ]

  return (
    <motion.div
      className="rounded-[20px] p-5 bg-white"
      style={{ boxShadow: '0 2px 12px rgba(15,23,42,0.06)', border: '1px solid #F1F5F9' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div
            className="font-medium text-slate-800 text-[15px] tracking-[0.05em]"
            style={{ fontFamily: '"Space Mono", monospace' }}
          >
            {trip.tripCode}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{date}</div>
        </div>
        <button
          onClick={onRejoin}
          className="flex-shrink-0 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#F1F5F9', color: '#374151' }}
        >
          Rejoin
        </button>
      </div>

      <div className="flex gap-5 mt-4">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <s.Icon size={13} color="#94A3B8" strokeWidth={1.75} />
            <span className="text-xs font-semibold text-slate-700 tabular-nums">{s.value}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
