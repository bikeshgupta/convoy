import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { db, ref, push, serverTimestamp } from '../../firebase'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { nanoid } from 'nanoid'

export default function SOSButton() {
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef(null)
  const startRef    = useRef(null)

  const { tripCode, memberId, myName, myPos } = useTripStore(useShallow(s => ({
    tripCode: s.tripCode,
    memberId: s.memberId,
    myName:   s.myName,
    myPos:    s.myPos,
  })))

  const triggerSOS = useCallback(() => {
    navigator.vibrate?.([200, 100, 200, 100, 200])
    if (db && tripCode && myPos) {
      const sosRef  = ref(db, `trips/${tripCode}/sos`)
      const chatRef = ref(db, `trips/${tripCode}/chat`)
      push(sosRef, {
        triggeredBy:     memberId,
        triggeredByName: myName,
        lat:             myPos.lat,
        lng:             myPos.lng,
        timestamp:       serverTimestamp(),
        resolved:        false,
      })
      push(chatRef, {
        text:       `${myName} triggered SOS!`,
        senderName: 'System',
        senderId:   'system',
        timestamp:  serverTimestamp(),
        type:       'sos',
      })
    }
    toast.error(`SOS alert sent to all members`, { duration: 5000 })
  }, [tripCode, memberId, myName, myPos])

  const startHold = () => {
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.min((elapsed / 1500) * 100, 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(intervalRef.current)
        setProgress(0)
        triggerSOS()
      }
    }, 30)
  }

  const endHold = () => {
    clearInterval(intervalRef.current)
    setProgress(0)
  }

  const radius = 26
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress / 100)

  return (
    <div className="fixed right-4 z-[90] flex flex-col items-center" style={{ bottom: 80 }}>
      <button
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        className="relative flex flex-col items-center justify-center rounded-full select-none"
        style={{
          width:      56,
          height:     56,
          background: '#BE4B3B',
          boxShadow:  '0 4px 20px rgba(190,75,59,0.4)',
        }}
      >
        {/* Progress ring */}
        <svg className="absolute inset-0 -rotate-90" width="56" height="56">
          <circle
            cx="28" cy="28" r={radius}
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.03s linear' }}
          />
        </svg>
        <AlertTriangle size={20} color="white" className="relative z-10" />
        <span className="relative z-10 font-mono font-bold text-white" style={{ fontSize: 8 }}>SOS</span>
      </button>
      <span className="font-mono text-danger mt-1" style={{ fontSize: 9 }}>HOLD</span>
    </div>
  )
}
