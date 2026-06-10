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
        boxShadow:  `0 0 ${Math.round(size / 3)}px ${color}50`,
        border:     '2px solid rgba(255,255,255,0.25)',
        filter:     online ? 'none' : 'grayscale(1) opacity(0.55)',
      }}
    >
      <Icon size={iconSize} color="white" strokeWidth={2} />
    </div>
  )
}
