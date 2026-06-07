import { useEffect, useRef, useState } from 'react'
import { db, ref, set, get, onValue, off, update, onDisconnect, serverTimestamp } from '../firebase'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../store/tripStore'
import { haversineDistance } from '../utils/distance'

export default function useTrip(tripCode, memberId, memberData) {
  const [tripExists,   setTripExists]   = useState(false)
  const [isConnected,  setIsConnected]  = useState(false)
  const [error,        setError]        = useState(null)
  const setTripStartTime = useTripStore(s => s.setTripStartTime)

  const lastPushPos = useRef(null)
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
            createdAt:  serverTimestamp(),
            createdBy:  memberId,
            isActive:   true,
          })
          setTripStartTime(Date.now())
        } else {
          setTripExists(true)
          setTripStartTime(metaSnap.val().createdAt ?? Date.now())
        }

        await set(memberRef, { ...memberData, joinedAt: serverTimestamp() })

        onDisconnect(memberRef).update({ isOnline: false, lastSeen: serverTimestamp() })
      } catch (e) {
        setError(e.message)
      }
    }

    init()

    const connUnsub = onValue(connRef, snap => setIsConnected(!!snap.val()))

    return () => {
      off(connRef, 'value', connUnsub)
      update(memberRef, { isOnline: false, lastSeen: serverTimestamp() })
        .catch(() => {})
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

    const now = Date.now()
    const movedEnough = !lastPushPos.current
      || haversineDistance(lastPushPos.current.lat, lastPushPos.current.lng, myPos.lat, myPos.lng) >= 10
    const timeEnough = now - lastPushTime.current >= 5000

    if (!movedEnough && !timeEnough) return

    lastPushPos.current  = myPos
    lastPushTime.current = now

    const memberRef = ref(db, `trips/${tripCode}/members/${memberId}`)
    update(memberRef, {
      lat:      myPos.lat,
      lng:      myPos.lng,
      speed:    memberData?.speed ?? 0,
      heading:  memberData?.heading ?? 0,
      battery:  memberData?.battery ?? 100,
      accuracy: memberData?.accuracy ?? 0,
      lastSeen: serverTimestamp(),
      isOnline: true,
    }).catch(e => setError(e.message))
  }, [myPos]) // eslint-disable-line

  return { tripExists, isConnected, error }
}
