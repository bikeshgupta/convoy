import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import useTripStore from '../../store/tripStore'
import Avatar from '../ui/Avatar'
import { formatDuration } from '../../utils/time'

export default function TripSummary({ members, waypointCount, messageCount, onClose }) {
  const { tripCode, myName, myColor, myTransport, tripStartTime } = useTripStore(s => ({
    tripCode:      s.tripCode,
    myName:        s.myName,
    myColor:       s.myColor,
    myTransport:   s.myTransport,
    tripStartTime: s.tripStartTime,
  }))

  const duration = tripStartTime ? formatDuration(Date.now() - tripStartTime) : '—'
  const allMembers = [{ id: 'me', name: myName, color: myColor, transport: myTransport, isOnline: true }, ...members]

  useEffect(() => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#00FF88','#00D4FF','#FFB800'] })
  }, [])

  const share = async () => {
    const text = `🚗 CONVOY Trip: ${tripCode}\nDuration: ${duration}\nMembers: ${allMembers.map(m => m.name).join(', ')}\nPowered by Convoy App`
    if (navigator.share) {
      await navigator.share({ title: 'CONVOY Trip Summary', text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text).catch(() => {})
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-bgdeep flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-5xl mb-2">🏁</div>
      <h1 className="font-display text-5xl text-primary tracking-widest mb-1">TRIP COMPLETE</h1>
      <p className="font-mono text-textmuted text-sm mb-8">
        {tripCode} · {duration}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
        {[
          { label: 'Duration',  value: duration,                  icon: '⏱️' },
          { label: 'Members',   value: allMembers.length,         icon: '👥' },
          { label: 'Waypoints', value: waypointCount ?? 0,        icon: '📍' },
          { label: 'Messages',  value: messageCount ?? 0,         icon: '💬' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex flex-col items-center gap-1"
            style={{ background: '#0D1A2A', border: '1px solid #1A3A5C' }}
          >
            <span className="text-2xl">{s.icon}</span>
            <span className="font-mono font-bold text-xl text-textprimary">{s.value}</span>
            <span className="font-mono text-textmuted text-xs uppercase">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Members row */}
      <div className="flex gap-4 mb-8 flex-wrap justify-center">
        {allMembers.map(m => (
          <div key={m.id} className="flex flex-col items-center gap-1">
            <Avatar color={m.color} transport={m.transport} size={48} online />
            <span className="font-mono text-xs text-textmuted">{m.name}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={share}
          className="w-full py-3 rounded-2xl font-mono font-bold text-sm uppercase tracking-widest"
          style={{ background: '#00D4FF22', border: '1px solid #00D4FF55', color: '#00D4FF' }}
        >
          📤 Share Summary
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-mono font-bold text-sm uppercase tracking-widest text-black"
          style={{ background: '#00FF88' }}
        >
          Back to Home
        </button>
      </div>
    </motion.div>
  )
}
