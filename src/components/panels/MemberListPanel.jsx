import BottomSheet from '../ui/BottomSheet'
import Avatar from '../ui/Avatar'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { formatDistance, getDistanceStatus, haversineDistance } from '../../utils/distance'

const STATUS_COLORS = {
  nearby:   '#00FF88',
  close:    '#FFB800',
  far:      '#FF8C00',
  critical: '#FF4D6D',
}

export default function MemberListPanel({ members, onMemberClick, onClose }) {
  const { myName, myTransport, myColor, myPos, activePanel } = useTripStore(useShallow(s => ({
    myName:      s.myName,
    myTransport: s.myTransport,
    myColor:     s.myColor,
    myPos:       s.myPos,
    activePanel: s.activePanel,
  })))

  const totalCount = members.length + 1

  return (
    <BottomSheet
      isOpen={activePanel === 'members'}
      onClose={onClose}
      title={`YOUR GROUP · ${totalCount} MEMBER${totalCount !== 1 ? 'S' : ''}`}
      height="half"
    >
      <div className="flex flex-col gap-0">
        {/* Me row */}
        <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: '#1A3A5C' }}>
          <Avatar color={myColor || '#00FF88'} transport={myTransport} size={44} online />
          <div className="flex-1 min-w-0">
            <div className="font-mono font-bold text-sm" style={{ color: '#00FF88' }}>
              {myName} (You)
            </div>
            <div className="font-mono text-textmuted text-xs capitalize">{myTransport}</div>
          </div>
          <span className="font-mono text-xs px-2 py-1 rounded-full" style={{ background: '#00FF8820', color: '#00FF88', border: '1px solid #00FF8840' }}>
            ● You
          </span>
        </div>

        {/* Other members */}
        {members.map(m => {
          const dist = myPos && m.lat ? haversineDistance(myPos.lat, myPos.lng, m.lat, m.lng) : null
          const status = dist != null ? getDistanceStatus(dist) : 'far'
          const statusColor = STATUS_COLORS[status]

          return (
            <button
              key={m.id}
              className="flex items-center gap-3 px-5 py-3 border-b text-left hover:bg-bgelevated transition-colors w-full"
              style={{ borderColor: '#1A3A5C' }}
              onClick={() => onMemberClick(m)}
            >
              <Avatar color={m.color} transport={m.transport} size={44} online={m.isOnline} />
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold text-sm text-textprimary">{m.name}</div>
                <div className="font-mono text-textmuted text-xs capitalize">{m.transport}</div>
                {m.isOnline ? (
                  <div className="font-mono text-textmuted text-xs">
                    ⚡ {m.speed ?? 0} km/h · 🔋 {m.battery ?? 100}%
                  </div>
                ) : (
                  <div className="font-mono text-xs" style={{ color: '#FF4D6D' }}>
                    Last seen {m.lastSeen ? `${Math.round((Date.now() - m.lastSeen) / 60000)}m ago` : 'unknown'}
                  </div>
                )}
              </div>
              {dist != null && (
                <span
                  className="font-mono text-xs px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}
                >
                  {formatDistance(dist)}
                </span>
              )}
            </button>
          )
        })}

        {members.length === 0 && (
          <div className="text-center py-10 text-textmuted font-mono text-sm">
            <div className="text-3xl mb-2">👥</div>
            Waiting for others to join...
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
