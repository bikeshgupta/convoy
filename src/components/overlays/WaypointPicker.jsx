import { useState, useEffect, useRef } from 'react'
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
      { emoji: '☕',  label: 'Break'   },
      { emoji: '🏕️', label: 'Camp'    },
      { emoji: '🛖',  label: 'Shelter' },
      { emoji: '🚿',  label: 'Toilet'  },
      { emoji: '🌴',  label: 'Shade'   },
      { emoji: '🛌',  label: 'Rest'    },
    ],
  },
  {
    id:    'destination',
    label: 'Destination',
    icon:  '🏁',
    emojis: [
      { emoji: '🏁',  label: 'Finish'   },
      { emoji: '🏨',  label: 'Hotel'    },
      { emoji: '🏖️', label: 'Beach'    },
      { emoji: '⛰️',  label: 'Summit'   },
      { emoji: '🏛️',  label: 'Landmark' },
      { emoji: '🎯',  label: 'Target'   },
    ],
  },
]

export default function WaypointPicker({ onClose, mapCenterRef }) {
  const [type,        setType]        = useState('pin')
  const [emoji,       setEmoji]       = useState('📍')
  const [label,       setLabel]       = useState('')
  const [dropping,    setDropping]    = useState(false)

  // Place search state
  const [searchQuery,  setSearchQuery]  = useState('')
  const [predictions,  setPredictions]  = useState([])
  const [searchedPos,  setSearchedPos]  = useState(null)
  const [searchedName, setSearchedName] = useState('')
  const [searching,    setSearching]    = useState(false)
  const debounceRef = useRef(null)

  const { tripCode, memberId, myName, myPos, activePanel } = useTripStore(useShallow(s => ({
    tripCode:    s.tripCode,
    memberId:    s.memberId,
    myName:      s.myName,
    myPos:       s.myPos,
    activePanel: s.activePanel,
  })))

  const selectedType = WAYPOINT_TYPES.find(t => t.id === type)

  // Reset search state when panel closes
  useEffect(() => {
    if (activePanel !== 'waypoints') {
      setSearchQuery('')
      setPredictions([])
      setSearchedPos(null)
      setSearchedName('')
    }
  }, [activePanel])

  const handleTypeChange = (newType) => {
    setType(newType)
    const t = WAYPOINT_TYPES.find(t => t.id === newType)
    setEmoji(t.emojis[0].emoji)
  }

  const handleSearchInput = (query) => {
    setSearchQuery(query)
    setSearchedPos(null)
    setSearchedName('')

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setPredictions([]); return }

    debounceRef.current = setTimeout(() => {
      if (!window.google?.maps?.places) {
        toast.error('Maps not loaded yet')
        return
      }
      setSearching(true)
      const service = new window.google.maps.places.AutocompleteService()
      service.getPlacePredictions({ input: query }, (results, status) => {
        setSearching(false)
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results.slice(0, 5))
        } else {
          setPredictions([])
        }
      })
    }, 350)
  }

  const handleSelectPrediction = (prediction) => {
    setSearchQuery(prediction.description)
    setPredictions([])
    setSearchedName(prediction.description)

    if (!window.google?.maps) return
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location
        setSearchedPos({ lat: loc.lat(), lng: loc.lng() })
      } else {
        toast.error('Could not resolve location')
      }
    })
  }

  const clearSearch = () => {
    setSearchQuery('')
    setPredictions([])
    setSearchedPos(null)
    setSearchedName('')
  }

  const drop = async (posSource = 'mine') => {
    let pos
    if (posSource === 'search')  pos = searchedPos
    else if (posSource === 'map') pos = mapCenterRef?.current
    else                          pos = myPos

    if (!pos || !db || !tripCode) {
      toast.error('No location available')
      return
    }
    setDropping(true)
    try {
      const finalLabel = posSource === 'search' && searchedName
        ? (label.trim() || searchedName)
        : label.trim()

      await push(ref(db, `trips/${tripCode}/waypoints`), {
        lat:     pos.lat,
        lng:     pos.lng,
        label:   finalLabel,
        emoji,
        type,
        addedBy: memberId,
        addedAt: serverTimestamp(),
      })

      const typeLabel = type === 'destination' ? 'destination' : type === 'rest' ? 'rest stop' : 'pin'
      await push(ref(db, `trips/${tripCode}/chat`), {
        text:       `${myName} added a ${typeLabel}: ${emoji} ${finalLabel || emoji}`,
        senderName: 'System',
        senderId:   'system',
        timestamp:  serverTimestamp(),
        type:       'system',
      })

      toast.success(
        type === 'destination' ? '🏁 Destination set!'  :
        type === 'rest'        ? '☕ Rest stop added!'   : '📍 Pin dropped!'
      )
      setLabel('')
      setEmoji(selectedType.emojis[0].emoji)
      clearSearch()
      onClose()
    } catch {
      toast.error('Failed to drop pin')
    } finally {
      setDropping(false)
    }
  }

  const mapsApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const mapsReady  = typeof window !== 'undefined' && !!window.google?.maps?.places

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

        <p className="font-mono text-textmuted text-center" style={{ fontSize: 10 }}>
          {type === 'destination' && '🏁 Final stop — everyone is heading here'}
          {type === 'rest'        && '☕ Rest point — convoy will pause here'}
          {type === 'pin'         && '📍 General marker for the group'}
        </p>

        {/* Place search */}
        {mapsApiKey && (
          <div className="space-y-1">
            <label className="font-mono text-textmuted text-xs uppercase tracking-widest">Search Place</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                placeholder="Type a city, landmark or address…"
                className="w-full font-body text-sm text-textprimary rounded-xl px-4 py-3 pr-9 outline-none"
                style={{ background: '#112236', border: '1px solid #1A3A5C' }}
              />
              {searchQuery ? (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted text-lg leading-none"
                >×</button>
              ) : (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted text-sm">🔍</span>
              )}
            </div>

            {/* Autocomplete dropdown */}
            {predictions.length > 0 && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid #1A3A5C', background: '#0D1A2A' }}
              >
                {predictions.map((p, i) => (
                  <button
                    key={p.place_id}
                    onClick={() => handleSelectPrediction(p)}
                    className="w-full text-left px-4 py-2.5 font-body text-xs text-textprimary hover:bg-white/5 transition-colors"
                    style={{ borderTop: i > 0 ? '1px solid #1A3A5C' : 'none' }}
                  >
                    <span className="mr-2">📍</span>
                    <span className="font-bold">{p.structured_formatting?.main_text}</span>
                    {p.structured_formatting?.secondary_text && (
                      <span className="text-textmuted ml-1">{p.structured_formatting.secondary_text}</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <p className="font-mono text-textmuted text-xs text-center animate-pulse">Searching…</p>
            )}

            {/* Selected place badge */}
            {searchedPos && (
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: '#00FF8810', border: '1px solid #00FF8830' }}
              >
                <span className="text-base">✅</span>
                <p className="font-mono text-xs flex-1 truncate" style={{ color: '#00FF88' }}>
                  {searchedName}
                </p>
                <button onClick={clearSearch} className="text-textmuted text-sm">×</button>
              </div>
            )}

            {!mapsReady && mapsApiKey && (
              <p className="font-mono text-textmuted text-xs text-center">
                Place search loads with the map
              </p>
            )}
          </div>
        )}

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

        {/* Optional label */}
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

        {/* Location source buttons */}
        <div className={`grid gap-3 ${searchedPos ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {searchedPos && (
            <button
              onClick={() => drop('search')}
              disabled={dropping}
              className="py-3 rounded-xl font-mono font-bold text-sm text-black disabled:opacity-40"
              style={{ background: '#00FF88' }}
            >
              🔍 Searched
            </button>
          )}
          <button
            onClick={() => drop('mine')}
            disabled={dropping || !myPos}
            className="py-3 rounded-xl font-mono font-bold text-sm text-textprimary disabled:opacity-40"
            style={{ background: '#112236', border: '1px solid #1A3A5C' }}
          >
            📍 My Location
          </button>
          <button
            onClick={() => drop('map')}
            disabled={dropping}
            className="py-3 rounded-xl font-mono font-bold text-sm text-textprimary disabled:opacity-40"
            style={{ background: '#112236', border: '1px solid #1A3A5C' }}
          >
            🎯 Map Center
          </button>
        </div>

        {/* Primary CTA */}
        {!searchedPos && (
          <button
            onClick={() => drop('mine')}
            disabled={dropping || !myPos}
            className="w-full py-3 rounded-xl font-mono font-bold text-sm uppercase tracking-widest text-black disabled:opacity-50"
            style={{ background: '#00FF88' }}
          >
            {dropping ? '📡 Saving...' :
              type === 'destination' ? 'SET DESTINATION' :
              type === 'rest'        ? 'ADD REST STOP'   : 'DROP PIN'}
          </button>
        )}
      </div>
    </BottomSheet>
  )
}
