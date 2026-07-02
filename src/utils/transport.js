export const TRANSPORT_OPTIONS = [
  { id: 'car',      label: 'Car',      icon: 'Car',        color: '#3E7C7B' },
  { id: 'bike',     label: 'Moto',     icon: 'Bike',       color: '#C05B33' },
  { id: 'cycling',  label: 'Cycling',  icon: 'Activity',   color: '#1B6B4A' },
  { id: 'walking',  label: 'Walking',  icon: 'Footprints', color: '#B98A2E' },
  { id: 'trekking', label: 'Trekking', icon: 'Mountain',   color: '#8E5A80' },
  { id: 'boat',     label: 'Boat',     icon: 'Anchor',     color: '#4E7D67' },
]

export function getTransportLabel(id) {
  return TRANSPORT_OPTIONS.find(t => t.id === id)?.label ?? 'Car'
}

export function getTransportIcon(id) {
  return TRANSPORT_OPTIONS.find(t => t.id === id)?.icon ?? 'Car'
}
