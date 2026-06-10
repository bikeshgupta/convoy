export const TRANSPORT_OPTIONS = [
  { id: 'car',      label: 'Car',      emoji: '🚗', icon: 'Car',          color: '#00D4FF' },
  { id: 'bike',     label: 'Moto',     emoji: '🏍️', icon: 'Bike',         color: '#FF6B35' },
  { id: 'cycling',  label: 'Cycling',  emoji: '🚴', icon: 'Activity',     color: '#00FF88' },
  { id: 'walking',  label: 'Walking',  emoji: '🚶', icon: 'Footprints',   color: '#FFD700' },
  { id: 'trekking', label: 'Trekking', emoji: '🥾', icon: 'Mountain',     color: '#C77DFF' },
  { id: 'boat',     label: 'Boat',     emoji: '⛵', icon: 'Anchor',       color: '#2EC4B6' },
]

export function getTransportEmoji(id) {
  return TRANSPORT_OPTIONS.find(t => t.id === id)?.emoji ?? '🚗'
}

export function getTransportLabel(id) {
  return TRANSPORT_OPTIONS.find(t => t.id === id)?.label ?? 'Car'
}

export function getTransportIcon(id) {
  return TRANSPORT_OPTIONS.find(t => t.id === id)?.icon ?? 'Car'
}
