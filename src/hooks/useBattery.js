import { useEffect, useState } from 'react'

export default function useBattery() {
  const [battery, setBattery] = useState(100)

  useEffect(() => {
    if (!navigator.getBattery) return

    let batteryObj = null

    const update = b => setBattery(Math.round(b.level * 100))

    navigator.getBattery().then(b => {
      batteryObj = b
      update(b)
      b.addEventListener('levelchange', () => update(b))
    }).catch(() => {})

    return () => {
      if (batteryObj) batteryObj.removeEventListener('levelchange', () => {})
    }
  }, [])

  return battery
}
