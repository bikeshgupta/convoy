import { useState } from 'react'
import BottomSheet from '../ui/BottomSheet'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { db, ref, push, serverTimestamp } from '../../firebase'
import toast from 'react-hot-toast'

const WAYPOINT_TYPES = [
  {
    id:    'pin',
    label: 'Pin',
    icon:  '📍',
    emojis: [
      { emoji: '📍', label: 'Mark'    },
      { emoji: '🍽️', label: 'Food'    },
      { emoji: '⛽',  label: 'Fuel'    },
      { emoji: '🅿️',  label: 'Parking' },
      { emoji: '🚨', label: 'Danger'  },
      { emoji: '📷', label: 'Photo'   },
    ],
  },
  {
    id:    'rest',
    label: 'Rest Stop',
    icon:  '☕',
    emojis: [
      { emoji: '☕',  label: 'Break'  },
      { emoji: '🏕️', label: 'Camp'   },
      { emoji: '🛖',  label: 'Shelter'},
      { emoji: '🚿',  label: 'Toilet' },
      { emoji: '🌴',  label: 'Shade'  },
      { emoji: '🛌',  label: 'Rest'   },
    ],
  },
  {
    id:    'destination',
    label: 'Destination',
    icon:  '🏁',
    emojis: [
      { emoji: '🏁',  label: 'Finish'  },
      { emoji: '🏨',  label: 'Hotel'   },
      { emoji: '🏖️', label: 'Beach'   },
      { emoji: '⛰️',  label: 'Summit'  },
      { emoji: '🏛️',  label: 'Landmark'},
      { emoji: '🎯',  label: 'Target'  },
    ],
  },
]

export default function WaypointPicker({ onClose, mapCenterRef }) {
  const [type,     setType]     = useState('pin')
  const [emoji,    setEmoji]    = useState('📍')
  const [label,    setLabel]    = useState('')
  const [dropping, setDropping] = useState(false)

  const { tripCode, memberId, myName, myPos, activePanel } = useTripStore(useShallow(s => ({
    tripCode:    s.tripCode,
    memberId:    s.memberId,
    myName:      s.myName,
    myPos:       s.myPos,
    activePanel: s.activePanel,
  })))

  const selectedType = WAYPOINT_TYPES.find(t => t.id === type)

  const handleTypeChange = (newType) => {
    setType(newType)
    const t = WAYPOINT_TYPES.find(t => t.id === newType)
    setEmoji(t.emojis[0].emoji)
  }

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
        type,
        addedBy: memberId,
        addedAt: serverTimestamp(),
      })

      const typeLabel = type === 'destination' ? 'destination' : type === 'rest' ? 'rest stop' : 'pin'
      await push(ref(db, `trips/${tripCode}/chat`), {
        text:       `${myName} added a ${typeLabel}: ${emoji} ${label || emoji}`,
        senderName: 'System',
        senderId:   'system',
        timestamp:  serverTimestamp(),
        type:       'system',
      })
      toast.success(type === 'destination' ? '🏁 Destination set!' : type === 'rest' ? '☕ Rest stop added!' : '📍 Pin dropped!')
      setLabel('')
      setEmoji(selectedType.emojis[0].emoji)
      onClose()
    } catch {
      toast.error('Failed to drop pin')
    } finally {
      setDropping(false)
    }
  }

  return (
    <BottomSheet
      isOpen={activePanel === 'waypoints'}
      onClose={onClose}
      title="ADD WAYPOINT"
      height="auto"
    >
      <div className="p-5 space-y-4">
        {/* Type tabs */}
        <div className="flex gap-2">
          {WAYPOINT_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => handleTypeChange(t.id)}
              className="flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5 transition-colors"
              style={{
                background: type === t.id ? '#00FF8810' : '#112236',
                border:     type === t.id ? '1px solid #00FF8860' : '1px solid #1A3A5C',
              }}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="font-mono text-textmuted" style={{ fontSize: 9 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Type description */}
        <p className="font-mono text-textmuted text-center" style={{ fontSize: 10 }}>
          {type === 'destination' && '🏁 Final stop — everyone is heading here'}
          {type === 'rest'        && '☕ Rest point — convoy will pause here'}
          {type === 'pin'         && '📍 General marker for the group'}
        </p>

        {/* Emoji grid */}
        <div className="grid grid-cols-6 gap-2">
          {selectedType.emojis.map(cat => (
            <button
              key={cat.emoji}
              onClick={() => setEmoji(cat.emoji)}
              className="flex flex-col items-center gap-0.5 rounded-xl p-2 transition-colors"
              style={{
                background: emoji === cat.emoji ? '#00FF8820' : '#112236',
                border:     emoji === cat.emoji ? '1px solid #00FF8860' : '1px solid #1A3A5C',
              }}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="font-mono text-textmuted" style={{ fontSize: 8 }}>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Label input */}
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value.slice(0, 30))}
          placeholder={
            type === 'destination' ? 'Destination name (optional)' :
            type === 'rest'        ? 'Rest stop name (optional)'   :
                                     'Short description (optional)'
          }
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
          {dropping ? '📡 Saving...' : type === 'destination' ? 'SET DESTINATION' : type === 'rest' ? 'ADD REST STOP' : 'DROP PIN'}
        </button>
      </div>
    </BottomSheet>
  )
}
