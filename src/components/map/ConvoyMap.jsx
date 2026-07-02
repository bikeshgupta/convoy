import { useRef, useState, useCallback, useEffect } from 'react'
import { GoogleMap, LoadScript, Polyline } from '@react-google-maps/api'
import { Map as MapIcon, Plus, Minus, LocateFixed } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import mapStyle from '../../utils/mapStyle'
import { MAPS_LOADER_ID, MAPS_LIBRARIES } from '../../utils/mapsLoader'
import useTripStore from '../../store/tripStore'
import MyMarker from './MyMarker'
import MemberMarker from './MemberMarker'
import WaypointMarker from './WaypointMarker'

const MAP_OPTIONS = {
  mapTypeId:        'roadmap',
  disableDefaultUI: true,
  gestureHandling:  'greedy',
  minZoom:          5,
  maxZoom:          19,
  clickableIcons:   false,
}

const MAP_STYLES = { width: '100%', height: '100%' }

export default function ConvoyMap({ members, waypoints, onMemberClick, onMapLoad }) {
  const apiKey  = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { myPos, routePath, setMapsLoaded } = useTripStore(useShallow(s => ({
    myPos:         s.myPos,
    routePath:     s.routePath,
    setMapsLoaded: s.setMapsLoaded,
  })))

  const mapRef              = useRef(null)
  const [zoom, setZoom]     = useState(15)
  const [mapsError, setMapsError] = useState(null)
  const initialCentered     = useRef(false)

  const handleLoad = useCallback(map => {
    mapRef.current = map
    onMapLoad?.(map)
    setMapsLoaded(true) // signals useRoute that window.google is ready
  }, [onMapLoad, setMapsLoaded])

  const handleIdle = useCallback(() => {
    if (mapRef.current) setZoom(mapRef.current.getZoom())
  }, [])

  // Center on the first GPS fix only — a controlled `center` prop would
  // re-center on every position tick and fight the user's panning
  useEffect(() => {
    if (myPos && !initialCentered.current && mapRef.current) {
      initialCentered.current = true
      mapRef.current.panTo(myPos)
      mapRef.current.setZoom(16)
    }
  }, [myPos])

  const centerOnMe = () => {
    if (mapRef.current && myPos) { mapRef.current.panTo(myPos); mapRef.current.setZoom(16) }
  }
  const zoomIn  = () => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 15) + 1)
  const zoomOut = () => mapRef.current?.setZoom((mapRef.current.getZoom() ?? 15) - 1)

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-bgdeep flex items-center justify-center">
        <div className="flex flex-col items-center text-center p-8 max-w-sm">
          <MapIcon size={36} color="#9AA292" strokeWidth={1.5} className="mb-4" />
          <p className="font-mono text-textmuted text-sm">
            Add <span className="text-accent">VITE_GOOGLE_MAPS_API_KEY</span> to .env to enable maps
          </p>
        </div>
      </div>
    )
  }

  if (mapsError) {
    return (
      <div className="w-full h-full bg-bgdeep flex items-center justify-center">
        <div className="flex flex-col items-center text-center p-8 max-w-sm">
          <MapIcon size={36} color="#BE4B3B" strokeWidth={1.5} className="mb-4" />
          <p className="font-mono text-danger text-sm mb-2">Map failed to load</p>
          <p className="font-mono text-textmuted text-xs">
            The Google Maps API key may not be authorized for this domain.<br />
            Add <span className="text-accent">{window.location.hostname}</span> to your Google Cloud Console API key restrictions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <LoadScript
      id={MAPS_LOADER_ID}
      googleMapsApiKey={apiKey}
      libraries={MAPS_LIBRARIES}
      loadingElement={<div className="w-full h-full bg-bgdeep" />}
      onError={() => setMapsError(true)}
    >
      <GoogleMap
        mapContainerStyle={MAP_STYLES}
        center={{ lat: 20.5937, lng: 78.9629 }}
        zoom={zoom}
        options={{ ...MAP_OPTIONS, styles: mapStyle }}
        onLoad={handleLoad}
        onIdle={handleIdle}
      >
        {/* Planned route line through stops */}
        {routePath && routePath.length > 1 && (
          <Polyline
            path={routePath}
            options={{
              strokeColor:   '#1B6B4A',
              strokeOpacity: 0.85,
              strokeWeight:  5,
              geodesic:      true,
            }}
          />
        )}

        <MyMarker />

        {members.map(m => (
          <MemberMarker key={m.id} member={m} onClick={onMemberClick} />
        ))}

        {waypoints.map(w => (
          <WaypointMarker key={w.id} waypoint={w} />
        ))}
      </GoogleMap>

      {/* Custom map controls */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-10">
        <MapControlBtn onClick={zoomIn}><Plus size={18} /></MapControlBtn>
        <MapControlBtn onClick={zoomOut}><Minus size={18} /></MapControlBtn>
        <MapControlBtn onClick={centerOnMe} title="Center on me"><LocateFixed size={17} /></MapControlBtn>
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
