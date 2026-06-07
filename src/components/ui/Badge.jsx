export default function Badge({ children, color = '#00FF88', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold font-mono ${className}`}
      style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      {children}
    </span>
  )
}
