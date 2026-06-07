import { OverlayView } from '@react-google-maps/api'
import { getTransportEmoji } from '../../utils/transport'

export default function MemberMarker({ member, onClick }) {
  if (!member.lat && !member.lng) return null

  const pos = { lat: member.lat, lng: member.lng }
  const offline = !member.isOnline

  return (
    <OverlayView
      position={pos}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        className="flex flex-col items-center cursor-pointer select-none"
        style={{ transform: 'translate(-50%,-50%)', transition: 'transform 0.5s ease' }}
        onClick={() => onClick?.(member)}
      >
        <div
          className="flex items-center justify-center rounded-full border-2 border-white/70"
          style={{
            width:      40,
            height:     40,
            background: member.color,
            boxShadow:  `0 0 12px ${member.color}60`,
            transform:  `rotate(${member.heading ?? 0}deg)`,
            filter:     offline ? 'grayscale(100%) opacity(60%)' : 'none',
            fontSize:   20,
            transition: 'transform 0.3s ease',
          }}
        >
          {getTransportEmoji(member.transport)}
        </div>

        <div
          className="font-mono font-bold text-black rounded-full px-1.5 mt-0.5 whitespace-nowrap"
          style={{ background: member.color, fontSize: 10, filter: offline ? 'grayscale(80%)' : 'none' }}
        >
          {member.name}
        </div>

        {offline ? (
          <div className="text-textmuted" style={{ fontSize: 9, fontFamily: 'Space Mono' }}>
            {member.lastSeen ? `${Math.round((Date.now() - member.lastSeen) / 60000)}m ago` : 'offline'}
          </div>
        ) : member.speed > 0 ? (
          <div className="text-textmuted" style={{ fontSize: 9, fontFamily: 'Space Mono' }}>
            {member.speed} km/h
          </div>
        ) : null}
      </div>
    </OverlayView>
  )
}
