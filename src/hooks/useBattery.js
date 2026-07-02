import { useEffect, useState } from 'react'

export default function useBattery() {
  const [battery, setBattery] = useState(100)

  useEffect(() => {
    if (!navigator.getBattery) return

    let batteryObj = null
    const onChange = () => { if (batteryObj) setBattery(Math.round(batteryObj.level * 100)) }

    navigator.getBattery().then(b => {
      batteryObj = b
      onChange()
      b.addEventListener('levelchange', onChange)
    }).catch(() => {})

    return () => {
      batteryObj?.removeEventListener('levelchange', onChange)
    }
  }, [])

  return battery
}
