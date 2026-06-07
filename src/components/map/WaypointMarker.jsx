import { OverlayView } from '@react-google-maps/api'

const TYPE_STYLES = {
  destination: {
    bg:     '#FFB800',
    border: '#CC9400',
    size:   44,
    shadow: '0 3px 12px rgba(255,184,0,0.5)',
    stem:   '#CC9400',
  },
  rest: {
    bg:     '#00D4FF',
    border: '#009ABF',
    size:   38,
    shadow: '0 2px 8px rgba(0,212,255,0.4)',
    stem:   '#009ABF',
  },
  pin: {
    bg:     '#1A3A5C',
    border: 'rgba(255,255,255,0.4)',
    size:   36,
    shadow: '0 2px 8px rgba(0,0,0,0.4)',
    stem:   '#4A7A9B',
  },
}

export default function WaypointMarker({ waypoint }) {
  if (!waypoint.lat && !waypoint.lng) return null

  const style = TYPE_STYLES[waypoint.type] ?? TYPE_STYLES.pin
  const isDestination = waypoint.type === 'destination'

  return (
    <OverlayView
      position={{ lat: waypoint.lat, lng: waypoint.lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="flex flex-col items-center" style={{ transform: 'translate(-50%,-100%)' }}>
        {isDestination && (
          <div
            className="font-mono font-bold text-center mb-1 px-2 py-0.5 rounded-full"
            style={{ fontSize: 9, background: '#FFB800', color: '#0F172A', whiteSpace: 'nowrap' }}
          >
            DESTINATION
          </div>
        )}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width:      style.size,
            height:     style.size,
            background: style.bg,
            border:     `2px solid ${style.border}`,
            fontSize:   style.size * 0.48,
            boxShadow:  style.shadow,
          }}
        >
          {waypoint.emoji ?? '📍'}
        </div>
        {waypoint.label && (
          <div
            className="font-mono text-white rounded px-1.5 py-0.5 mt-0.5 whitespace-nowrap"
            style={{
              background: isDestination ? 'rgba(255,184,0,0.92)' : 'rgba(13,26,42,0.9)',
              color:      isDestination ? '#0F172A' : '#E0F0FF',
              fontSize:   9,
              border:     isDestination ? '1px solid #CC9400' : '1px solid #1A3A5C',
            }}
          >
            {waypoint.label}
          </div>
        )}
        <div style={{ width: 2, height: 8, background: style.stem }} />
      </div>
    </OverlayView>
  )
}
