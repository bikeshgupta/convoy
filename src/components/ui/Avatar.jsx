import {
  Car, Bike, Activity, Footprints, Mountain, Anchor,
} from 'lucide-react'

const ICONS = { car: Car, bike: Bike, cycling: Activity, walking: Footprints, trekking: Mountain, boat: Anchor }

export default function Avatar({ color, transport, size = 40, online = true }) {
  const Icon     = ICONS[transport] ?? Car
  const iconSize = Math.round(size * 0.44)

  return (
    <div
      className="flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        width:      size,
        height:     size,
        background: color,
        boxShadow:  '0 2px 8px rgba(31,35,31,0.15)',
        border:     '2px solid #FFFFFF',
        filter:     online ? 'none' : 'grayscale(1) opacity(0.55)',
      }}
    >
      <Icon size={iconSize} color="white" strokeWidth={2} />
    </div>
  )
}
