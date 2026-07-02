import { useEffect, useRef, useState } from 'react'
import { db, ref, get, onValue, off, update, onDisconnect, serverTimestamp } from '../firebase'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../store/tripStore'
import { haversineDistance } from '../utils/distance'

// Joins the trip (profile write) and streams your position to
// trips/{code}/positions/{uid}. Identity and live location are separate
// nodes so security rules can guard positions per sharing mode.
export default function useTrip(tripCode, memberId, profileData, telemetry) {
  const [isConnected, setIsConnected] = useState(false)
  const [tripMissing, setTripMissing] = useState(false)
  const [tripEnded,   setTripEnded]   = useState(false)
  const [error,       setError]       = useState(null)

  const setTripStartTime = useTripStore(s => s.setTripStartTime)
  const setIsCreator     = useTripStore(s => s.setIsCreator)
  const setTripMeta      = useTripStore(s => s.setTripMeta)

  const lastPushPos  = useRef(null)
  const lastPushTime = useRef(0)
  const telemetryRef = useRef(telemetry)
  useEffect(() => { telemetryRef.current = telemetry })

  useEffect(() => {
    if (!db || !tripCode || !memberId || !profileData) return

    const profileRef = ref(db, `trips/${tripCode}/profiles/${memberId}`)
    const metaRef    = ref(db, `trips/${tripCode}/meta`)
    const statusRef  = ref(db, `trips/${tripCode}/meta/status`)
    const connRef    = ref(db, '.info/connected')

    const init = async () => {
      try {
        const metaSnap = await get(metaRef)
        if (!metaSnap.exists()) {
          // Trips are created explicitly on the create screen now —
          // an unknown code means the trip doesn't exist
          setTripMissing(true)
          return
        }
        const meta = metaSnap.val()
        setTripMeta(meta)
        setTripStartTime(meta.createdAt ?? Date.now())
        setIsCreator(meta.createdBy === memberId)
        if (meta.status === 'ended') { setTripEnded(true); return }

        // update() so a position pushed before init finishes is never wiped
        const profileSnap = await get(profileRef)
        const payload = { ...profileData, isOnline: true, lastSeen: serverTimestamp() }
        if (!profileSnap.exists()) payload.joinedAt = serverTimestamp()
        await update(profileRef, payload)
        onDisconnect(profileRef).update({ isOnline: false, lastSeen: serverTimestamp() })
      } catch (e) {
        setError(e.message)
      }
    }

    init()

    const connUnsub   = onValue(connRef, snap => setIsConnected(!!snap.val()))
    const statusUnsub = onValue(statusRef, snap => setTripEnded(snap.val() === 'ended'))

    return () => {
      off(connRef, 'value', connUnsub)
      off(statusRef, 'value', statusUnsub)
      update(profileRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(() => {})
    }
  }, [tripCode, memberId]) // eslint-disable-line

  // Debounced GPS updates: push if 5s elapsed OR moved 10m
  const { myPos, isObserver, isSharing } = useTripStore(useShallow(s => ({
    myPos:      s.myPos,
    isObserver: s.isObserver,
    isSharing:  s.isSharing,
  })))

  useEffect(() => {
    if (!db || !tripCode || !memberId || isObserver || !isSharing || tripEnded || !myPos) return

    const now         = Date.now()
    const movedEnough = !lastPushPos.current
      || haversineDistance(lastPushPos.current.lat, lastPushPos.current.lng, myPos.lat, myPos.lng) >= 10
    const timeEnough  = now - lastPushTime.current >= 5000

    if (!movedEnough && !timeEnough) return

    lastPushPos.current  = myPos
    lastPushTime.current = now

    const t = telemetryRef.current ?? {}
    update(ref(db, `trips/${tripCode}/positions/${memberId}`), {
      lat:      myPos.lat,
      lng:      myPos.lng,
      speed:    t.speed    ?? 0,
      heading:  t.heading  ?? 0,
      battery:  t.battery  ?? 100,
      accuracy: t.accuracy ?? 0,
      lastSeen: serverTimestamp(),
    }).catch(e => setError(e.message))
  }, [myPos, isSharing, tripEnded]) // eslint-disable-line

  // Heartbeat: a stationary member never triggers the myPos effect above
  // (the geolocation hook filters out <3m jitter), so refresh presence and
  // the latest position every 20s to avoid being marked stale/offline
  useEffect(() => {
    if (!db || !tripCode || !memberId || tripEnded) return
    const interval = setInterval(() => {
      const { myPos: pos, isObserver: observer, isSharing: sharing } = useTripStore.getState()
      update(ref(db, `trips/${tripCode}/profiles/${memberId}`), {
        isOnline: true,
        lastSeen: serverTimestamp(),
        sharing:  sharing && !observer,
      }).catch(() => {})
      if (observer || !sharing || !pos) return
      lastPushTime.current = Date.now()
      update(ref(db, `trips/${tripCode}/positions/${memberId}`), {
        lat: pos.lat, lng: pos.lng, lastSeen: serverTimestamp(),
      }).catch(() => {})
    }, 20000)
    return () => clearInterval(interval)
  }, [tripCode, memberId, tripEnded])

  // Reflect ghost-mode toggles to the profile immediately
  useEffect(() => {
    if (!db || !tripCode || !memberId) return
    update(ref(db, `trips/${tripCode}/profiles/${memberId}`), {
      sharing: isSharing && !isObserver,
    }).catch(() => {})
  }, [isSharing, isObserver, tripCode, memberId])

  return { isConnected, tripMissing, tripEnded, error }
}
