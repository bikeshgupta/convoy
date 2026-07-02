import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bgdeep flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="font-display font-semibold text-primary text-9xl mb-4">404</div>
        <h1 className="font-mono text-textprimary text-xl mb-2">You're off the map</h1>
        <p className="font-mono text-textmuted text-sm mb-8">This page doesn't exist in any convoy.</p>
        <Link
          to="/"
          className="font-mono font-bold text-white text-sm uppercase tracking-widest px-8 py-3 rounded-xl inline-block"
          style={{ background: '#1B6B4A' }}
        >
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}
