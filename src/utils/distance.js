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

// Minimum distance (meters) from `point` to the closest point on a polyline path
export function distanceToPolyline(point, path) {
  if (!path || path.length < 2) return Infinity
  let minDist = Infinity
  for (let i = 0; i < path.length - 1; i++) {
    const d = distanceToSegment(point, path[i], path[i + 1])
    if (d < minDist) minDist = d
  }
  return minDist
}

function distanceToSegment(p, A, B) {
  const AB = { lat: B.lat - A.lat, lng: B.lng - A.lng }
  const AP = { lat: p.lat - A.lat, lng: p.lng - A.lng }
  const ab2 = AB.lat * AB.lat + AB.lng * AB.lng
  if (ab2 === 0) return haversineDistance(p.lat, p.lng, A.lat, A.lng)
  const t = Math.max(0, Math.min(1, (AP.lat * AB.lat + AP.lng * AB.lng) / ab2))
  return haversineDistance(p.lat, p.lng, A.lat + t * AB.lat, A.lng + t * AB.lng)
}
