import { motion } from 'framer-motion'
import { MapPin, Navigation, Share2, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'

export default function TopBar({ onlineCount, onLeave, routeDuration, onRoutePress }) {
  const { tripCode, routePath } = useTripStore(useShallow(s => ({
    tripCode:  s.tripCode,
    routePath: s.routePath,
  })))

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
        height:       60,
        background:   'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E2D9',
        paddingTop:   'env(safe-area-inset-top)',
      }}
    >
      {/* Left: wordmark + trip code */}
      <div className="flex flex-col leading-none min-w-0">
        <span
          className="font-display font-semibold text-ink"
          style={{ fontSize: 17, letterSpacing: '-0.01em' }}
        >
          Convoy
        </span>
        <span className="flex items-center gap-1 font-mono text-sub mt-0.5" style={{ fontSize: 10 }}>
          <MapPin size={8} color="#9AA292" />
          {tripCode}
        </span>
      </div>

      {/* Center: live pill + route chip */}
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 flex-shrink-0"
          style={{ background: '#E7F1EA', border: '1px solid #CBDFD2' }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: '#1B6B4A' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <span className="font-semibold" style={{ fontSize: 10, color: '#14523A' }}>
            {onlineCount} live
          </span>
        </div>

        {routePath && routeDuration && (
          <button
            onClick={onRoutePress}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
          >
            <Navigation size={9} color="#1B6B4A" />
            <span className="font-semibold" style={{ fontSize: 10, color: '#1F231F' }}>{routeDuration}</span>
          </button>
        )}
      </div>

      {/* Right: share + leave */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={share}
          className="flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 transition-opacity hover:opacity-80"
          style={{ background: '#1B6B4A', color: '#FFFFFF' }}
          title="Share invite link"
        >
          <Share2 size={12} />
          <span className="font-semibold" style={{ fontSize: 10 }}>Invite</span>
        </button>
        <button
          onClick={onLeave}
          className="flex items-center gap-1 rounded-[10px] px-2.5 py-1.5 transition-opacity hover:opacity-80"
          style={{ background: '#FFFFFF', border: '1px solid #E5E2D9', color: '#BE4B3B' }}
          title="Leave trip"
        >
          <LogOut size={12} />
          <span className="font-semibold" style={{ fontSize: 10 }}>Leave</span>
        </button>
      </div>
    </div>
  )
}
