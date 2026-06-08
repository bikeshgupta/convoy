import { useState, useEffect, useRef } from 'react'
import BottomSheet from '../ui/BottomSheet'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { db, ref, push, serverTimestamp } from '../../firebase'
import { distanceToPolyline } from '../../utils/distance'
import toast from 'react-hot-toast'

const ALL_TYPES = [
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
    creatorOnly: true,
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
    creatorOnly: true,
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

const OFF_ROUTE_THRESHOLD_M = 5000 // 5 km

export default function WaypointPicker({ onClose, mapCenterRef }) {
  const {
    tripCode, memberId, myName, myPos, activePanel, isCreator, routePath,
  } = useTripStore(useShallow(s => ({
    tripCode:    s.tripCode,
    memberId:    s.memberId,
    myName:      s.myName,
    myPos:       s.myPos,
    activePanel: s.activePanel,
    isCreator:   s.isCreator,
    routePath:   s.routePath,
  })))

  // Guests can only add pins
  const availableTypes = isCreator ? ALL_TYPES : ALL_TYPES.filter(t => !t.creatorOnly)
  const [type,        setType]        = useState('pin')
  const [emoji,       setEmoji]       = useState('📍')
  const [label,       setLabel]       = useState('')
  const [dropping,    setDropping]    = useState(false)
  const [warnModal,   setWarnModal]   = useState(null) // { pos, posSource } pending confirmation

  // Place search
  const [searchQuery,  setSearchQuery]  = useState('')
  const [predictions,  setPredictions]  = useState([])
  const [searchedPos,  setSearchedPos]  = useState(null)
  const [searchedName, setSearchedName] = useState('')
  const [searching,    setSearching]    = useState(false)
  const debounceRef = useRef(null)

  const selectedType = ALL_TYPES.find(t => t.id === type) ?? ALL_TYPES[0]

  useEffect(() => {
    if (activePanel !== 'waypoints') {
      setSearchQuery(''); setPredictions([]); setSearchedPos(null); setSearchedName('')
    }
  }, [activePanel])

  // Ensure current type is valid for this user
  useEffect(() => {
    if (!isCreator && selectedType.creatorOnly) {
      setType('pin'); setEmoji('📍')
    }
  }, [isCreator]) // eslint-disable-line

  const handleTypeChange = (newType) => {
    setType(newType)
    const t = ALL_TYPES.find(t => t.id === newType)
    setEmoji(t.emojis[0].emoji)
  }

  const handleSearchInput = (query) => {
    setSearchQuery(query)
    setSearchedPos(null); setSearchedName('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setPredictions([]); return }
    debounceRef.current = setTimeout(() => {
      if (!window.google?.maps?.places) return
      setSearching(true)
      new window.google.maps.places.AutocompleteService().getPlacePredictions(
        { input: query },
        (results, status) => {
          setSearching(false)
          setPredictions(
            status === window.google.maps.places.PlacesServiceStatus.OK && results
              ? results.slice(0, 5)
              : []
          )
        }
      )
    }, 350)
  }

  const handleSelectPrediction = (p) => {
    setSearchQuery(p.description); setPredictions([]); setSearchedName(p.description)
    if (!window.google?.maps) return
    new window.google.maps.Geocoder().geocode({ placeId: p.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location
        setSearchedPos({ lat: loc.lat(), lng: loc.lng() })
      } else {
        toast.error('Could not resolve location')
      }
    })
  }

  const clearSearch = () => {
    setSearchQuery(''); setPredictions([]); setSearchedPos(null); setSearchedName('')
  }

  // Check if pos is far off the planned route
  const checkDeviation = (pos) => {
    if (!routePath || !pos) return 0
    return distanceToPolyline(pos, routePath)
  }

  const executeDrop = async (pos, posSource) => {
    if (!pos || !db || !tripCode) { toast.error('No location available'); return }
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
      setLabel(''); setEmoji(selectedType.emojis[0].emoji); clearSearch(); onClose()
    } catch {
      toast.error('Failed to drop pin')
    } finally {
      setDropping(false); setWarnModal(null)
    }
  }

  const drop = (posSource = 'mine') => {
    let pos
    if (posSource === 'search')  pos = searchedPos
    else if (posSource === 'map') pos = mapCenterRef?.current ? { lat: mapCenterRef.current.lat, lng: mapCenterRef.current.lng } : null
    else                          pos = myPos

    if (!pos) { toast.error('No location available'); return }

    // Warn if rest/destination is far off planned route
    if ((type === 'rest' || type === 'destination') && routePath) {
      const deviation = checkDeviation(pos)
      if (deviation > OFF_ROUTE_THRESHOLD_M) {
        const km = (deviation / 1000).toFixed(1)
        setWarnModal({ pos, posSource, km })
        return
      }
    }

    executeDrop(pos, posSource)
  }

  const mapsApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  return (
    <>
      <BottomSheet isOpen={activePanel === 'waypoints'} onClose={onClose} title="ADD WAYPOINT" height="auto">
        <div className="p-5 space-y-4">
          {/* Non-creator notice */}
          {!isCreator && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: '#FFB80015', border: '1px solid #FFB80040' }}
            >
              <span className="text-sm">🔒</span>
              <p className="font-mono text-xs" style={{ color: '#FFB800' }}>
                Only the trip organiser can set stops & destination
              </p>
            </div>
          )}

          {/* Type tabs */}
          <div className="flex gap-2">
            {availableTypes.map(t => (
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
            {type === 'destination' && '🏁 Final stop — everyone navigates here'}
            {type === 'rest'        && '☕ Rest point — convoy pauses here'}
            {type === 'pin'         && '📍 General marker visible to the group'}
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
                  placeholder="City, landmark or address…"
                  className="w-full font-body text-sm text-textprimary rounded-xl px-4 py-3 pr-9 outline-none"
                  style={{ background: '#112236', border: '1px solid #1A3A5C' }}
                />
                {searchQuery
                  ? <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted text-lg leading-none">×</button>
                  : <span className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted text-sm">🔍</span>
                }
              </div>

              {predictions.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1A3A5C', background: '#0D1A2A' }}>
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

              {searching && <p className="font-mono text-textmuted text-xs text-center animate-pulse">Searching…</p>}

              {searchedPos && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#00FF8810', border: '1px solid #00FF8830' }}>
                  <span className="text-base">✅</span>
                  <p className="font-mono text-xs flex-1 truncate" style={{ color: '#00FF88' }}>{searchedName}</p>
                  <button onClick={clearSearch} className="text-textmuted text-sm">×</button>
                </div>
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

          {/* Label */}
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

      {/* Off-route warning modal */}
      {warnModal && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-7 space-y-5"
            style={{ background: '#0D1A2A', border: '2px solid #FFB800' }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="font-display text-2xl text-warning">Off-Route Stop</h3>
              <p className="font-mono text-textmuted text-sm mt-2">
                This stop is <span className="text-warning font-bold">{warnModal.km} km</span> away
                from your planned route. The convoy may miss it.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setWarnModal(null)}
                className="flex-1 py-3 rounded-xl font-mono font-bold text-sm text-textprimary"
                style={{ background: '#112236', border: '1px solid #1A3A5C' }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeDrop(warnModal.pos, warnModal.posSource)}
                disabled={dropping}
                className="flex-1 py-3 rounded-xl font-mono font-bold text-sm text-black disabled:opacity-60"
                style={{ background: '#FFB800' }}
              >
                {dropping ? 'Adding…' : 'Add Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
