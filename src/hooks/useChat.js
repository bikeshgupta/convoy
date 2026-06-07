import { useEffect, useState, useRef, useCallback } from 'react'
import { db, ref, onValue, off, push, serverTimestamp } from '../firebase'
import { useShallow } from 'zustand/shallow'
import useTripStore from '../store/tripStore'

export default function useChat(tripCode, myMemberId) {
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)

  const { myName, activePanel, incrementUnread, clearUnread } = useTripStore(useShallow(s => ({
    myName:          s.myName,
    activePanel:     s.activePanel,
    incrementUnread: s.incrementUnread,
    clearUnread:     s.clearUnread,
  })))

  const activePanelRef = useRef(activePanel)
  useEffect(() => { activePanelRef.current = activePanel }, [activePanel])

  useEffect(() => {
    if (!db || !tripCode) return

    const chatRef = ref(db, `trips/${tripCode}/chat`)

    const unsub = onValue(chatRef, snap => {
      setLoading(false)
      if (!snap.exists()) { setMessages([]); return }

      const all = Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }))
      all.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
      const last50 = all.slice(-50)

      setMessages(prev => {
        const newCount = last50.length - prev.length
        if (newCount > 0 && activePanelRef.current !== 'chat') {
          for (let i = 0; i < newCount; i++) incrementUnread()
        }
        return last50
      })
    })

    return () => off(chatRef, 'value', unsub)
  }, [tripCode]) // eslint-disable-line

  const sendMessage = useCallback((text, type = 'text') => {
    if (!db || !tripCode || !text.trim()) return
    const chatRef = ref(db, `trips/${tripCode}/chat`)
    push(chatRef, {
      text:       text.trim(),
      senderName: myName,
      senderId:   myMemberId,
      timestamp:  serverTimestamp(),
      type,
    })
  }, [tripCode, myMemberId, myName])

  return { messages, sendMessage, loading }
}
