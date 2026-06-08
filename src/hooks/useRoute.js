import { useEffect, useRef } from 'react'
import useTripStore from '../store/tripStore'

// Builds a Directions route: myPos → rest stops (by addedAt) → destination
// Updates store: routePath, and returns legs with ETA/distance per segment
export default function useRoute(waypoints) {
  const myPos      = useTripStore(s => s.myPos)
  const mapsLoaded = useTripStore(s => s.mapsLoaded)
  const setRoutePath = useTripStore(s => s.setRoutePath)

  const debounceRef  = useRef(null)
  const legsRef      = useRef([])
  const forceUpdate  = useTripStore(s => s.setRoutePath) // just to access stable setter

  useEffect(() => {
    if (!myPos || !mapsLoaded) return

    const destination = waypoints
      .filter(w => w.type === 'destination')
      .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))[0]

    if (!destination) {
      setRoutePath(null)
      legsRef.current = []
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
            legsRef.current = []
            return
          }
          const route = result.routes[0]
          // Convert LatLng objects to plain {lat, lng}
          const path = route.overview_path.map(ll => ({ lat: ll.lat(), lng: ll.lng() }))
          setRoutePath(path)
          legsRef.current = route.legs
        }
      )
    }, 1500)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [
    myPos?.lat,
    myPos?.lng,
    mapsLoaded,
    // Re-run when route-relevant waypoints change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(
      waypoints
        .filter(w => w.type === 'rest' || w.type === 'destination')
        .map(w => ({ lat: w.lat, lng: w.lng, type: w.type, addedAt: w.addedAt }))
    ),
  ])

  return legsRef
}
