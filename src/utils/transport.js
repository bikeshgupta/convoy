export const TRANSPORT_OPTIONS = [
  { id: 'car',      label: 'Car',      emoji: '🚗', color: '#00D4FF' },
  { id: 'bike',     label: 'Bike',     emoji: '🏍️', color: '#FF6B35' },
  { id: 'cycling',  label: 'Cycling',  emoji: '🚴', color: '#00FF88' },
  { id: 'walking',  label: 'Walking',  emoji: '🚶', color: '#FFD700' },
  { id: 'trekking', label: 'Trekking', emoji: '🥾', color: '#C77DFF' },
  { id: 'boat',     label: 'Boat',     emoji: '⛵', color: '#2EC4B6' },
]

export function getTransportEmoji(id) {
  return TRANSPORT_OPTIONS.find(t => t.id === id)?.emoji ?? '🚗'
}

export function getTransportLabel(id) {
  return TRANSPORT_OPTIONS.find(t => t.id === id)?.label ?? 'Car'
}
