import { useState, useEffect, useRef } from 'react'
import {
  MapPin, Coffee, Flag, Lock, Search, Check, AlertTriangle, Crosshair, X,
} from 'lucide-react'
import BottomSheet from '../ui/BottomSheet'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../../store/tripStore'
import { db, ref, push, serverTimestamp } from '../../firebase'
import { distanceToPolyline } from '../../utils/distance'
import { WAYPOINT_ICONS } from '../../utils/waypointIcons'
import toast from 'react-hot-toast'

const ALL_TYPES = [
  {
    id:    'pin',
    label: 'Pin',
    Icon:  MapPin,
    icons: [
      { id: 'mark',    label: 'Mark'    },
      { id: 'food',    label: 'Food'    },
      { id: 'fuel',    label: 'Fuel'    },
      { id: 'parking', label: 'Parking' },
      { id: 'danger',  label: 'Danger'  },
      { id: 'photo',   label: 'Photo'   },
    ],
  },
  {
    id:    'rest',
    label: 'Rest Stop',
    Icon:  Coffee,
    creatorOnly: true,
    icons: [
      { id: 'break',   label: 'Break'   },
      { id: 'camp',    label: 'Camp'    },
      { id: 'shelter', label: 'Shelter' },
      { id: 'toilet',  label: 'Toilet'  },
      { id: 'shade',   label: 'Shade'   },
      { id: 'rest',    label: 'Rest'    },
    ],
  },
  {
    id:    'destination',
    label: 'Destination',
    Icon:  Flag,
    creatorOnly: true,
    icons: [
      { id: 'finish',   label: 'Finish'   },
      { id: 'hotel',    label: 'Hotel'    },
      { id: 'beach',    label: 'Beach'    },
      { id: 'summit',   label: 'Summit'   },
      { id: 'landmark', label: 'Landmark' },
      { id: 'target',   label: 'Target'   },
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
  const [type,      setType]      = useState('pin')
  const [icon,      setIcon]      = useState('mark')
  const [label,     setLabel]     = useState('')
  const [dropping,  setDropping]  = useState(false)
  const [warnModal, setWarnModal] = useState(null) // { pos, posSource } pending confirmation

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
      setType('pin'); setIcon('mark')
    }
  }, [isCreator]) // eslint-disable-line

  const handleTypeChange = (newType) => {
    setType(newType)
    const t = ALL_TYPES.find(t => t.id === newType)
    setIcon(t.icons[0].id)
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
        icon,
        type,
        addedBy: memberId,
        addedAt: serverTimestamp(),
      })

      const typeLabel = type === 'destination' ? 'destination' : type === 'rest' ? 'rest stop' : 'pin'
      await push(ref(db, `trips/${tripCode}/chat`), {
        text:       `${myName} added a ${typeLabel}${finalLabel ? `: ${finalLabel}` : ''}`,
        senderName: 'System',
        senderId:   'system',
        timestamp:  serverTimestamp(),
        type:       'system',
      })

      toast.success(
        type === 'destination' ? 'Destination set!'  :
        type === 'rest'        ? 'Rest stop added!'   : 'Pin dropped!'
      )
      setLabel(''); setIcon(selectedType.icons[0].id); clearSearch(); onClose()
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
              style={{ background: '#FBF3E2', border: '1px solid #EFDDB8' }}
            >
              <Lock size={13} color="#B0700F" className="flex-shrink-0" />
              <p className="text-xs font-medium" style={{ color: '#B0700F' }}>
                Only the trip organiser can set stops & destination
              </p>
            </div>
          )}

          {/* Type tabs */}
          <div className="flex gap-2">
            {availableTypes.map(t => {
              const active = type === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className="flex-1 flex flex-col items-center gap-1.5 rounded-xl py-2.5 transition-colors"
                  style={{
                    background: active ? '#E7F1EA' : '#F4F2EC',
                    border:     active ? '1px solid #1B6B4A' : '1px solid #E5E2D9',
                  }}
                >
                  <t.Icon size={18} strokeWidth={active ? 2.25 : 1.75} color={active ? '#14523A' : '#67705F'} />
                  <span className="font-medium" style={{ fontSize: 10, color: active ? '#14523A' : '#67705F' }}>{t.label}</span>
                </button>
              )
            })}
          </div>

          <p className="text-sub text-center" style={{ fontSize: 11 }}>
            {type === 'destination' && 'Final stop — everyone navigates here'}
            {type === 'rest'        && 'Rest point — convoy pauses here'}
            {type === 'pin'         && 'General marker visible to the group'}
          </p>

          {/* Place search */}
          {mapsApiKey && (
            <div className="space-y-1">
              <label className="text-sub text-xs font-semibold uppercase tracking-widest">Search Place</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearchInput(e.target.value)}
                  placeholder="City, landmark or address…"
                  className="w-full font-body text-sm text-textprimary rounded-xl px-4 py-3 pr-9 outline-none"
                  style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
                />
                {searchQuery
                  ? <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-textmuted"><X size={15} /></button>
                  : <Search size={15} color="#9AA292" className="absolute right-3 top-1/2 -translate-y-1/2" />
                }
              </div>

              {predictions.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E2D9', background: '#FFFFFF' }}>
                  {predictions.map((p, i) => (
                    <button
                      key={p.place_id}
                      onClick={() => handleSelectPrediction(p)}
                      className="w-full flex items-start gap-2 text-left px-4 py-2.5 font-body text-xs text-textprimary hover:bg-black/5 transition-colors"
                      style={{ borderTop: i > 0 ? '1px solid #E5E2D9' : 'none' }}
                    >
                      <MapPin size={13} color="#9AA292" className="flex-shrink-0 mt-0.5" />
                      <span>
                        <span className="font-bold">{p.structured_formatting?.main_text}</span>
                        {p.structured_formatting?.secondary_text && (
                          <span className="text-textmuted ml-1">{p.structured_formatting.secondary_text}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searching && <p className="text-sub text-xs text-center animate-pulse">Searching…</p>}

              {searchedPos && (
                <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#E7F1EA', border: '1px solid #CBDFD2' }}>
                  <Check size={14} color="#1B6B4A" className="flex-shrink-0" />
                  <p className="text-xs font-medium flex-1 truncate" style={{ color: '#14523A' }}>{searchedName}</p>
                  <button onClick={clearSearch} className="text-textmuted"><X size={13} /></button>
                </div>
              )}
            </div>
          )}

          {/* Icon grid */}
          <div className="grid grid-cols-6 gap-2">
            {selectedType.icons.map(cat => {
              const CatIcon = WAYPOINT_ICONS[cat.id] ?? MapPin
              const active  = icon === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setIcon(cat.id)}
                  className="flex flex-col items-center gap-1 rounded-xl p-2 transition-colors"
                  style={{
                    background: active ? '#E7F1EA' : '#F4F2EC',
                    border:     active ? '1px solid #1B6B4A' : '1px solid #E5E2D9',
                  }}
                >
                  <CatIcon size={17} strokeWidth={active ? 2.25 : 1.75} color={active ? '#14523A' : '#67705F'} />
                  <span className="font-medium" style={{ fontSize: 8.5, color: active ? '#14523A' : '#9AA292' }}>{cat.label}</span>
                </button>
              )
            })}
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
            style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
          />

          {/* Location source buttons */}
          <div className={`grid gap-3 ${searchedPos ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {searchedPos && (
              <button
                onClick={() => drop('search')}
                disabled={dropping}
                className="py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                style={{ background: '#1B6B4A' }}
              >
                <Search size={14} /> Searched
              </button>
            )}
            <button
              onClick={() => drop('mine')}
              disabled={dropping || !myPos}
              className="py-3 rounded-xl font-semibold text-sm text-textprimary disabled:opacity-40 flex items-center justify-center gap-1.5"
              style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
            >
              <MapPin size={14} color="#67705F" /> My Location
            </button>
            <button
              onClick={() => drop('map')}
              disabled={dropping}
              className="py-3 rounded-xl font-semibold text-sm text-textprimary disabled:opacity-40 flex items-center justify-center gap-1.5"
              style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
            >
              <Crosshair size={14} color="#67705F" /> Map Center
            </button>
          </div>

          {!searchedPos && (
            <button
              onClick={() => drop('mine')}
              disabled={dropping || !myPos}
              className="w-full py-3 rounded-xl font-semibold text-sm uppercase tracking-widest text-white disabled:opacity-50"
              style={{ background: '#1B6B4A' }}
            >
              {dropping ? 'Saving…' :
                type === 'destination' ? 'Set Destination' :
                type === 'rest'        ? 'Add Rest Stop'   : 'Drop Pin'}
            </button>
          )}
        </div>
      </BottomSheet>

      {/* Off-route warning modal */}
      {warnModal && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center p-4"
          style={{ background: 'rgba(31,35,31,0.45)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-7 space-y-5"
            style={{ background: '#FFFFFF', border: '2px solid #B0700F' }}
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#FBF3E2' }}>
                  <AlertTriangle size={24} color="#B0700F" />
                </div>
              </div>
              <h3 className="font-display font-semibold text-2xl text-warning">Off-Route Stop</h3>
              <p className="text-sub text-sm mt-2">
                This stop is <span className="text-warning font-bold">{warnModal.km} km</span> away
                from your planned route. The convoy may miss it.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setWarnModal(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-textprimary"
                style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeDrop(warnModal.pos, warnModal.posSource)}
                disabled={dropping}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60"
                style={{ background: '#B0700F' }}
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
