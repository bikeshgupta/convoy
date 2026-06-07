import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { db, ref, get } from '../firebase'
import { formatDuration } from '../utils/time'

export default function HistoryPage() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
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
        style={{ background: 'linear-gradient(150deg, #EEF2FF 0%, #F0FDF4 55%, #E0F2FE 100%)' }}
      >
        <div className="font-mono text-slate-500 text-sm animate-pulse">Loading history…</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col relative"
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

      <div className="relative z-10 flex flex-col items-center px-4 pt-12 pb-10">
        {/* Header */}
        <motion.div
          className="w-full max-w-sm mb-6"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => navigate('/')}
            className="font-mono text-slate-500 text-sm mb-4 flex items-center gap-1 hover:text-slate-700 transition-colors"
          >
            ← Back
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-4xl" style={{ color: '#0F172A', letterSpacing: 4 }}>
                MY TRIPS
              </div>
              <p className="font-body text-slate-500 text-sm mt-0.5">
                {user.displayName ?? user.email}
              </p>
            </div>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-11 h-11 rounded-full border-2 border-white shadow"
              />
            )}
          </div>
        </motion.div>

        {/* Trip list */}
        {trips.length === 0 ? (
          <motion.div
            className="w-full max-w-sm rounded-3xl p-10 text-center"
            style={{ background: '#FFFFFF', boxShadow: '0 4px 20px rgba(15,23,42,0.08)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-5xl mb-3">🗺️</div>
            <p className="font-mono text-slate-500 text-sm">No trips yet</p>
            <p className="font-body text-slate-400 text-xs mt-1">Your completed trips will appear here</p>
            <button
              onClick={() => navigate('/')}
              className="mt-5 px-6 py-2.5 rounded-xl font-mono font-bold text-sm text-slate-800"
              style={{ background: '#00FF88' }}
            >
              Start a Trip →
            </button>
          </motion.div>
        ) : (
          <div className="w-full max-w-sm space-y-3">
            {trips.map((trip, i) => (
              <TripCard key={trip.tripCode} trip={trip} index={i} onRejoin={() => navigate(`/?code=${trip.tripCode}`)} />
            ))}
          </div>
        )}

        {/* Sign out */}
        <motion.button
          onClick={async () => { await signOut(); navigate('/') }}
          className="mt-8 font-mono text-xs text-slate-400 hover:text-red-400 transition-colors"
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
  const date     = trip.exitedAt ? new Date(trip.exitedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  const duration = trip.exitedAt && trip.joinedAt ? formatDuration(trip.exitedAt - trip.joinedAt) : '—'

  return (
    <motion.div
      className="rounded-2xl p-5"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(15,23,42,0.07)', border: '1px solid rgba(226,232,240,0.8)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-mono font-bold text-slate-800 text-base tracking-widest">
            {trip.tripCode}
          </div>
          <div className="font-body text-slate-500 text-xs mt-0.5">{date}</div>
        </div>
        <button
          onClick={onRejoin}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg font-mono font-bold text-xs text-slate-800 transition-opacity hover:opacity-80"
          style={{ background: '#00FF88' }}
        >
          Rejoin →
        </button>
      </div>

      <div className="flex gap-4 mt-3">
        {[
          { icon: '⏱️', value: duration,              label: 'duration'  },
          { icon: '👥', value: trip.memberCount ?? 1,  label: 'members'   },
          { icon: '📍', value: trip.waypointCount ?? 0, label: 'waypoints' },
          { icon: '💬', value: trip.messageCount ?? 0,  label: 'messages'  },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <span className="text-sm">{s.icon}</span>
            <span className="font-mono font-bold text-slate-700 text-xs">{s.value}</span>
            <span className="font-mono text-slate-400" style={{ fontSize: 9 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
