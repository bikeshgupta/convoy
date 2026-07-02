import { useEffect, useState, useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { db, ref, onValue, off } from '../firebase'
import useTripStore from '../store/tripStore'
import { haversineDistance } from '../utils/distance'

const PROXIMITY_RADIUS_M = 5000
const STALE_MS           = 45000

// Merges trips/{code}/profiles (identity, readable by all members) with
// trips/{code}/positions (live location, rule-guarded per sharing mode).
// In hub mode a non-organizer only subscribes to the organizer's position —
// the security rules deny everything else anyway.
export default function useMembers(tripCode, myMemberId) {
  const [profiles,  setProfiles]  = useState({})
  const [positions, setPositions] = useState({})
  const [now,       setNow]       = useState(0)

  const { myPos, tripMode, organizerId } = useTripStore(useShallow(s => ({
    myPos:       s.myPos,
    tripMode:    s.tripMode,
    organizerId: s.organizerId,
  })))

  const isOrganizer = myMemberId === organizerId
  const hubMember   = tripMode === 'hub' && !isOrganizer && !!organizerId

  // Ticking clock so staleness/"last seen" recompute without impure renders
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!db || !tripCode) return
    const profilesRef = ref(db, `trips/${tripCode}/profiles`)
    const unsub = onValue(profilesRef,
      snap => setProfiles(snap.exists() ? snap.val() : {}),
      () => setProfiles({}))
    return () => off(profilesRef, 'value', unsub)
  }, [tripCode])

  useEffect(() => {
    if (!db || !tripCode) return
    // Hub members may only read the organizer's position node
    const path = hubMember
      ? `trips/${tripCode}/positions/${organizerId}`
      : `trips/${tripCode}/positions`
    const posRef = ref(db, path)
    const unsub = onValue(posRef,
      snap => {
        if (!snap.exists()) { setPositions({}); return }
        setPositions(hubMember ? { [organizerId]: snap.val() } : snap.val())
      },
      () => setPositions({}))
    return () => off(posRef, 'value', unsub)
  }, [tripCode, hubMember, organizerId])

  const members = useMemo(() => {
    let list = Object.entries(profiles)
      .filter(([id]) => id !== myMemberId)
      .map(([id, profile]) => {
        const pos        = positions[id] ?? {}
        const lastSeenMs = Math.max(profile.lastSeen ?? 0, pos.lastSeen ?? 0)
        const stale      = now > 0 && now - lastSeenMs > STALE_MS
        const hasPos     = pos.lat != null && pos.lng != null
        return {
          id,
          ...profile,
          lat:      hasPos ? pos.lat : null,
          lng:      hasPos ? pos.lng : null,
          speed:    pos.speed    ?? 0,
          heading:  pos.heading  ?? 0,
          battery:  pos.battery  ?? null,
          accuracy: pos.accuracy ?? 0,
          lastSeen: lastSeenMs || null,
          agoText:  lastSeenMs && now > 0 ? `${Math.max(1, Math.round((now - lastSeenMs) / 60000))}m ago` : null,
          isOnline: !!profile.isOnline && !stale,
          role:     id === organizerId ? 'organizer' : 'member',
          distance: myPos && hasPos
            ? haversineDistance(myPos.lat, myPos.lng, pos.lat, pos.lng)
            : Infinity,
        }
      })

    // Proximity mode: non-organizers see the organizer plus members within range
    if (tripMode === 'proximity' && !isOrganizer) {
      list = list.filter(m =>
        m.role === 'organizer' || m.distance <= PROXIMITY_RADIUS_M)
    }

    list.sort((a, b) => {
      if (a.role !== b.role) return a.role === 'organizer' ? -1 : 1
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
      return a.distance - b.distance
    })
    return list
  }, [profiles, positions, myPos, myMemberId, organizerId, tripMode, isOrganizer, now])

  const onlineCount = useMemo(() => members.filter(m => m.isOnline).length, [members])

  return { members, onlineCount, totalCount: members.length }
}
