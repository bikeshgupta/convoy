import { Polyline } from '@react-google-maps/api'

export default function RoutePolyline({ from, to, color }) {
  if (!from || !to?.lat || !to?.lng) return null

  const path = [
    { lat: from.lat, lng: from.lng },
    { lat: to.lat,   lng: to.lng   },
  ]

  return (
    <Polyline
      path={path}
      options={{
        strokeColor:   color ?? '#4A7A9B',
        strokeOpacity: 0.3,
        strokeWeight:  2,
        geodesic:      true,
        icons: [
          {
            icon:   { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
            offset: '0',
            repeat: '16px',
          },
        ],
      }}
    />
  )
}
