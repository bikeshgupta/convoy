import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../store/tripStore'
import useGeolocation from '../hooks/useGeolocation'
import useTrip from '../hooks/useTrip'
import useMembers from '../hooks/useMembers'
import useChat from '../hooks/useChat'
import useBattery from '../hooks/useBattery'
import ConvoyMap from '../components/map/ConvoyMap'
import TopBar from '../components/overlays/TopBar'
import SOSButton from '../components/overlays/SOSButton'
import WaypointPicker from '../components/overlays/WaypointPicker'
import MemberDetailCard from '../components/overlays/MemberDetailCard'
import MemberListPanel from '../components/panels/MemberListPanel'
import ChatPanel from '../components/panels/ChatPanel'
import TripSummary from '../components/panels/TripSummary'
import LoadingScreen from '../components/ui/LoadingScreen'
import { db, ref, onValue, off, push, serverTimestamp } from '../firebase'
import { getTransportEmoji } from '../utils/transport'

export default function TripPage() {
  const { tripCode: codeParam } = useParams()
  const navigate = useNavigate()

  const {
    myName, memberId, myTransport, myColor, isObserver,
    setMyPos, setActivePanel, activePanel, clearUnread, unreadMessages, reset,
  } = useTripStore(useShallow(s => ({
    myName:          s.myName,
    memberId:        s.memberId,
    myTransport:     s.myTransport,
    myColor:         s.myColor,
    isObserver:      s.isObserver,
    setMyPos:        s.setMyPos,
    setActivePanel:  s.setActivePanel,
    activePanel:     s.activePanel,
    clearUnread:     s.clearUnread,
    unreadMessages:  s.unreadMessages,
    reset:           s.reset,
  })))

  // Redirect if store is empty (page refresh)
  useEffect(() => {
    if (!myName || !memberId) {
      navigate(`/join?code=${codeParam}`, { replace: true })
    }
  }, []) // eslint-disable-line

  const { position, speed, heading, accuracy, permissionDenied } = useGeolocation()
  const battery = useBattery()

  // Sync GPS to store
  useEffect(() => { if (position) setMyPos(position) }, [position, setMyPos])

  const memberData = {
    name:      myName,
    transport: myTransport,
    color:     myColor,
    speed,
    heading,
    battery,
    accuracy,
    isOnline:  true,
  }

  const { isConnected, error: tripError } = useTrip(codeParam, memberId, memberData)
  const { members, onlineCount } = useMembers(codeParam, memberId)
  const { messages, sendMessage } = useChat(codeParam, memberId)

  const [selectedMember, setSelectedMember] = useState(null)
  const [showSummary,    setShowSummary]    = useState(false)
  const [waypoints,      setWaypoints]      = useState([])
  const [sosAlert,       setSosAlert]       = useState(null)
  const mapCenterRef = useRef(null)

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

  // Subscribe to SOS
  useEffect(() => {
    if (!db || !codeParam) return
    const sosRef = ref(db, `trips/${codeParam}/sos`)
    const unsub = onValue(sosRef, snap => {
      if (!snap.exists()) return
      const entries = Object.entries(snap.val())
      const active = entries.find(([, v]) => !v.resolved && v.triggeredBy !== memberId)
      if (active) {
        setSosAlert({ id: active[0], ...active[1] })
        navigator.vibrate?.([300, 100, 300, 100, 300])
        toast.error(`🆘 SOS from ${active[1].triggeredByName}!`, { duration: 10000 })
      }
    })
    return () => off(sosRef, 'value', unsub)
  }, [codeParam, memberId])

  // Battery warning
  useEffect(() => {
    if (battery < 20) toast(`🔋 Your battery is below 20%`, { icon: '⚠️' })
  }, []) // eslint-disable-line

  // New member join notifications
  const prevMemberCount = useRef(0)
  useEffect(() => {
    if (members.length > prevMemberCount.current && prevMemberCount.current > 0) {
      const newest = members[members.length - 1]
      toast.success(`${getTransportEmoji(newest?.transport)} ${newest?.name} joined the trip`)
      navigator.vibrate?.([50])
    }
    prevMemberCount.current = members.length
  }, [members.length]) // eslint-disable-line

  // Connection banner
  useEffect(() => {
    if (!isConnected && db) toast('📡 Connection lost — showing last known positions', { icon: '⚠️' })
    else if (isConnected) toast.success('🔄 Reconnected', { duration: 2000 })
  }, [isConnected])

  const handleLeave = () => {
    if (!window.confirm('Leave trip?')) return
    setShowSummary(true)
  }

  const handleSummaryClose = () => {
    reset()
    navigate('/')
  }

  const handlePanelChange = panel => {
    setActivePanel(panel === activePanel ? null : panel)
    if (panel === 'chat') clearUnread()
  }

  if (!myName || !memberId) return <LoadingScreen message="Redirecting" />

  return (
    <div className="fixed inset-0 bg-bgdeep overflow-hidden">
      {/* Map fills entire screen */}
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

      <TopBar onlineCount={onlineCount + 1} onLeave={handleLeave} />

      {/* Observer banner */}
      {isObserver && (
        <div
          className="fixed top-16 left-0 right-0 z-[90] text-center py-2 font-mono text-xs"
          style={{ background: '#FFB80020', color: '#FFB800', borderBottom: '1px solid #FFB80040' }}
        >
          👁️ Observer mode — others can't see you
        </div>
      )}

      {/* Connection lost banner */}
      {!isConnected && db && (
        <div
          className="fixed top-16 left-0 right-0 z-[90] text-center py-2 font-mono text-xs"
          style={{ background: '#FF4D6D20', color: '#FF4D6D', borderBottom: '1px solid #FF4D6D40' }}
        >
          📡 Reconnecting...
        </div>
      )}

      <SOSButton />

      {/* Bottom action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around px-2"
        style={{
          height:        64,
          background:    '#0D1A2A',
          borderTop:     '1px solid #1A3A5C',
          borderRadius:  '24px 24px 0 0',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {[
          { id: null,        icon: '🗺️', label: 'Map' },
          { id: 'members',   icon: '👥', label: 'Group' },
          { id: 'chat',      icon: '💬', label: 'Chat', badge: unreadMessages },
          { id: 'waypoints', icon: '📍', label: 'Pin' },
        ].map(tab => (
          <button
            key={String(tab.id)}
            onClick={() => handlePanelChange(tab.id)}
            className="flex flex-col items-center gap-0.5 relative px-4 py-1 min-w-0"
          >
            <span className="text-2xl">{tab.icon}</span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: 10, color: activePanel === tab.id ? '#00FF88' : '#4A7A9B' }}
            >
              {tab.label}
            </span>
            {tab.badge > 0 && (
              <span
                className="absolute -top-0.5 right-1 font-mono font-bold rounded-full text-white flex items-center justify-center"
                style={{ background: '#FF4D6D', fontSize: 9, minWidth: 16, height: 16, padding: '0 4px' }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      <MemberListPanel
        members={members}
        onMemberClick={m => { setSelectedMember(m); setActivePanel(null) }}
        onClose={() => setActivePanel(null)}
      />
      <ChatPanel
        messages={messages}
        sendMessage={sendMessage}
        onClose={() => setActivePanel(null)}
      />
      <WaypointPicker onClose={() => setActivePanel(null)} mapCenterRef={mapCenterRef} />

      {/* Selected member detail */}
      {selectedMember && (
        <MemberDetailCard member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}

      {/* SOS alert overlay */}
      <AnimatePresence>
        {sosAlert && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            style={{ background: 'rgba(255,77,109,0.15)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="rounded-3xl p-8 max-w-sm w-full text-center" style={{ background: '#0D1A2A', border: '2px solid #FF4D6D' }}>
              <div className="text-5xl mb-3">🆘</div>
              <h2 className="font-display text-3xl text-danger mb-2">{sosAlert.triggeredByName} needs help!</h2>
              <p className="font-mono text-textmuted text-sm mb-6">SOS alert triggered</p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.open(`https://maps.google.com/maps?daddr=${sosAlert.lat},${sosAlert.lng}`, '_blank')}
                  className="flex-1 py-3 rounded-xl font-mono font-bold text-danger text-sm uppercase"
                  style={{ background: '#FF4D6D22', border: '1px solid #FF4D6D55' }}
                >
                  🗺️ Navigate
                </button>
                <button
                  onClick={() => setSosAlert(null)}
                  className="flex-1 py-3 rounded-xl font-mono font-bold text-textprimary text-sm uppercase"
                  style={{ background: '#112236', border: '1px solid #1A3A5C' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trip summary */}
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
