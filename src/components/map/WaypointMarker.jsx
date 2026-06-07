import { OverlayView } from '@react-google-maps/api'

export default function WaypointMarker({ waypoint }) {
  if (!waypoint.lat && !waypoint.lng) return null

  return (
    <OverlayView
      position={{ lat: waypoint.lat, lng: waypoint.lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="flex flex-col items-center" style={{ transform: 'translate(-50%,-100%)' }}>
        <div
          className="flex items-center justify-center rounded-full border-2 border-white/50"
          style={{
            width:      36,
            height:     36,
            background: '#1A3A5C',
            fontSize:   18,
            boxShadow:  '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {waypoint.emoji ?? '📍'}
        </div>
        {waypoint.label && (
          <div
            className="font-mono text-white rounded px-1.5 py-0.5 mt-0.5 whitespace-nowrap"
            style={{ background: 'rgba(13,26,42,0.9)', fontSize: 9, border: '1px solid #1A3A5C' }}
          >
            {waypoint.label}
          </div>
        )}
        <div style={{ width: 2, height: 8, background: '#4A7A9B' }} />
      </div>
    </OverlayView>
  )
}
