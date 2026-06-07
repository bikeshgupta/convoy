import { motion } from 'framer-motion'

export default function PulseRing({ size = 60, color = '#00FF88', delay = 0 }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width:     size,
        height:    size,
        background: color,
        left:      '50%',
        top:       '50%',
        x:         '-50%',
        y:         '-50%',
        opacity:   0.08,
      }}
      animate={{ scale: [1, 2], opacity: [0.08, 0] }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: 'easeOut' }}
    />
  )
}
