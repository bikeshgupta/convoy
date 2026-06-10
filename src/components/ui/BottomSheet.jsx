import { motion, AnimatePresence } from 'framer-motion'

const heightMap = {
  half: '55vh',
  full: '92vh',
  auto: 'auto',
}

export default function BottomSheet({ isOpen, onClose, children, title, height = 'half' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-bgcard flex flex-col"
            style={{
              maxHeight:   heightMap[height] ?? '55vh',
              paddingBottom: 'env(safe-area-inset-bottom)',
              borderTop:   '1px solid #1A3A5C',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) onClose()
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-textmuted/40" />
            </div>

            {title && (
              <div
                className="text-textmuted text-xs font-semibold tracking-wide uppercase px-5 pb-3 pt-1 border-b flex-shrink-0"
                style={{ borderColor: '#1A3A5C', fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {title}
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
