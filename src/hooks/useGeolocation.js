import { useState, useEffect, useRef } from 'react'
import { haversineDistance } from '../utils/distance'

export default function useGeolocation() {
  const [position, setPosition]          = useState(null)
  const [speed, setSpeed]                = useState(0)
  const [heading, setHeading]            = useState(0)
  const [accuracy, setAccuracy]          = useState(null)
  const [error, setError]                = useState(null)
  const [loading, setLoading]            = useState(true)
  const [permissionDenied, setPermDenied] = useState(false)

  const prevPosRef  = useRef(null)
  const prevTimeRef = useRef(null)
  const watchIdRef  = useRef(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setLoading(false)
      return
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      coords => {
        setLoading(false)
        setError(null)
        const { latitude: lat, longitude: lng, speed: rawSpeed, heading: rawHeading, accuracy: acc } = coords.coords
        const now = Date.now()

        if (prevPosRef.current) {
          const dist = haversineDistance(prevPosRef.current.lat, prevPosRef.current.lng, lat, lng)
          if (dist < 3) return // ignore noise
        }

        let computedSpeed = rawSpeed != null ? rawSpeed * 3.6 : 0
        let computedHeading = rawHeading ?? 0

        if (prevPosRef.current && prevTimeRef.current) {
          const dt = (now - prevTimeRef.current) / 1000
          const dist = haversineDistance(prevPosRef.current.lat, prevPosRef.current.lng, lat, lng)
          if (rawSpeed == null && dt > 0) computedSpeed = (dist / dt) * 3.6

          if (rawHeading == null && dist > 3) {
            const dLng = lng - prevPosRef.current.lng
            const dLat = lat - prevPosRef.current.lat
            computedHeading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360
          }
        }

        const pos = { lat, lng }
        prevPosRef.current  = pos
        prevTimeRef.current = now

        setPosition(pos)
        setSpeed(Math.round(computedSpeed))
        setHeading(Math.round(computedHeading))
        setAccuracy(Math.round(acc))
      },
      err => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setPermDenied(true)
        }
        setError(err.message)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return { position, speed, heading, accuracy, error, loading, permissionDenied }
}
