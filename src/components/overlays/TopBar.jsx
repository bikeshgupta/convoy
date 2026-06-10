import { motion } from 'framer-motion'
import { MapPin, Navigation, Share2, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import useTripStore from '../../store/tripStore'

export default function TopBar({ onlineCount, onLeave, routeDuration, onRoutePress }) {
  const { tripCode, routePath } = useTripStore(s => ({
    tripCode:  s.tripCode,
    routePath: s.routePath,
  }))

  const share = async () => {
    const url  = `${window.location.origin}/join?code=${tripCode}`
    const text = `Join my Convoy trip! Code: ${tripCode}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join Convoy Trip', text, url })
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
        background: 'linear-gradient(to bottom, rgba(8,12,20,0.97) 0%, transparent 100%)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Left: wordmark + trip code */}
      <div className="flex flex-col leading-none min-w-0">
        <span
          className="font-sans font-bold text-primary"
          style={{ fontSize: 16, letterSpacing: '-0.01em' }}
        >
          CONVOY
        </span>
        <span className="flex items-center gap-1 font-mono text-textmuted" style={{ fontSize: 10 }}>
          <MapPin size={8} color="#4A7A9B" />
          {tripCode}
        </span>
      </div>

      {/* Center: live pill + route chip */}
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 flex-shrink-0"
          style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)' }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <span className="font-mono text-primary" style={{ fontSize: 10 }}>
            {onlineCount} live
          </span>
        </div>

        {routePath && routeDuration && (
          <button
            onClick={onRoutePress}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)' }}
          >
            <Navigation size={9} color="#00D4FF" />
            <span className="font-mono text-accent" style={{ fontSize: 10 }}>{routeDuration}</span>
          </button>
        )}
      </div>

      {/* Right: share + leave */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={share}
          className="flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 transition-opacity hover:opacity-80"
          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', fontSize: 11, color: '#00D4FF' }}
          title="Share invite link"
        >
          <Share2 size={12} />
          <span className="font-mono" style={{ fontSize: 10 }}>Invite</span>
        </button>
        <button
          onClick={onLeave}
          className="flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,77,109,0.12)', border: '1px solid rgba(255,77,109,0.35)', color: '#FF4D6D' }}
          title="Leave trip"
        >
          <LogOut size={12} />
          <span className="font-mono" style={{ fontSize: 10 }}>Leave</span>
        </button>
      </div>
    </div>
  )
}
