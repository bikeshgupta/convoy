import { useEffect, useState } from 'react'
import { db, ref, onValue } from '../firebase'
import useTripStore from '../store/tripStore'
import { haversineDistance } from '../utils/distance'

export default function useMembers(tripCode, myMemberId) {
  const [members,     setMembers]     = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [totalCount,  setTotalCount]  = useState(0)

  const myPos = useTripStore(s => s.myPos)

  useEffect(() => {
    if (!db || !tripCode) return

    const membersRef = ref(db, `trips/${tripCode}/members`)

    const unsub = onValue(membersRef, snap => {
      if (!snap.exists()) {
        setMembers([])
        setOnlineCount(0)
        setTotalCount(0)
        return
      }

      const now = Date.now()
      const raw = snap.val()

      const list = Object.entries(raw)
        .filter(([id]) => id !== myMemberId)
        .map(([id, data]) => {
          const lastSeenMs = data.lastSeen ?? 0
          const stale = now - lastSeenMs > 30000
          return {
            id,
            ...data,
            isOnline: data.isOnline && !stale,
            distance: myPos
              ? haversineDistance(myPos.lat, myPos.lng, data.lat ?? 0, data.lng ?? 0)
              : Infinity,
          }
        })

      list.sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
        return a.distance - b.distance
      })

      setMembers(list)
      setOnlineCount(list.filter(m => m.isOnline).length)
      setTotalCount(list.length)
    })

    return () => unsub()
  }, [tripCode, myMemberId, myPos])

  return { members, onlineCount, totalCount }
}
