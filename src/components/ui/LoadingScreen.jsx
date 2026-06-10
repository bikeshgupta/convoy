import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import PulseRing from './PulseRing'

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <div className="fixed inset-0 bg-bgdeep flex flex-col items-center justify-center z-50">
      <div className="relative flex items-center justify-center mb-8">
        <PulseRing size={80} delay={0} />
        <PulseRing size={80} delay={0.6} />
        <PulseRing size={80} delay={1.2} />
        <div
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: '#00FF88', boxShadow: '0 0 24px rgba(0,255,136,0.45)' }}
        >
          <MapPin size={26} color="#080C14" strokeWidth={2.5} />
        </div>
      </div>

      <motion.div
        className="font-sans font-extrabold text-primary mb-3"
        style={{ fontSize: 28, letterSpacing: '-0.02em' }}
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        CONVOY
      </motion.div>

      <motion.p
        className="font-sans text-textmuted text-sm"
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  )
}
