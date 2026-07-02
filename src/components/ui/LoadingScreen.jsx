import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import PulseRing from './PulseRing'

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="fixed inset-0 bg-paper flex flex-col items-center justify-center z-50">
      <div className="relative flex items-center justify-center mb-8">
        <PulseRing size={80} delay={0} />
        <PulseRing size={80} delay={0.8} />
        <div
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: '#1B6B4A', boxShadow: '0 8px 24px rgba(27,107,74,0.25)' }}
        >
          <MapPin size={26} color="#FFFFFF" strokeWidth={2.5} />
        </div>
      </div>

      <motion.div
        className="font-display font-semibold text-ink mb-3"
        style={{ fontSize: 30, letterSpacing: '-0.02em' }}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Convoy
      </motion.div>

      <motion.p
        className="font-sans text-sub text-sm"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  )
}
