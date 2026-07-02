import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Compass, Zap, Battery, Signal, Clock, Map, Hand, AlertTriangle, X,
} from 'lucide-react'
import Avatar from '../ui/Avatar'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { haversineDistance, formatDistance, getBearing, bearingToLabel } from '../../utils/distance'
import { formatRelativeTime } from '../../utils/time'
import { db, ref, push, serverTimestamp } from '../../firebase'

export default function MemberDetailCard({ member, onClose }) {
  const { myPos, myName, tripCode } = useTripStore(useShallow(s => ({
    myPos:    s.myPos,
    myName:   s.myName,
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
      text:       `${myName} pinged ${member.name}`,
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
        style={{ background: '#FFFFFF', border: '1px solid #E5E2D9', borderBottom: 'none' }}
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
            <div className="font-bold text-xl text-textprimary">{member.name}</div>
            <div className="text-textmuted text-sm capitalize">{member.transport}</div>
          </div>
          <button onClick={onClose} className="ml-auto text-textmuted"><X size={20} /></button>
        </div>

        {!member.isOnline && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 mb-4 text-sm text-warning"
            style={{ background: '#FBF3E2', border: '1px solid #EFDDB8' }}
          >
            <AlertTriangle size={14} color="#B0700F" className="flex-shrink-0" />
            Last seen {formatRelativeTime(member.lastSeen)} · Location may be outdated
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { Icon: MapPin,  label: 'Distance',  value: dist != null ? formatDistance(dist) : '—' },
            { Icon: Compass, label: 'Direction', value: `${dirLabel} (${bearing != null ? Math.round(bearing) : '—'}°)` },
            { Icon: Zap,     label: 'Speed',     value: `${member.speed ?? 0} km/h` },
            { Icon: Battery, label: 'Battery',   value: `${member.battery ?? 100}%` },
            { Icon: Signal,  label: 'Accuracy',  value: member.accuracy ? `±${member.accuracy}m` : '—' },
            { Icon: Clock,   label: 'Last seen', value: formatRelativeTime(member.lastSeen) },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3" style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}>
              <div className="flex items-center gap-1.5 text-textmuted text-xs mb-1">
                <s.Icon size={11} color="#9AA292" /> {s.label}
              </div>
              <div className="text-textprimary text-sm font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={navigate}
            className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5"
            style={{ background: '#E7F1EA', border: '1px solid #CBDFD2', color: '#14523A' }}
          >
            <Map size={15} /> Navigate
          </button>
          <button
            onClick={ping}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-textprimary flex items-center justify-center gap-1.5"
            style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
          >
            <Hand size={15} color="#67705F" /> Ping
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
