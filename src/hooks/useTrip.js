import { useEffect, useRef, useState } from 'react'
import { db, ref, set, get, onValue, off, update, onDisconnect, serverTimestamp } from '../firebase'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../store/tripStore'
import { haversineDistance } from '../utils/distance'

export default function useTrip(tripCode, memberId, memberData) {
  const [tripExists,  setTripExists]  = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error,       setError]       = useState(null)

  const setTripStartTime = useTripStore(s => s.setTripStartTime)
  const setIsCreator     = useTripStore(s => s.setIsCreator)

  const lastPushPos  = useRef(null)
  const lastPushTime = useRef(0)

  useEffect(() => {
    if (!db || !tripCode || !memberId || !memberData) return

    const memberRef = ref(db, `trips/${tripCode}/members/${memberId}`)
    const metaRef   = ref(db, `trips/${tripCode}/meta`)
    const connRef   = ref(db, '.info/connected')

    const init = async () => {
      try {
        const metaSnap = await get(metaRef)
        if (!metaSnap.exists()) {
          await set(metaRef, {
            createdAt: serverTimestamp(),
            createdBy: memberId,
            isActive:  true,
          })
          setTripStartTime(Date.now())
          setIsCreator(true)
        } else {
          setTripExists(true)
          setTripStartTime(metaSnap.val().createdAt ?? Date.now())
          setIsCreator(metaSnap.val().createdBy === memberId)
        }

        // update() instead of set(): a GPS fix pushed before init finishes
        // must never be wiped by this write (memberData has no lat/lng)
        const memberSnap = await get(memberRef)
        const payload    = { ...memberData }
        if (!memberSnap.exists()) payload.joinedAt = serverTimestamp()
        await update(memberRef, payload)
        onDisconnect(memberRef).update({ isOnline: false, lastSeen: serverTimestamp() })
      } catch (e) {
        setError(e.message)
      }
    }

    init()

    const connUnsub = onValue(connRef, snap => setIsConnected(!!snap.val()))

    return () => {
      off(connRef, 'value', connUnsub)
      update(memberRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(() => {})
    }
  }, [tripCode, memberId]) // eslint-disable-line

  // Debounced GPS updates: push if 5s elapsed OR moved 10m
  const { myPos, myTransport, myColor, isObserver } = useTripStore(useShallow(s => ({
    myPos:       s.myPos,
    myTransport: s.myTransport,
    myColor:     s.myColor,
    isObserver:  s.isObserver,
  })))

  useEffect(() => {
    if (!db || !tripCode || !memberId || isObserver || !myPos) return

    const now         = Date.now()
    const movedEnough = !lastPushPos.current
      || haversineDistance(lastPushPos.current.lat, lastPushPos.current.lng, myPos.lat, myPos.lng) >= 10
    const timeEnough  = now - lastPushTime.current >= 5000

    if (!movedEnough && !timeEnough) return

    lastPushPos.current  = myPos
    lastPushTime.current = now

    const memberRef = ref(db, `trips/${tripCode}/members/${memberId}`)
    update(memberRef, {
      lat:      myPos.lat,
      lng:      myPos.lng,
      speed:    memberData?.speed    ?? 0,
      heading:  memberData?.heading  ?? 0,
      battery:  memberData?.battery  ?? 100,
      accuracy: memberData?.accuracy ?? 0,
      lastSeen: serverTimestamp(),
      isOnline: true,
    }).catch(e => setError(e.message))
  }, [myPos]) // eslint-disable-line

  // Heartbeat: a stationary member never triggers the myPos effect above
  // (the geolocation hook filters out <3m jitter), so refresh lastSeen and
  // the latest position every 20s to avoid being marked stale/offline
  useEffect(() => {
    if (!db || !tripCode || !memberId) return
    const interval = setInterval(() => {
      const { myPos: pos, isObserver: observer } = useTripStore.getState()
      if (observer) return
      lastPushTime.current = Date.now()
      const memberRef = ref(db, `trips/${tripCode}/members/${memberId}`)
      update(memberRef, {
        ...(pos ? { lat: pos.lat, lng: pos.lng } : {}),
        lastSeen: serverTimestamp(),
        isOnline: true,
      }).catch(() => {})
    }, 20000)
    return () => clearInterval(interval)
  }, [tripCode, memberId])

  return { tripExists, isConnected, error }
}
