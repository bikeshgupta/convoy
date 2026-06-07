import { getTransportEmoji } from '../../utils/transport'

export default function Avatar({ color, transport, size = 40, online = true }) {
  return (
    <div
      className="flex items-center justify-center rounded-full border-2 border-white/70 flex-shrink-0"
      style={{
        width:      size,
        height:     size,
        background: color,
        boxShadow:  `0 0 ${size / 3}px ${color}60`,
        filter:     online ? 'none' : 'grayscale(100%) opacity(60%)',
        fontSize:   size * 0.45,
      }}
    >
      {getTransportEmoji(transport)}
    </div>
  )
}
