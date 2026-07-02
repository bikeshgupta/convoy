export const TRANSPORT_OPTIONS = [
  { id: 'car',      label: 'Car',      emoji: '🚗', icon: 'Car',          color: '#3E7C7B' },
  { id: 'bike',     label: 'Moto',     emoji: '🏍️', icon: 'Bike',         color: '#C05B33' },
  { id: 'cycling',  label: 'Cycling',  emoji: '🚴', icon: 'Activity',     color: '#1B6B4A' },
  { id: 'walking',  label: 'Walking',  emoji: '🚶', icon: 'Footprints',   color: '#B98A2E' },
  { id: 'trekking', label: 'Trekking', emoji: '🥾', icon: 'Mountain',     color: '#8E5A80' },
  { id: 'boat',     label: 'Boat',     emoji: '⛵', icon: 'Anchor',       color: '#4E7D67' },
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
