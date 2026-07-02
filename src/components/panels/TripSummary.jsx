import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flag, Clock, Users, MapPin, MessageCircle, Share2 } from 'lucide-react'
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

  const [endedAtMs] = useState(() => Date.now())
  const duration = tripStartTime ? formatDuration(endedAtMs - tripStartTime) : '—'
  const allMembers = [{ id: 'me', name: myName, color: myColor, transport: myTransport, isOnline: true }, ...members]

  useEffect(() => {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#1B6B4A','#3E7C7B','#B0700F'] })
  }, [])

  const share = async () => {
    const text = `Convoy trip ${tripCode}\nDuration: ${duration}\nMembers: ${allMembers.map(m => m.name).join(', ')}\nPowered by Convoy`
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
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#E7F1EA' }}>
        <Flag size={28} color="#14523A" strokeWidth={2} />
      </div>
      <h1 className="font-display font-semibold text-4xl text-ink mb-1">Trip complete</h1>
      <p className="font-mono text-textmuted text-sm mb-8">
        {tripCode} · {duration}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
        {[
          { label: 'Duration',  value: duration,           Icon: Clock         },
          { label: 'Members',   value: allMembers.length,  Icon: Users         },
          { label: 'Waypoints', value: waypointCount ?? 0, Icon: MapPin        },
          { label: 'Messages',  value: messageCount ?? 0,  Icon: MessageCircle },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-2xl p-4 flex flex-col items-center gap-1.5"
            style={{ background: '#FFFFFF', border: '1px solid #E5E2D9' }}
          >
            <s.Icon size={18} color="#67705F" strokeWidth={1.75} />
            <span className="font-display font-semibold text-xl text-textprimary">{s.value}</span>
            <span className="text-textmuted text-xs uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Members row */}
      <div className="flex gap-4 mb-8 flex-wrap justify-center">
        {allMembers.map(m => (
          <div key={m.id} className="flex flex-col items-center gap-1">
            <Avatar color={m.color} transport={m.transport} size={48} online />
            <span className="text-xs text-textmuted">{m.name}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={share}
          className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{ background: '#E7F1EA', border: '1px solid #CBDFD2', color: '#14523A' }}
        >
          <Share2 size={15} /> Share Summary
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-white"
          style={{ background: '#1B6B4A' }}
        >
          Back to Home
        </button>
      </div>
    </motion.div>
  )
}
