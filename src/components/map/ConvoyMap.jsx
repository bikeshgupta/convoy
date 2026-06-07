import { useRef, useState, useCallback } from 'react'
import { GoogleMap, LoadScript } from '@react-google-maps/api'
import mapStyle from '../../utils/mapStyle'
import useTripStore from '../../store/tripStore'
import MyMarker from './MyMarker'
import MemberMarker from './MemberMarker'
import WaypointMarker from './WaypointMarker'
import RoutePolyline from './RoutePolyline'

const MAP_OPTIONS = {
  mapTypeId:          'roadmap',
  disableDefaultUI:   true,
  gestureHandling:    'greedy',
  minZoom:            5,
  maxZoom:            19,
  clickableIcons:     false,
}

const MAP_STYLES = {
  width:  '100%',
  height: '100%',
}

export default function ConvoyMap({ members, waypoints, onMemberClick, onMapLoad }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const myPos  = useTripStore(s => s.myPos)
  const mapRef = useRef(null)
  const [zoom, setZoom] = useState(15)
  const initialCentered = useRef(false)

  const handleLoad = useCallback(map => {
    mapRef.current = map
    onMapLoad?.(map)
  }, [onMapLoad])

  const handleIdle = useCallback(() => {
    if (mapRef.current) setZoom(mapRef.current.getZoom())
  }, [])

  // Center on myPos only on first fix
  const prevMyPos = useRef(null)
  if (myPos && !initialCentered.current) {
    initialCentered.current = true
    prevMyPos.current = myPos
  }

  const centerOnMe = () => {
    if (mapRef.current && myPos) {
      mapRef.current.panTo(myPos)
      mapRef.current.setZoom(16)
    }
  }

  const zoomIn  = () => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 15) + 1)
  const zoomOut = () => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 15) - 1)

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-bgdeep flex items-center justify-center">
        <div className="text-center p-8 max-w-sm">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="font-mono text-textmuted text-sm">
            Add <span className="text-accent">VITE_GOOGLE_MAPS_API_KEY</span> to .env to enable maps
          </p>
          <p className="font-mono text-textmuted text-xs mt-2 opacity-60">
            The rest of the app works without it
          </p>
        </div>
      </div>
    )
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={['places']} loadingElement={<div className="w-full h-full bg-bgdeep" />}>
      <GoogleMap
        mapContainerStyle={MAP_STYLES}
        center={myPos ?? { lat: 20.5937, lng: 78.9629 }}
        zoom={zoom}
        options={{ ...MAP_OPTIONS, styles: mapStyle }}
        onLoad={handleLoad}
        onIdle={handleIdle}
      >
        <MyMarker />
        {members.map(m => (
          <MemberMarker key={m.id} member={m} onClick={onMemberClick} />
        ))}
        {waypoints.map(w => (
          <WaypointMarker key={w.id} waypoint={w} />
        ))}
        {members.map(m => (
          <RoutePolyline key={m.id} from={myPos} to={m} color={m.color} />
        ))}
      </GoogleMap>

      {/* Custom map controls */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-10">
        <MapControlBtn onClick={zoomIn}>＋</MapControlBtn>
        <MapControlBtn onClick={zoomOut}>－</MapControlBtn>
        <MapControlBtn onClick={centerOnMe} title="Center on me">◎</MapControlBtn>
      </div>
    </LoadScript>
  )
}

function MapControlBtn({ onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-10 h-10 rounded-xl font-mono text-lg flex items-center justify-center select-none"
      style={{
        background: 'rgba(255,255,255,0.92)',
        border:     '1px solid rgba(0,0,0,0.12)',
        boxShadow:  '0 2px 8px rgba(0,0,0,0.15)',
        color:      '#0F172A',
      }}
    >
      {children}
    </button>
  )
}
