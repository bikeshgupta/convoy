import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Map as MapIcon, Users, MessageCircle, Route as RouteIcon, MapPin, Siren, BatteryLow, WifiOff, ShieldCheck, Flag } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../store/tripStore'
import { useAuth } from '../contexts/AuthContext'
import useGeolocation from '../hooks/useGeolocation'
import useTrip from '../hooks/useTrip'
import useMembers from '../hooks/useMembers'
import useChat from '../hooks/useChat'
import useBattery from '../hooks/useBattery'
import useRoute from '../hooks/useRoute'
import useWakeLock from '../hooks/useWakeLock'
import ConvoyMap from '../components/map/ConvoyMap'
import TopBar from '../components/overlays/TopBar'
import InviteSheet from '../components/overlays/InviteSheet'
import SOSButton from '../components/overlays/SOSButton'
import WaypointPicker from '../components/overlays/WaypointPicker'
import MemberDetailCard from '../components/overlays/MemberDetailCard'
import MemberListPanel from '../components/panels/MemberListPanel'
import ChatPanel from '../components/panels/ChatPanel'
import RoutePanel from '../components/panels/RoutePanel'
import TripSummary from '../components/panels/TripSummary'
import LoadingScreen from '../components/ui/LoadingScreen'
import { db, ref, onValue, off, set, update, push, serverTimestamp } from '../firebase'

export default function TripPage() {
  const { tripCode: codeParam } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    myName, memberId, myTransport, myColor, isObserver, isCreator, showInvite,
    setMyPos, setObserver, setShowInvite, setActivePanel, activePanel, clearUnread, unreadMessages, reset,
  } = useTripStore(useShallow(s => ({
    myName:         s.myName,
    memberId:       s.memberId,
    myTransport:    s.myTransport,
    myColor:        s.myColor,
    isObserver:     s.isObserver,
    isCreator:      s.isCreator,
    showInvite:     s.showInvite,
    setMyPos:       s.setMyPos,
    setObserver:    s.setObserver,
    setShowInvite:  s.setShowInvite,
    setActivePanel: s.setActivePanel,
    activePanel:    s.activePanel,
    clearUnread:    s.clearUnread,
    unreadMessages: s.unreadMessages,
    reset:          s.reset,
  })))

  // Redirect on page refresh (store is empty)
  useEffect(() => {
    if (!myName || !memberId) navigate(`/join?code=${codeParam}`, { replace: true })
  }, []) // eslint-disable-line

  const { position, speed, heading, accuracy } = useGeolocation()
  const battery = useBattery()
  useWakeLock()

  useEffect(() => { if (position) setMyPos(position) }, [position, setMyPos])

  // Observer mode is only a fallback for a slow GPS fix on the join screen —
  // the moment a real fix arrives, start sharing instead of staying invisible
  useEffect(() => {
    if (position && isObserver) {
      setObserver(false)
      toast.success('GPS locked — now sharing your location')
    }
  }, [position, isObserver, setObserver])

  const profileData = { name: myName, transport: myTransport, color: myColor }
  const telemetry   = { speed, heading, battery, accuracy }

  const { isConnected, tripMissing, tripEnded } = useTrip(codeParam, memberId, profileData, telemetry)
  const { members, onlineCount } = useMembers(codeParam, memberId)
  const { messages, sendMessage } = useChat(codeParam, memberId)

  const [selectedMember, setSelectedMember] = useState(null)
  const [showSummary,    setShowSummary]    = useState(false)
  const [waypoints,      setWaypoints]      = useState([])
  const [sosAlert,       setSosAlert]       = useState(null)
  const [mySos,          setMySos]          = useState(null)
  const [leaveModal,     setLeaveModal]     = useState(false)
  const mapCenterRef = useRef(null)

  const saveHistory = () => {
    if (!user || user.isAnonymous || !db) return
    const { tripStartTime, tripName } = useTripStore.getState()
    set(ref(db, `users/${user.uid}/trips/${codeParam}`), {
      tripCode:      codeParam,
      tripName:      tripName ?? '',
      joinedAt:      tripStartTime ?? Date.now(),
      exitedAt:      Date.now(),
      memberCount:   members.length + 1,
      waypointCount: waypoints.length,
      messageCount:  messages.length,
    }).catch(() => {})
  }

  // Unknown trip code -> back to the join screen
  useEffect(() => {
    if (tripMissing) {
      toast.error('Trip not found')
      reset()
      navigate('/join', { replace: true })
    }
  }, [tripMissing]) // eslint-disable-line

  // Organizer ended the trip -> everyone gets the summary
  useEffect(() => {
    if (tripEnded && !showSummary) {
      toast('Trip ended by the organizer', { icon: <Flag size={16} color="#14523A" /> })
      saveHistory()
      setShowSummary(true)
    }
  }, [tripEnded]) // eslint-disable-line

  // Subscribe to waypoints
  useEffect(() => {
    if (!db || !codeParam) return
    const wpRef = ref(db, `trips/${codeParam}/waypoints`)
    const unsub = onValue(wpRef, snap => {
      if (!snap.exists()) { setWaypoints([]); return }
      setWaypoints(Object.entries(snap.val()).map(([id, v]) => ({ id, ...v })))
    })
    return () => off(wpRef, 'value', unsub)
  }, [codeParam])

  // Subscribe to SOS — only alerts from the last 10 minutes, so a stale
  // unresolved SOS doesn't re-fire the alarm for everyone who (re)joins
  useEffect(() => {
    if (!db || !codeParam) return
    const sosRef = ref(db, `trips/${codeParam}/sos`)
    const unsub  = onValue(sosRef, snap => {
      if (!snap.exists()) { setSosAlert(null); setMySos(null); return }
      const cutoff  = Date.now() - 10 * 60 * 1000
      const entries = Object.entries(snap.val())
      const active  = entries
        .find(([, v]) => !v.resolved && v.triggeredBy !== memberId && (v.timestamp ?? 0) > cutoff)
      const mine    = entries
        .find(([, v]) => !v.resolved && v.triggeredBy === memberId && (v.timestamp ?? 0) > cutoff)
      setMySos(mine ? { id: mine[0], ...mine[1] } : null)
      if (active) {
        setSosAlert(prev => {
          if (prev?.id !== active[0]) {
            navigator.vibrate?.([300, 100, 300, 100, 300])
            toast.error(`SOS from ${active[1].triggeredByName}!`, { duration: 10000 })
          }
          return { id: active[0], ...active[1] }
        })
      } else {
        setSosAlert(null)
      }
    })
    return () => off(sosRef, 'value', unsub)
  }, [codeParam, memberId])

  // Battery warning — fires once when the level first drops below 20%
  const batteryWarned = useRef(false)
  useEffect(() => {
    if (battery < 20 && !batteryWarned.current) {
      batteryWarned.current = true
      toast(`Battery below 20%`, { icon: <BatteryLow size={16} color="#B0700F" /> })
    }
  }, [battery])

  // New member notifications
  const prevMemberCount = useRef(0)
  useEffect(() => {
    if (members.length > prevMemberCount.current && prevMemberCount.current > 0) {
      const newest = members[members.length - 1]
      toast.success(`${newest?.name} joined the trip`)
      navigator.vibrate?.([50])
    }
    prevMemberCount.current = members.length
  }, [members.length]) // eslint-disable-line

  // Connection banner — silent until the first successful connection,
  // otherwise it cries "connection lost" on every fresh page load
  const wasConnected = useRef(false)
  useEffect(() => {
    if (isConnected) {
      if (wasConnected.current) toast.success('Reconnected', { duration: 2000 })
      wasConnected.current = true
    } else if (wasConnected.current && db) {
      toast('Connection lost — last known positions shown', { icon: <WifiOff size={16} color="#BE4B3B" /> })
    }
  }, [isConnected])

  // Planned route via Google Directions
  const legs = useRoute(waypoints)

  // Route total duration for TopBar chip
  const totalSeconds = legs.reduce((s, l) => s + (l.duration?.value ?? 0), 0)
  const routeDuration = totalSeconds > 0
    ? totalSeconds < 3600
      ? `${Math.floor(totalSeconds / 60)}m`
      : `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`
    : null

  const handleLeave = () => setLeaveModal(true)

  const leaveTrip = () => {
    setLeaveModal(false)
    saveHistory()
    setShowSummary(true)
  }

  const endTripForEveryone = async () => {
    setLeaveModal(false)
    if (db) {
      try {
        await update(ref(db, `trips/${codeParam}/meta`), {
          status:  'ended',
          endedAt: serverTimestamp(),
        })
        await push(ref(db, `trips/${codeParam}/chat`), {
          text:       `${myName} ended the trip`,
          senderName: 'System',
          senderId:   'system',
          timestamp:  serverTimestamp(),
          type:       'system',
        })
      } catch { toast.error('Could not end the trip') }
    }
    // The status listener flips tripEnded and shows the summary for everyone
  }

  const resolveSos = async (sosId, note) => {
    if (!db || !sosId) return
    try {
      await update(ref(db, `trips/${codeParam}/sos/${sosId}`), {
        resolved:   true,
        resolvedBy: memberId,
        resolvedAt: serverTimestamp(),
      })
      await push(ref(db, `trips/${codeParam}/chat`), {
        text:       note,
        senderName: 'System',
        senderId:   'system',
        timestamp:  serverTimestamp(),
        type:       'system',
      })
    } catch { toast.error('Could not resolve the alert') }
  }

  const handleSummaryClose = () => { reset(); navigate('/') }

  const handlePanelChange = panel => {
    setActivePanel(panel === activePanel ? null : panel)
    if (panel === 'chat') clearUnread()
  }

  if (!myName || !memberId) return <LoadingScreen message="Redirecting" />

  const TABS = [
    { id: null,        Icon: MapIcon,       label: 'Map' },
    { id: 'members',   Icon: Users,         label: 'Group' },
    { id: 'chat',      Icon: MessageCircle, label: 'Chat',  badge: unreadMessages },
    { id: 'route',     Icon: RouteIcon,     label: 'Route'  },
    { id: 'waypoints', Icon: MapPin,        label: 'Pin'   },
  ]

  return (
    <div className="fixed inset-0 bg-bgdeep overflow-hidden">
      <ConvoyMap
        members={members}
        waypoints={waypoints}
        onMemberClick={m => { setSelectedMember(m); setActivePanel(null) }}
        onMapLoad={map => {
          mapCenterRef.current = {
            get lat() { return map.getCenter()?.lat() ?? 0 },
            get lng() { return map.getCenter()?.lng() ?? 0 },
          }
        }}
      />

      <TopBar
        onlineCount={onlineCount + (isObserver ? 0 : 1)}
        onLeave={handleLeave}
        onInvite={() => setShowInvite(true)}
        routeDuration={routeDuration}
        onRoutePress={() => handlePanelChange('route')}
      />

      <InviteSheet isOpen={showInvite} onClose={() => setShowInvite(false)} />

      {/* My active SOS banner */}
      {mySos && (
        <div className="fixed top-16 left-0 right-0 z-[95] flex items-center justify-center gap-3 py-2 text-xs font-medium"
          style={{ background: '#FAECE8', color: '#BE4B3B', borderBottom: '1px solid #F0D5CE' }}>
          Your SOS is active
          <button
            onClick={() => resolveSos(mySos.id, `${myName} marked themselves safe`)}
            className="flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: '#1B6B4A' }}
          >
            <ShieldCheck size={11} /> I'm safe
          </button>
        </div>
      )}

      {/* Observer banner */}
      {isObserver && (
        <div className="fixed top-16 left-0 right-0 z-[90] text-center py-2 text-xs font-medium"
          style={{ background: '#FBF3E2', color: '#B0700F', borderBottom: '1px solid #EFDDB8' }}>
          Waiting for GPS — others can't see you yet
        </div>
      )}

      {/* Connection banner */}
      {!isConnected && db && (
        <div className="fixed top-16 left-0 right-0 z-[90] text-center py-2 text-xs font-medium"
          style={{ background: '#FAECE8', color: '#BE4B3B', borderBottom: '1px solid #F0D5CE' }}>
          Reconnecting…
        </div>
      )}

      <SOSButton />

      {/* Bottom action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around px-1"
        style={{
          height:        64,
          background:    '#FFFFFF',
          borderTop:     '1px solid #E5E2D9',
          borderRadius:  '20px 20px 0 0',
          boxShadow:     '0 -8px 30px rgba(31,35,31,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {TABS.map(tab => {
          const active = activePanel === tab.id
          return (
            <button
              key={String(tab.id)}
              onClick={() => handlePanelChange(tab.id)}
              className="flex flex-col items-center gap-1 relative px-3 py-1 min-w-0"
            >
              <tab.Icon size={20} strokeWidth={active ? 2.25 : 1.75} color={active ? '#1B6B4A' : '#9AA292'} />
              <span className="font-medium" style={{ fontSize: 10, color: active ? '#1B6B4A' : '#9AA292' }}>
                {tab.label}
              </span>
              {(tab.badge ?? 0) > 0 && (
                <span
                  className="absolute -top-0.5 right-0.5 font-bold rounded-full text-white flex items-center justify-center"
                  style={{ background: '#BE4B3B', fontSize: 9, minWidth: 15, height: 15, padding: '0 3px' }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Panels */}
      <MemberListPanel members={members} onMemberClick={m => { setSelectedMember(m); setActivePanel(null) }} onClose={() => setActivePanel(null)} />
      <ChatPanel messages={messages} sendMessage={sendMessage} onClose={() => setActivePanel(null)} />
      <RoutePanel waypoints={waypoints} legs={legs} onClose={() => setActivePanel(null)} />
      <WaypointPicker onClose={() => setActivePanel(null)} mapCenterRef={mapCenterRef} />

      {selectedMember && <MemberDetailCard member={selectedMember} onClose={() => setSelectedMember(null)} />}

      {/* SOS overlay */}
      <AnimatePresence>
        {sosAlert && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            style={{ background: 'rgba(31,35,31,0.45)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="rounded-3xl p-8 max-w-sm w-full text-center" style={{ background: '#FFFFFF', border: '2px solid #BE4B3B', boxShadow: '0 20px 48px rgba(31,35,31,0.25)' }}>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#FAECE8' }}>
                  <Siren size={28} color="#BE4B3B" />
                </div>
              </div>
              <h2 className="font-display text-2xl text-danger mb-2">{sosAlert.triggeredByName} needs help</h2>
              <p className="text-sub text-sm mb-6">SOS alert triggered — their location is pinned</p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.open(`https://maps.google.com/maps?daddr=${sosAlert.lat},${sosAlert.lng}`, '_blank')}
                  className="flex-1 py-3 rounded-xl font-semibold text-white text-sm"
                  style={{ background: '#BE4B3B' }}
                >Navigate</button>
                <button
                  onClick={() => setSosAlert(null)}
                  className="flex-1 py-3 rounded-xl font-semibold text-ink text-sm"
                  style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
                >Dismiss</button>
              </div>
              {isCreator && (
                <button
                  onClick={() => resolveSos(sosAlert.id, `${myName} marked the SOS as resolved`)}
                  className="w-full mt-3 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5"
                  style={{ background: '#E7F1EA', border: '1px solid #CBDFD2', color: '#14523A' }}
                >
                  <ShieldCheck size={15} /> Mark resolved for everyone
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave / end trip modal */}
      <AnimatePresence>
        {leaveModal && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-end justify-center p-4"
            style={{ background: 'rgba(31,35,31,0.45)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLeaveModal(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl p-6 space-y-3"
              style={{ background: '#FFFFFF', border: '1px solid #E5E2D9', boxShadow: '0 20px 48px rgba(31,35,31,0.25)' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-display font-semibold text-xl text-ink text-center mb-1">
                {isCreator ? 'End or leave?' : 'Leave trip?'}
              </h3>
              {isCreator && (
                <button
                  onClick={endTripForEveryone}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: '#BE4B3B' }}
                >
                  <Flag size={15} /> End trip for everyone
                </button>
              )}
              <button
                onClick={leaveTrip}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-ink"
                style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
              >
                {isCreator ? 'Leave quietly (trip stays live)' : 'Leave trip'}
              </button>
              <button
                onClick={() => setLeaveModal(false)}
                className="w-full py-3 rounded-xl font-medium text-sm text-sub"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showSummary && (
        <TripSummary
          members={members}
          waypointCount={waypoints.length}
          messageCount={messages.length}
          onClose={handleSummaryClose}
        />
      )}
    </div>
  )
}
