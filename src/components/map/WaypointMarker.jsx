import { OverlayView } from '@react-google-maps/api'
import { getWaypointIcon } from '../../utils/waypointIcons'

const TYPE_STYLES = {
  destination: {
    bg:     '#14523A',
    border: '#FFFFFF',
    icon:   '#FFFFFF',
    size:   44,
    shadow: '0 3px 12px rgba(31,35,31,0.3)',
    stem:   '#14523A',
  },
  rest: {
    bg:     '#B98A2E',
    border: '#FFFFFF',
    icon:   '#FFFFFF',
    size:   38,
    shadow: '0 2px 8px rgba(31,35,31,0.25)',
    stem:   '#B98A2E',
  },
  pin: {
    bg:     '#FFFFFF',
    border: '#E5E2D9',
    icon:   '#67705F',
    size:   36,
    shadow: '0 2px 8px rgba(31,35,31,0.18)',
    stem:   '#9AA292',
  },
}

export default function WaypointMarker({ waypoint }) {
  if (!waypoint.lat && !waypoint.lng) return null

  const style = TYPE_STYLES[waypoint.type] ?? TYPE_STYLES.pin
  const isDestination = waypoint.type === 'destination'
  const Icon = getWaypointIcon(waypoint.icon)

  return (
    <OverlayView
      position={{ lat: waypoint.lat, lng: waypoint.lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="flex flex-col items-center" style={{ transform: 'translate(-50%,-100%)' }}>
        {isDestination && (
          <div
            className="font-semibold text-center mb-1 px-2 py-0.5 rounded-full"
            style={{ fontSize: 9, background: '#14523A', color: '#FFFFFF', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}
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
            boxShadow:  style.shadow,
          }}
        >
          <Icon size={Math.round(style.size * 0.48)} color={style.icon} strokeWidth={2} />
        </div>
        {waypoint.label && (
          <div
            className="font-semibold rounded-full px-2 py-0.5 mt-0.5 whitespace-nowrap"
            style={{
              background: '#FFFFFF',
              color:      '#1F231F',
              fontSize:   9,
              border:     '1px solid #E5E2D9',
              boxShadow:  '0 2px 6px rgba(31,35,31,0.12)',
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
