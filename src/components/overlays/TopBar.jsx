import { motion } from 'framer-motion'
import useTripStore from '../../store/tripStore'

export default function TopBar({ onlineCount, onLeave }) {
  const tripCode = useTripStore(s => s.tripCode)

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center px-4"
      style={{
        height:     60,
        background: 'linear-gradient(to bottom, rgba(8,12,20,0.95) 0%, transparent 100%)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Left: logo + trip code */}
      <div className="flex flex-col leading-none">
        <span className="font-display text-primary text-2xl tracking-widest">CONVOY</span>
        <span className="font-mono text-accent text-xs">📍 {tripCode}</span>
      </div>

      {/* Center: live count */}
      <div className="flex-1 flex justify-center">
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1"
          style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)' }}
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="font-mono text-primary" style={{ fontSize: 11 }}>
            {onlineCount} LIVE
          </span>
        </div>
      </div>

      {/* Right: leave button */}
      <button
        onClick={onLeave}
        className="font-mono text-danger rounded-xl px-3 py-1.5"
        style={{
          background: 'rgba(255,77,109,0.15)',
          border:     '1px solid rgba(255,77,109,0.4)',
          fontSize:   11,
        }}
      >
        Leave
      </button>
    </div>
  )
}
