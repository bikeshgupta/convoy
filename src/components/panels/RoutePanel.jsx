import { motion } from 'framer-motion'
import BottomSheet from '../ui/BottomSheet'
import useTripStore from '../../store/tripStore'

export default function RoutePanel({ waypoints, legsRef, onClose }) {
  const activePanel = useTripStore(s => s.activePanel)

  const destination = waypoints
    .filter(w => w.type === 'destination')
    .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))[0]

  const restStops = waypoints
    .filter(w => w.type === 'rest')
    .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0))

  const legs = legsRef.current ?? []

  const totalDuration = legs.reduce((s, l) => s + (l.duration?.value ?? 0), 0)
  const totalDistance = legs.reduce((s, l) => s + (l.distance?.value ?? 0), 0)

  const stops = [
    { emoji: '📍', label: 'Your location', isOrigin: true },
    ...restStops.map(w => ({ emoji: w.emoji ?? '☕', label: w.label || 'Rest Stop', type: 'rest' })),
    destination
      ? { emoji: destination.emoji ?? '🏁', label: destination.label || 'Destination', type: 'destination' }
      : null,
  ].filter(Boolean)

  return (
    <BottomSheet isOpen={activePanel === 'route'} onClose={onClose} title="TRIP ROUTE" height="auto">
      <div className="p-5 space-y-4">
        {!destination ? (
          <div className="text-center py-6 space-y-2">
            <div className="text-4xl">🧭</div>
            <p className="font-mono text-textmuted text-sm">No destination set</p>
            <p className="font-mono text-textmuted text-xs opacity-60">
              Add a 🏁 Destination waypoint to see the planned route
            </p>
          </div>
        ) : (
          <>
            {/* Total summary */}
            {legs.length > 0 && (
              <div
                className="flex justify-around rounded-2xl py-3"
                style={{ background: '#E7F1EA', border: '1px solid #CBDFD2' }}
              >
                <div className="text-center">
                  <div className="font-mono font-bold text-primary text-lg">
                    {formatDuration(totalDuration)}
                  </div>
                  <div className="font-mono text-textmuted" style={{ fontSize: 10 }}>TOTAL TIME</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-primary text-lg">
                    {formatDistance(totalDistance)}
                  </div>
                  <div className="font-mono text-textmuted" style={{ fontSize: 10 }}>TOTAL DIST</div>
                </div>
              </div>
            )}

            {/* Stop sequence */}
            <div className="space-y-0">
              {stops.map((stop, i) => {
                const leg = legs[i] // leg i goes FROM stop i TO stop i+1
                return (
                  <div key={i}>
                    <motion.div
                      className="flex items-center gap-3 py-2"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                        style={{
                          background: stop.type === 'destination'
                            ? '#E7F1EA'
                            : stop.type === 'rest'
                              ? '#FBF3E2'
                              : '#E7F1EA',
                          border: stop.type === 'destination'
                            ? '1.5px solid #14523A'
                            : stop.type === 'rest'
                              ? '1.5px solid #B98A2E'
                              : '1.5px solid #1B6B4A',
                        }}
                      >
                        {stop.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-textprimary text-sm truncate">{stop.label}</div>
                        {stop.type === 'destination' && (
                          <div className="font-semibold text-xs" style={{ color: '#14523A' }}>Final destination</div>
                        )}
                        {stop.isOrigin && (
                          <div className="font-mono text-xs text-textmuted">Starting point</div>
                        )}
                      </div>
                    </motion.div>

                    {/* Leg info connector */}
                    {leg && i < stops.length - 1 && (
                      <div className="flex items-center gap-3 pl-4 py-1">
                        <div className="flex flex-col items-center gap-0.5">
                          <div style={{ width: 2, height: 6, background: '#E5E2D9' }} />
                          <div style={{ width: 2, height: 6, background: '#E5E2D9' }} />
                          <div style={{ width: 2, height: 6, background: '#E5E2D9' }} />
                        </div>
                        <div
                          className="flex items-center gap-3 rounded-lg px-3 py-1.5"
                          style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
                        >
                          <span className="font-mono text-textmuted text-xs">
                            ⏱ {leg.duration?.text ?? '—'}
                          </span>
                          <span className="font-mono text-textmuted text-xs">
                            📏 {leg.distance?.text ?? '—'}
                          </span>
                        </div>
                      </div>
                    )}
                    {!leg && i < stops.length - 1 && (
                      <div className="pl-[18px] py-1">
                        <div style={{ width: 2, height: 20, background: '#E5E2D9' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {legs.length === 0 && (
              <p className="font-mono text-textmuted text-xs text-center animate-pulse">
                Calculating route…
              </p>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  )
}

function formatDuration(seconds) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}

function formatDistance(meters) {
  if (!meters) return '—'
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)} km`
}
