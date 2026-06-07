import { OverlayView } from '@react-google-maps/api'
import PulseRing from '../ui/PulseRing'
import useTripStore from '../../store/tripStore'
import { getTransportEmoji } from '../../utils/transport'

export default function MyMarker() {
  const { myPos, myTransport } = useTripStore(s => ({ myPos: s.myPos, myTransport: s.myTransport }))
  if (!myPos) return null

  return (
    <OverlayView
      position={myPos}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="relative flex flex-col items-center" style={{ transform: 'translate(-50%,-50%)', zIndex: 999 }}>
        <div className="relative flex items-center justify-center" style={{ width: 60, height: 60 }}>
          <PulseRing size={60} color="#00FF88" delay={0} />
          <PulseRing size={60} color="#00FF88" delay={0.6} />
          <PulseRing size={60} color="#00FF88" delay={1.2} />
          <div
            className="relative z-10 flex items-center justify-center rounded-full border-4 border-white"
            style={{
              width:      48,
              height:     48,
              background: '#00FF88',
              boxShadow:  '0 0 20px rgba(0,255,136,0.6)',
              fontSize:   22,
            }}
          >
            {getTransportEmoji(myTransport)}
          </div>
        </div>
        <div
          className="font-mono font-bold text-black text-xs px-2 py-0.5 rounded-full -mt-1"
          style={{ background: '#00FF88', fontSize: 10 }}
        >
          YOU
        </div>
      </div>
    </OverlayView>
  )
}
