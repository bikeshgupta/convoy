import { useEffect, useRef, useState } from 'react'
import useTripStore from '../store/tripStore'

// Builds a Directions route: myPos → rest stops (by addedAt) → destination
// Updates store: routePath; returns legs (state, safe to render) with
// ETA/distance per segment
export default function useRoute(waypoints) {
  const myPos        = useTripStore(s => s.myPos)
  const mapsLoaded   = useTripStore(s => s.mapsLoaded)
  const setRoutePath = useTripStore(s => s.setRoutePath)

  const debounceRef  = useRef(null)
  const [legs, setLegs] = useState([])

  const routeKey = JSON.stringify(
    waypoints
      .filter(w => w.type === 'rest' || w.type === 'destination')
      .map(w => ({ lat: w.lat, lng: w.lng, type: w.type, addedAt: w.addedAt }))
  )

  useEffect(() => {
    if (!myPos || !mapsLoaded) return

    const destination = waypoints
      .filter(w => w.type === 'destination')
      .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))[0]

    if (!destination) {
      setRoutePath(null)
      setLegs([])
      return
    }

    const restStops = waypoints
      .filter(w => w.type === 'rest')
      .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0))

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!window.google?.maps?.DirectionsService) return

      const service = new window.google.maps.DirectionsService()
      service.route(
        {
          origin:      { lat: myPos.lat, lng: myPos.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          waypoints:   restStops.map(w => ({
            location: { lat: w.lat, lng: w.lng },
            stopover: true,
          })),
          travelMode:        window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (status !== 'OK' || !result.routes[0]) {
            setRoutePath(null)
            setLegs([])
            return
          }
          const route = result.routes[0]
          setRoutePath(route.overview_path.map(ll => ({ lat: ll.lat(), lng: ll.lng() })))
          setLegs(route.legs)
        }
      )
    }, 1500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [myPos?.lat, myPos?.lng, mapsLoaded, routeKey]) // eslint-disable-line

  return legs
}
