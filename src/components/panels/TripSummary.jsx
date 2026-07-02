import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import Avatar from '../ui/Avatar'
import { formatDuration } from '../../utils/time'

export default function TripSummary({ members, waypointCount, messageCount, onClose }) {
  const { tripCode, myName, myColor, myTransport, tripStartTime } = useTripStore(useShallow(s => ({
    tripCode:      s.tripCode,
    myName:        s.myName,
    myColor:       s.myColor,
    myTransport:   s.myTransport,
    tripStartTime: s.tripStartTime,
  })))

  const duration = tripStartTime ? formatDuration(Date.now() - tripStartTime) : '—'
  const allMembers = [{ id: 'me', name: myName, color: myColor, transport: myTransport, isOnline: true }, ...members]

  useEffect(() => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#1B6B4A','#3E7C7B','#B0700F'] })
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
      <h1 className="font-display font-semibold text-4xl text-ink mb-1">Trip complete</h1>
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
            style={{ background: '#FFFFFF', border: '1px solid #E5E2D9' }}
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
          style={{ background: '#E3EDED', border: '1px solid #BCD2D2', color: '#3E7C7B' }}
        >
          📤 Share Summary
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-mono font-bold text-sm uppercase tracking-widest text-white"
          style={{ background: '#1B6B4A' }}
        >
          Back to Home
        </button>
      </div>
    </motion.div>
  )
}
