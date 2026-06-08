import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import useTripStore from '../../store/tripStore'

export default function TopBar({ onlineCount, onLeave, routeDuration, onRoutePress }) {
  const { tripCode, routePath } = useTripStore(s => ({
    tripCode:  s.tripCode,
    routePath: s.routePath,
  }))

  const share = async () => {
    const url  = `${window.location.origin}/join?code=${tripCode}`
    const text = `Join my CONVOY trip! Code: ${tripCode}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join CONVOY Trip', text, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Invite link copied!')
      }
    } catch {
      await navigator.clipboard.writeText(url).catch(() => {})
      toast.success('Invite link copied!')
    }
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center px-3 gap-2"
      style={{
        height:     60,
        background: 'linear-gradient(to bottom, rgba(8,12,20,0.96) 0%, transparent 100%)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Left: logo + trip code */}
      <div className="flex flex-col leading-none min-w-0">
        <span className="font-display text-primary text-2xl tracking-widest">CONVOY</span>
        <span className="font-mono text-accent text-xs">📍 {tripCode}</span>
      </div>

      {/* Center: live pill + route chip */}
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 flex-shrink-0"
          style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)' }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="font-mono text-primary" style={{ fontSize: 10 }}>
            {onlineCount} LIVE
          </span>
        </div>

        {/* Route ETA chip — only visible when route is calculated */}
        {routePath && routeDuration && (
          <button
            onClick={onRoutePress}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)' }}
          >
            <span className="text-xs">🧭</span>
            <span className="font-mono text-accent" style={{ fontSize: 10 }}>{routeDuration}</span>
          </button>
        )}
      </div>

      {/* Right: share + leave */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={share}
          className="font-mono rounded-xl px-2.5 py-1.5 flex items-center gap-1"
          style={{
            background: 'rgba(0,212,255,0.12)',
            border:     '1px solid rgba(0,212,255,0.35)',
            fontSize:   11,
            color:      '#00D4FF',
          }}
          title="Share invite link"
        >
          🔗 Invite
        </button>
        <button
          onClick={onLeave}
          className="font-mono text-danger rounded-xl px-2.5 py-1.5"
          style={{
            background: 'rgba(255,77,109,0.15)',
            border:     '1px solid rgba(255,77,109,0.4)',
            fontSize:   11,
          }}
        >
          Leave
        </button>
      </div>
    </div>
  )
}
