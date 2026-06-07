import { motion } from 'framer-motion'
import PulseRing from './PulseRing'

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-bgdeep flex flex-col items-center justify-center z-50">
      <div className="relative flex items-center justify-center mb-8">
        <PulseRing size={80} delay={0} />
        <PulseRing size={80} delay={0.6} />
        <PulseRing size={80} delay={1.2} />
        <div
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ background: '#00FF88', boxShadow: '0 0 24px rgba(0,255,136,0.5)' }}
        >
          📍
        </div>
      </div>

      <motion.div
        className="font-display text-primary text-5xl tracking-widest mb-4"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        CONVOY
      </motion.div>

      <DotsMessage message={message} />
    </div>
  )
}

function DotsMessage({ message }) {
  return (
    <motion.p
      className="font-mono text-textmuted text-sm"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {message}
      <AnimatedDots />
    </motion.p>
  )
}

function AnimatedDots() {
  return (
    <motion.span
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 1.2, repeat: Infinity }}
    >
      ...
    </motion.span>
  )
}
