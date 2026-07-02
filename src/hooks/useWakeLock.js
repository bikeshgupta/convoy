import { useEffect } from 'react'

// Keeps the screen awake during a trip so mobile browsers don't suspend
// JS timers and geolocation. Re-acquires the lock when the tab becomes
// visible again (the browser releases it on tab switch / screen off).
export default function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    let lock = null
    let released = false

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
      } catch {
        // Denied (e.g. low battery mode) — nothing we can do
      }
    }

    const onVisible = () => {
      if (!released && document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [])
}
