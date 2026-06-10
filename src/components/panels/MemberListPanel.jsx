import { Zap, Battery, Users } from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import Avatar from '../ui/Avatar'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { formatDistance, getDistanceStatus, haversineDistance } from '../../utils/distance'

const STATUS_COLORS = {
  nearby:   '#10B981',
  close:    '#F59E0B',
  far:      '#FF8C00',
  critical: '#EF4444',
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
      title={`Your Group · ${totalCount} member${totalCount !== 1 ? 's' : ''}`}
      height="half"
    >
      <div className="flex flex-col">
        {/* Me row */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: '#1A3A5C' }}>
          <Avatar color={myColor || '#00FF88'} transport={myTransport} size={44} online />
          <div className="flex-1 min-w-0">
            <div className="font-sans font-semibold text-sm" style={{ color: '#00FF88' }}>
              {myName}
            </div>
            <div className="text-textmuted text-xs capitalize mt-0.5">{myTransport}</div>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}
          >
            You
          </span>
        </div>

        {/* Other members */}
        {members.map(m => {
          const dist        = myPos && m.lat ? haversineDistance(myPos.lat, myPos.lng, m.lat, m.lng) : null
          const status      = dist != null ? getDistanceStatus(dist) : 'far'
          const statusColor = STATUS_COLORS[status]

          return (
            <button
              key={m.id}
              className="flex items-center gap-3 px-5 py-3.5 border-b text-left hover:bg-bgelevated transition-colors w-full"
              style={{ borderColor: '#1A3A5C' }}
              onClick={() => onMemberClick(m)}
            >
              <Avatar color={m.color} transport={m.transport} size={44} online={m.isOnline} />
              <div className="flex-1 min-w-0">
                <div className="font-sans font-semibold text-sm text-textprimary">{m.name}</div>
                <div className="text-textmuted text-xs capitalize mt-0.5">{m.transport}</div>
                {m.isOnline ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-textmuted text-xs">
                      <Zap size={9} color="#4A7A9B" />
                      {m.speed ?? 0} km/h
                    </span>
                    <span className="flex items-center gap-1 text-textmuted text-xs">
                      <Battery size={9} color="#4A7A9B" />
                      {m.battery ?? 100}%
                    </span>
                  </div>
                ) : (
                  <div className="text-xs mt-0.5" style={{ color: '#EF4444' }}>
                    Last seen {m.lastSeen ? `${Math.round((Date.now() - m.lastSeen) / 60000)}m ago` : 'unknown'}
                  </div>
                )}
              </div>
              {dist != null && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 tabular-nums"
                  style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}35` }}
                >
                  {formatDistance(dist)}
                </span>
              )}
            </button>
          )
        })}

        {members.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3 text-textmuted">
            <Users size={28} color="#4A7A9B" strokeWidth={1.5} />
            <span className="text-sm">Waiting for others to join…</span>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
