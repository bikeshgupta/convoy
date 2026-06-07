const R = 6371000 // Earth radius in meters

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function getBearing(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180
  const dLng = toRad(lng2 - lng1)
  const y = Math.sin(dLng) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export function bearingToLabel(degrees) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW']
  return dirs[Math.round(degrees / 45) % 8]
}

export function getDistanceStatus(meters) {
  if (meters < 300)  return 'nearby'
  if (meters < 1000) return 'close'
  if (meters < 5000) return 'far'
  return 'critical'
}
