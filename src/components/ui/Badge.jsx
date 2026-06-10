export default function Badge({ children, color = '#10B981', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold font-mono tabular-nums ${className}`}
      style={{ background: `${color}1A`, color, border: `1px solid ${color}40` }}
    >
      {children}
    </span>
  )
}
