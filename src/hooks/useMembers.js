import { useEffect, useState, useMemo } from 'react'
import { db, ref, onValue, off } from '../firebase'
import useTripStore from '../store/tripStore'
import { haversineDistance } from '../utils/distance'

export default function useMembers(tripCode, myMemberId) {
  const [rawMembers, setRawMembers] = useState([])
  const myPos = useTripStore(s => s.myPos)

  // Subscribe once per trip — distance math happens outside the listener so
  // a GPS tick doesn't tear down and recreate the Firebase subscription
  useEffect(() => {
    if (!db || !tripCode) return

    const membersRef = ref(db, `trips/${tripCode}/members`)

    const unsub = onValue(membersRef, snap => {
      if (!snap.exists()) { setRawMembers([]); return }
      const now = Date.now()
      setRawMembers(
        Object.entries(snap.val())
          .filter(([id]) => id !== myMemberId)
          .map(([id, data]) => {
            const lastSeenMs = data.lastSeen ?? 0
            const stale = now - lastSeenMs > 30000
            return { id, ...data, isOnline: data.isOnline && !stale }
          })
      )
    })

    return () => off(membersRef, 'value', unsub)
  }, [tripCode, myMemberId])

  const members = useMemo(() => {
    const list = rawMembers.map(m => ({
      ...m,
      distance: myPos && m.lat != null
        ? haversineDistance(myPos.lat, myPos.lng, m.lat, m.lng)
        : Infinity,
    }))
    list.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
      return a.distance - b.distance
    })
    return list
  }, [rawMembers, myPos])

  const onlineCount = useMemo(() => members.filter(m => m.isOnline).length, [members])

  return { members, onlineCount, totalCount: members.length }
}
