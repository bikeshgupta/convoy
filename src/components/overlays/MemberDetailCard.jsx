import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '../ui/Avatar'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { haversineDistance, formatDistance, getBearing, bearingToLabel } from '../../utils/distance'
import { formatRelativeTime } from '../../utils/time'
import { db, ref, push, serverTimestamp } from '../../firebase'

export default function MemberDetailCard({ member, onClose }) {
  const { myPos, myName, memberId, tripCode } = useTripStore(useShallow(s => ({
    myPos:    s.myPos,
    myName:   s.myName,
    memberId: s.memberId,
    tripCode: s.tripCode,
  })))

  if (!member) return null

  const dist    = myPos && member.lat ? haversineDistance(myPos.lat, myPos.lng, member.lat, member.lng) : null
  const bearing = myPos && member.lat ? getBearing(myPos.lat, myPos.lng, member.lat, member.lng) : null
  const dirLabel = bearing != null ? bearingToLabel(bearing) : '—'

  const navigate = () => {
    window.open(`https://maps.google.com/maps?daddr=${member.lat},${member.lng}`, '_blank')
  }

  const ping = () => {
    if (!db || !tripCode) return
    push(ref(db, `trips/${tripCode}/chat`), {
      text:       `👋 ${myName} pinged ${member.name}`,
      senderName: 'System',
      senderId:   'system',
      timestamp:  serverTimestamp(),
      type:       'system',
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[150] rounded-t-3xl p-5"
        style={{ background: '#0D1A2A', border: '1px solid #1A3A5C', borderBottom: 'none' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Close handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-textmuted/40" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <Avatar color={member.color} transport={member.transport} size={64} online={member.isOnline} />
          <div>
            <div className="font-mono font-bold text-xl text-textprimary">{member.name}</div>
            <div className="font-mono text-textmuted text-sm capitalize">{member.transport}</div>
          </div>
          <button onClick={onClose} className="ml-auto text-textmuted text-xl">✕</button>
        </div>

        {!member.isOnline && (
          <div
            className="rounded-xl px-3 py-2 mb-4 font-mono text-sm text-warning"
            style={{ background: '#FFB80015', border: '1px solid #FFB80040' }}
          >
            ⚠️ Last seen {formatRelativeTime(member.lastSeen)} · Location may be outdated
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: '📍', label: 'Distance',  value: dist != null ? formatDistance(dist) : '—' },
            { icon: '🧭', label: 'Direction', value: `${dirLabel} (${bearing != null ? Math.round(bearing) : '—'}°)` },
            { icon: '⚡', label: 'Speed',     value: `${member.speed ?? 0} km/h` },
            { icon: '🔋', label: 'Battery',   value: `${member.battery ?? 100}%` },
            { icon: '📶', label: 'Accuracy',  value: member.accuracy ? `±${member.accuracy}m` : '—' },
            { icon: '🕐', label: 'Last seen', value: formatRelativeTime(member.lastSeen) },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: '#112236', border: '1px solid #1A3A5C' }}>
              <div className="font-mono text-textmuted text-xs mb-1">{s.icon} {s.label}</div>
              <div className="font-mono text-textprimary text-sm font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={navigate}
            className="flex-1 py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-wide"
            style={{ background: '#00D4FF22', border: '1px solid #00D4FF55', color: '#00D4FF' }}
          >
            🗺️ Navigate
          </button>
          <button
            onClick={ping}
            className="flex-1 py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-wide text-textprimary"
            style={{ background: '#112236', border: '1px solid #1A3A5C' }}
          >
            👋 Ping
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
