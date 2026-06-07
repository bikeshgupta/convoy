import { formatDistanceToNow } from 'date-fns'

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'unknown'
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return 'unknown'
  }
}

export function formatDuration(ms) {
  if (!ms || ms < 0) return '0m'
  const totalSecs = Math.floor(ms / 1000)
  const hrs  = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  if (hrs === 0) return `${mins}m`
  return `${hrs}h ${mins}m`
}
