import { Zap, Battery, Users, Crown, Hand, Pause, Play, AlertTriangle, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomSheet from '../ui/BottomSheet'
import Avatar from '../ui/Avatar'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { db, ref, push, serverTimestamp } from '../../firebase'
import { formatDistance, getDistanceStatus } from '../../utils/distance'

const STATUS_COLORS = {
  nearby:   '#1B6B4A',
  close:    '#B98A2E',
  far:      '#B0700F',
  critical: '#BE4B3B',
}

const FAR_BEHIND_M   = 5000
const LOW_BATTERY    = 15

// One alert per member, worst first
function getAlert(m) {
  if (!m.isOnline)                                   return { text: m.agoText ? `Offline · last seen ${m.agoText}` : 'Offline' }
  if (m.battery != null && m.battery < LOW_BATTERY)  return { text: `Battery ${m.battery}%` }
  if (m.distance !== Infinity && m.distance > FAR_BEHIND_M) return { text: `${formatDistance(m.distance)} away from you` }
  return null
}

export default function MemberListPanel({ members, onMemberClick, onClose }) {
  const {
    myName, myTransport, myColor, activePanel,
    isCreator, isSharing, isObserver, setSharing, tripCode,
  } = useTripStore(useShallow(s => ({
    myName:      s.myName,
    myTransport: s.myTransport,
    myColor:     s.myColor,
    activePanel: s.activePanel,
    isCreator:   s.isCreator,
    isSharing:   s.isSharing,
    isObserver:  s.isObserver,
    setSharing:  s.setSharing,
    tripCode:    s.tripCode,
  })))

  const totalCount = members.length + 1

  const ping = m => {
    if (!db || !tripCode) return
    push(ref(db, `trips/${tripCode}/chat`), {
      text:       `${myName} pinged ${m.name}`,
      senderName: 'System',
      senderId:   'system',
      timestamp:  serverTimestamp(),
      type:       'system',
    })
    toast.success(`Pinged ${m.name}`)
  }

  const toggleSharing = () => {
    setSharing(!isSharing)
    toast(isSharing ? 'Location sharing paused' : 'Sharing your location again', {
      icon: isSharing ? <EyeOff size={15} color="#B0700F" /> : <Play size={15} color="#1B6B4A" />,
    })
  }

  // Organizer fleet view: members needing attention float to the top
  const alerts = isCreator
    ? members.map(m => ({ member: m, alert: getAlert(m) })).filter(x => x.alert)
    : []
  const alertIds = new Set(alerts.map(x => x.member.id))
  const calm     = isCreator ? members.filter(m => !alertIds.has(m.id)) : members

  return (
    <BottomSheet
      isOpen={activePanel === 'members'}
      onClose={onClose}
      title={`Your Group · ${totalCount} member${totalCount !== 1 ? 's' : ''}`}
      height="half"
    >
      <div className="flex flex-col">
        {/* Me row */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: '#F4F2EC' }}>
          <Avatar color={myColor || '#1B6B4A'} transport={myTransport} size={44} online />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-sans font-semibold text-sm" style={{ color: '#14523A' }}>
              {myName}
              {isCreator && <Crown size={12} color="#B98A2E" fill="#B98A2E" />}
            </div>
            <div className="text-textmuted text-xs capitalize mt-0.5">
              {isObserver ? 'Waiting for GPS' : isSharing ? myTransport : 'Sharing paused'}
            </div>
          </div>
          {!isObserver && (
            <button
              onClick={toggleSharing}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-semibold"
              style={isSharing
                ? { background: '#F4F2EC', color: '#67705F', border: '1px solid #E5E2D9' }
                : { background: '#FBF3E2', color: '#B0700F', border: '1px solid #EFDDB8' }}
            >
              {isSharing ? <><Pause size={11} /> Pause</> : <><Play size={11} /> Resume</>}
            </button>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: '#E7F1EA', color: '#14523A', border: '1px solid #CBDFD2' }}
          >
            You
          </span>
        </div>

        {/* Organizer alerts */}
        {alerts.length > 0 && (
          <>
            <div className="flex items-center gap-1.5 px-5 pt-3 pb-1">
              <AlertTriangle size={11} color="#B0700F" />
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#B0700F' }}>
                Needs attention · {alerts.length}
              </span>
            </div>
            {alerts.map(({ member: m, alert }) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3 border-b" style={{ background: '#FBF3E2', borderColor: '#F4EBD5' }}>
                <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => onMemberClick(m)}>
                  <Avatar color={m.color} transport={m.transport} size={40} online={m.isOnline} />
                  <div className="min-w-0">
                    <div className="font-sans font-semibold text-sm text-textprimary truncate">{m.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#B0700F' }}>{alert.text}</div>
                  </div>
                </button>
                <button
                  onClick={() => ping(m)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: '#FFFFFF', color: '#1F231F', border: '1px solid #E8D9B8' }}
                >
                  <Hand size={11} color="#67705F" /> Ping
                </button>
              </div>
            ))}
          </>
        )}

        {/* Other members */}
        {calm.map(m => {
          const dist        = m.distance !== Infinity ? m.distance : null
          const status      = dist != null ? getDistanceStatus(dist) : 'far'
          const statusColor = STATUS_COLORS[status]

          return (
            <button
              key={m.id}
              className="flex items-center gap-3 px-5 py-3.5 border-b text-left hover:bg-bgelevated transition-colors w-full"
              style={{ borderColor: '#F4F2EC' }}
              onClick={() => onMemberClick(m)}
            >
              <Avatar color={m.color} transport={m.transport} size={44} online={m.isOnline} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-sans font-semibold text-sm text-textprimary">
                  {m.name}
                  {m.role === 'organizer' && <Crown size={12} color="#B98A2E" fill="#B98A2E" />}
                </div>
                <div className="text-textmuted text-xs capitalize mt-0.5">
                  {m.sharing === false ? 'Sharing paused' : m.transport}
                </div>
                {m.isOnline ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-textmuted text-xs">
                      <Zap size={9} color="#9AA292" />
                      {m.speed ?? 0} km/h
                    </span>
                    {m.battery != null && (
                      <span className="flex items-center gap-1 text-textmuted text-xs">
                        <Battery size={9} color="#9AA292" />
                        {m.battery}%
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs mt-0.5" style={{ color: '#BE4B3B' }}>
                    Last seen {m.agoText ?? 'unknown'}
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
            <Users size={28} color="#9AA292" strokeWidth={1.5} />
            <span className="text-sm">Waiting for others to join…</span>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}
