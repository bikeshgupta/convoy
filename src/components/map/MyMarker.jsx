import { OverlayView } from '@react-google-maps/api'
import PulseRing from '../ui/PulseRing'
import useTripStore from '../../store/tripStore'

export default function MyMarker() {
  const myPos = useTripStore(s => s.myPos)
  if (!myPos) return null

  return (
    <OverlayView
      position={myPos}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="relative flex flex-col items-center" style={{ transform: 'translate(-50%,-50%)', zIndex: 999 }}>
        <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
          <PulseRing size={56} color="#1B6B4A" delay={0} />
          <PulseRing size={56} color="#1B6B4A" delay={0.8} />
          <div
            className="relative z-10 rounded-full"
            style={{
              width:      22,
              height:     22,
              background: '#1B6B4A',
              border:     '3.5px solid #FFFFFF',
              boxShadow:  '0 2px 8px rgba(31,35,31,0.35)',
            }}
          />
        </div>
        <div
          className="font-semibold px-2 py-0.5 rounded-full -mt-1"
          style={{
            background: '#FFFFFF',
            border:     '1px solid #E5E2D9',
            boxShadow:  '0 2px 6px rgba(31,35,31,0.12)',
            color:      '#14523A',
            fontSize:   10,
          }}
        >
          You
        </div>
      </div>
    </OverlayView>
  )
}
