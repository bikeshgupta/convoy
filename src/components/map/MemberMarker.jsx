import { OverlayView } from '@react-google-maps/api'

export default function MemberMarker({ member, onClick }) {
  if (member.lat == null || member.lng == null) return null

  const pos     = { lat: member.lat, lng: member.lng }
  const offline = !member.isOnline
  const initial = (member.name ?? '?').charAt(0).toUpperCase()

  return (
    <OverlayView
      position={pos}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        className="flex flex-col items-center cursor-pointer select-none"
        style={{ transform: 'translate(-50%,-100%)' }}
        onClick={() => onClick?.(member)}
      >
        {/* Teardrop pin with the member's initial (kept upright) */}
        <div
          style={{
            width:        36,
            height:       36,
            borderRadius: '50% 50% 50% 6px',
            transform:    'rotate(-45deg)',
            background:   member.color,
            border:       '2.5px solid #FFFFFF',
            boxShadow:    '0 3px 10px rgba(31,35,31,0.25)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            filter:       offline ? 'grayscale(85%) opacity(65%)' : 'none',
          }}
        >
          <span
            style={{
              transform:  'rotate(45deg)',
              color:      '#FFFFFF',
              fontWeight: 700,
              fontSize:   13,
            }}
          >
            {initial}
          </span>
        </div>

        <div
          className="font-semibold rounded-full px-2 py-0.5 mt-1.5 whitespace-nowrap flex items-center gap-1"
          style={{
            background: '#FFFFFF',
            border:     '1px solid #E5E2D9',
            boxShadow:  '0 2px 6px rgba(31,35,31,0.12)',
            color:      '#1F231F',
            fontSize:   10,
            filter:     offline ? 'grayscale(60%)' : 'none',
          }}
        >
          <span className="rounded-full" style={{ width: 6, height: 6, background: offline ? '#9AA292' : member.color }} />
          {member.name}
          {offline
            ? <span style={{ color: '#9AA292' }}>
                · {member.lastSeen ? `${Math.round((Date.now() - member.lastSeen) / 60000)}m ago` : 'offline'}
              </span>
            : member.speed > 0 && <span style={{ color: '#67705F' }}>· {member.speed} km/h</span>
          }
        </div>
      </div>
    </OverlayView>
  )
}
