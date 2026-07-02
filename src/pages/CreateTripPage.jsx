import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useJsApiLoader } from '@react-google-maps/api'
import {
  ArrowLeft, Car, Bike, Activity, Footprints, Mountain, Anchor,
  MapPin, Search, Check, X, Crown, Users, Radar, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import useTripStore from '../store/tripStore'
import { useAuth } from '../contexts/AuthContext'
import { TRANSPORT_OPTIONS } from '../utils/transport'
import { generateTripCode } from '../utils/tripCode'
import { MEMBER_COLORS } from '../utils/colors'
import { MAPS_LOADER_ID, MAPS_LIBRARIES } from '../utils/mapsLoader'
import { db, ref, get, set, push, serverTimestamp } from '../firebase'

const TRANSPORT_ICONS = {
  car: Car, bike: Bike, cycling: Activity,
  walking: Footprints, trekking: Mountain, boat: Anchor,
}

const MODES = [
  {
    id:    'hub',
    Icon:  Crown,
    title: 'Hub & spoke',
    desc:  'You see everyone. Members see you, the route & stops.',
  },
  {
    id:    'everyone',
    Icon:  Users,
    title: 'Everyone sees everyone',
    desc:  'Full visibility — best for small friend groups.',
  },
  {
    id:    'proximity',
    Icon:  Radar,
    title: 'Proximity only',
    desc:  'Members see riders within 5 km of them (plus you).',
  },
]

export default function CreateTripPage() {
  const navigate = useNavigate()
  const { user, isGoogleUser, loading: authLoading, signInWithGoogle } = useAuth()

  const [tripName,  setTripName]  = useState('')
  const [transport, setTransport] = useState(localStorage.getItem('convoy_user_transport') ?? 'car')
  const [mode,      setMode]      = useState('hub')
  const [code,      setCode]      = useState(() => generateTripCode())
  const [creating,  setCreating]  = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  // Destination search (Places)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { isLoaded: mapsReady } = useJsApiLoader({
    id: MAPS_LOADER_ID,
    googleMapsApiKey: apiKey ?? '',
    libraries: MAPS_LIBRARIES,
    preventGoogleFontsLoading: true,
  })
  const [destQuery,   setDestQuery]   = useState('')
  const [predictions, setPredictions] = useState([])
  const [destination, setDestination] = useState(null) // { name, lat, lng }
  const debounceRef = useRef(null)

  const { setMyInfo, setTripCode, setMemberId, setMyColor, setIsCreator, setTripMeta, setShowInvite, setObserver } = useTripStore()

  const handleDestInput = q => {
    setDestQuery(q); setDestination(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim() || !mapsReady || !window.google?.maps?.places) { setPredictions([]); return }
    debounceRef.current = setTimeout(() => {
      new window.google.maps.places.AutocompleteService().getPlacePredictions(
        { input: q },
        (results, status) => setPredictions(
          status === window.google.maps.places.PlacesServiceStatus.OK && results
            ? results.slice(0, 5) : []
        )
      )
    }, 350)
  }

  const pickPrediction = p => {
    setDestQuery(p.description); setPredictions([])
    new window.google.maps.Geocoder().geocode({ placeId: p.place_id }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location
        setDestination({ name: p.structured_formatting?.main_text ?? p.description, lat: loc.lat(), lng: loc.lng() })
      } else {
        toast.error('Could not resolve that place')
      }
    })
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try { await signInWithGoogle() }
    catch { toast.error('Sign-in failed. Please try again.') }
    finally { setSigningIn(false) }
  }

  const create = async () => {
    if (!db || !user) { toast.error('Firebase not configured'); return }
    if (!tripName.trim()) { toast.error('Give your trip a name'); return }
    setCreating(true)
    try {
      // Regenerate on the rare code collision
      let tripCode = code
      for (let i = 0; i < 3; i++) {
        const exists = await get(ref(db, `trips/${tripCode}/meta`))
        if (!exists.exists()) break
        tripCode = generateTripCode()
      }

      const uid  = user.uid
      const name = (user.displayName?.split(' ')[0] ?? 'Organizer').slice(0, 20)
      const color = MEMBER_COLORS[0]

      await set(ref(db, `trips/${tripCode}/meta`), {
        name:      tripName.trim(),
        createdBy: uid,
        mode,
        status:    'active',
        createdAt: serverTimestamp(),
      })
      await set(ref(db, `trips/${tripCode}/profiles/${uid}`), {
        name, transport, color,
        sharing:  true,
        isOnline: true,
        lastSeen: serverTimestamp(),
        joinedAt: serverTimestamp(),
      })
      if (destination) {
        await push(ref(db, `trips/${tripCode}/waypoints`), {
          lat:     destination.lat,
          lng:     destination.lng,
          label:   destination.name.slice(0, 30),
          icon:    'finish',
          type:    'destination',
          addedBy: uid,
          addedAt: serverTimestamp(),
        })
      }
      await push(ref(db, `trips/${tripCode}/chat`), {
        text:       `${name} started the trip${tripName.trim() ? ` "${tripName.trim()}"` : ''}`,
        senderName: 'System',
        senderId:   'system',
        timestamp:  serverTimestamp(),
        type:       'system',
      })

      localStorage.setItem('convoy_user_transport', transport)
      setMyInfo(name, transport)
      setTripCode(tripCode)
      setMemberId(uid)
      setMyColor(color)
      setIsCreator(true)
      setObserver(false)
      setTripMeta({ name: tripName.trim(), mode, createdBy: uid })
      setShowInvite(true) // auto-open the invite sheet on arrival
      navigate(`/trip/${tripCode}`)
    } catch (e) {
      toast.error(e?.message ?? 'Could not create trip')
    } finally {
      setCreating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-sm animate-pulse text-mute">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="flex flex-col px-4 pt-8 pb-10 max-w-sm mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-sub mb-5 hover:text-ink transition-colors self-start"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back
        </button>

        <h1 className="font-display font-semibold text-ink mb-6" style={{ fontSize: 28, letterSpacing: '-0.02em' }}>
          New trip
        </h1>

        {!isGoogleUser ? (
          <motion.div
            className="rounded-card bg-surface p-6 text-center"
            style={{ border: '1px solid #E5E2D9', boxShadow: '0 8px 30px rgba(31,35,31,0.08)' }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E7F1EA' }}>
              <Crown size={22} color="#14523A" />
            </div>
            <p className="text-sm font-semibold text-ink">Organizers sign in with Google</p>
            <p className="text-xs text-sub mt-1 mb-5">
              So your trip stays yours: only you can set the destination, stops and sharing rules.
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full py-3.5 rounded-btn font-semibold text-sm text-white disabled:opacity-60"
              style={{ background: '#1B6B4A' }}
            >
              {signingIn ? 'Signing in…' : 'Continue with Google'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-card bg-surface overflow-hidden"
            style={{ border: '1px solid #E5E2D9', boxShadow: '0 8px 30px rgba(31,35,31,0.08)' }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          >
            <div className="px-6 pt-5 pb-6 space-y-4">
              {/* Trip name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-sub">Trip name</label>
                <input
                  type="text"
                  value={tripName}
                  onChange={e => setTripName(e.target.value.slice(0, 40))}
                  placeholder="e.g. Goa Ride"
                  className="w-full px-4 py-3 text-sm text-ink outline-none rounded-input"
                  style={{ background: '#F4F2EC', border: '1.5px solid #E5E2D9' }}
                />
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-sub">Destination {apiKey ? '' : '(maps not configured)'}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={destQuery}
                    onChange={e => handleDestInput(e.target.value)}
                    disabled={!apiKey}
                    placeholder={apiKey ? 'Search a place… (optional)' : 'Set later from the map'}
                    className="w-full px-4 py-3 pr-9 text-sm text-ink outline-none rounded-input disabled:opacity-50"
                    style={{ background: '#F4F2EC', border: '1.5px solid #E5E2D9' }}
                  />
                  {destQuery
                    ? <button onClick={() => { setDestQuery(''); setDestination(null); setPredictions([]) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute"><X size={15} /></button>
                    : <Search size={15} color="#9AA292" className="absolute right-3 top-1/2 -translate-y-1/2" />}
                </div>
                {predictions.length > 0 && (
                  <div className="rounded-input overflow-hidden" style={{ border: '1px solid #E5E2D9', background: '#FFFFFF' }}>
                    {predictions.map((p, i) => (
                      <button
                        key={p.place_id}
                        onClick={() => pickPrediction(p)}
                        className="w-full flex items-start gap-2 text-left px-4 py-2.5 text-xs text-ink hover:bg-black/5 transition-colors"
                        style={{ borderTop: i > 0 ? '1px solid #E5E2D9' : 'none' }}
                      >
                        <MapPin size={13} color="#9AA292" className="flex-shrink-0 mt-0.5" />
                        <span>
                          <span className="font-bold">{p.structured_formatting?.main_text}</span>
                          {p.structured_formatting?.secondary_text && (
                            <span className="text-mute ml-1">{p.structured_formatting.secondary_text}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {destination && (
                  <div className="flex items-center gap-2 rounded-input px-3 py-2" style={{ background: '#E7F1EA', border: '1px solid #CBDFD2' }}>
                    <Check size={13} color="#1B6B4A" className="flex-shrink-0" />
                    <span className="text-xs font-medium truncate" style={{ color: '#14523A' }}>{destination.name}</span>
                  </div>
                )}
              </div>

              {/* Sharing mode */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-sub">Who sees whom</label>
                <div className="space-y-2">
                  {MODES.map(m => {
                    const sel = mode === m.id
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className="w-full text-left rounded-input px-3.5 py-3 transition-colors"
                        style={{
                          background: sel ? '#E7F1EA' : '#FFFFFF',
                          border:     `1.5px solid ${sel ? '#1B6B4A' : '#E5E2D9'}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <m.Icon size={15} color={sel ? '#14523A' : '#67705F'} />
                          <span className="text-[13px] font-semibold" style={{ color: sel ? '#14523A' : '#1F231F' }}>{m.title}</span>
                          {sel && (
                            <span className="ml-auto text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#1B6B4A' }}>
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-sub mt-1 ml-6">{m.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Your travel mode */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-sub">Your travel mode</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {TRANSPORT_OPTIONS.map(opt => {
                    const Icon = TRANSPORT_ICONS[opt.id] ?? Car
                    const sel  = transport === opt.id
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setTransport(opt.id)}
                        title={opt.label}
                        className="flex items-center justify-center py-2.5 rounded-input transition-colors"
                        style={{
                          background: sel ? '#E7F1EA' : '#F4F2EC',
                          border:     `1.5px solid ${sel ? '#1B6B4A' : '#E5E2D9'}`,
                        }}
                      >
                        <Icon size={17} color={sel ? '#14523A' : '#9AA292'} strokeWidth={1.75} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Trip code */}
              <div className="flex items-center justify-between rounded-input px-4 py-3" style={{ background: '#F4F2EC', border: '1.5px solid #E5E2D9' }}>
                <div>
                  <div className="text-[10px] font-medium text-sub uppercase tracking-wide">Trip code</div>
                  <div className="text-sm font-bold text-ink" style={{ fontFamily: '"Space Mono", monospace', letterSpacing: '0.08em' }}>{code}</div>
                </div>
                <button
                  onClick={() => setCode(generateTripCode())}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: '#1B6B4A' }}
                >
                  <RefreshCw size={11} strokeWidth={2.5} />
                  Regenerate
                </button>
              </div>

              <button
                onClick={create}
                disabled={creating || !tripName.trim()}
                className="w-full py-3.5 rounded-btn font-semibold text-sm text-white disabled:opacity-40"
                style={{ background: '#1B6B4A' }}
              >
                {creating ? 'Creating…' : 'Create & get invite code'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
