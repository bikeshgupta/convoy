import { useState, useRef } from 'react'
import BottomSheet from '../ui/BottomSheet'
import useTripStore from '../../store/tripStore'
import { db, ref, push, serverTimestamp } from '../../firebase'
import toast from 'react-hot-toast'

const EMOJI_CATEGORIES = [
  { emoji: '🍽️', label: 'Food' },
  { emoji: '⛽', label: 'Fuel' },
  { emoji: '🏕️', label: 'Camp' },
  { emoji: '☕', label: 'Break' },
  { emoji: '🚨', label: 'Danger' },
  { emoji: '🏁', label: 'Finish' },
  { emoji: '🅿️', label: 'Parking' },
  { emoji: '📍', label: 'Other' },
]

export default function WaypointPicker({ onClose, mapCenterRef }) {
  const [emoji,    setEmoji]    = useState('📍')
  const [label,    setLabel]    = useState('')
  const [dropping, setDropping] = useState(false)

  const { tripCode, memberId, myName, myPos, activePanel } = useTripStore(s => ({
    tripCode:    s.tripCode,
    memberId:    s.memberId,
    myName:      s.myName,
    myPos:       s.myPos,
    activePanel: s.activePanel,
  }))

  const drop = async (useMapCenter = false) => {
    const pos = useMapCenter ? mapCenterRef?.current : myPos
    if (!pos || !db || !tripCode) {
      toast.error('No location available')
      return
    }
    setDropping(true)
    try {
      await push(ref(db, `trips/${tripCode}/waypoints`), {
        lat:     pos.lat,
        lng:     pos.lng,
        label:   label.trim(),
        emoji,
        addedBy: memberId,
        addedAt: serverTimestamp(),
      })
      await push(ref(db, `trips/${tripCode}/chat`), {
        text:       `📍 ${myName} dropped a pin: ${emoji} ${label || emoji}`,
        senderName: 'System',
        senderId:   'system',
        timestamp:  serverTimestamp(),
        type:       'system',
      })
      toast.success('📍 Pin dropped!')
      setLabel('')
      setEmoji('📍')
      onClose()
    } catch (e) {
      toast.error('Failed to drop pin')
    } finally {
      setDropping(false)
    }
  }

  return (
    <BottomSheet
      isOpen={activePanel === 'waypoints'}
      onClose={onClose}
      title="DROP A PIN"
      height="auto"
    >
      <div className="p-5 space-y-5">
        {/* Selected emoji preview */}
        <div className="flex justify-center">
          <div className="text-5xl">{emoji}</div>
        </div>

        {/* Emoji grid */}
        <div className="grid grid-cols-4 gap-2">
          {EMOJI_CATEGORIES.map(cat => (
            <button
              key={cat.emoji}
              onClick={() => setEmoji(cat.emoji)}
              className="flex flex-col items-center gap-1 rounded-xl p-2 transition-colors"
              style={{
                background: emoji === cat.emoji ? '#00FF8820' : '#112236',
                border:     emoji === cat.emoji ? '1px solid #00FF8860' : '1px solid #1A3A5C',
              }}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="font-mono text-textmuted" style={{ fontSize: 9 }}>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Label input */}
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value.slice(0, 30))}
          placeholder="Short description (optional)"
          className="w-full font-body text-sm text-textprimary rounded-xl px-4 py-3 outline-none"
          style={{ background: '#112236', border: '1px solid #1A3A5C' }}
        />

        {/* Location buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => drop(false)}
            disabled={dropping || !myPos}
            className="py-3 rounded-xl font-mono font-bold text-sm text-textprimary disabled:opacity-40"
            style={{ background: '#112236', border: '1px solid #1A3A5C' }}
          >
            📍 My Location
          </button>
          <button
            onClick={() => drop(true)}
            disabled={dropping}
            className="py-3 rounded-xl font-mono font-bold text-sm text-textprimary disabled:opacity-40"
            style={{ background: '#112236', border: '1px solid #1A3A5C' }}
          >
            🎯 Map Center
          </button>
        </div>

        <button
          onClick={() => drop(false)}
          disabled={dropping || !myPos}
          className="w-full py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-black disabled:opacity-50"
          style={{ background: '#00FF88' }}
        >
          {dropping ? '📡 Dropping...' : 'DROP PIN'}
        </button>
      </div>
    </BottomSheet>
  )
}
