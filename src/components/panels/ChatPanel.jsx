import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from '../ui/BottomSheet'
import useTripStore from '../../store/tripStore'
import { format, isSameDay } from 'date-fns'

export default function ChatPanel({ messages, sendMessage, onClose }) {
  const [text, setText] = useState('')
  const { myName, memberId, myColor, activePanel } = useTripStore(s => ({
    myName:      s.myName,
    memberId:    s.memberId,
    myColor:     s.myColor,
    activePanel: s.activePanel,
  }))
  const bottomRef = useRef(null)

  useEffect(() => {
    if (activePanel === 'chat') {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [activePanel, messages.length])

  const handleSend = () => {
    if (!text.trim()) return
    sendMessage(text.trim())
    setText('')
  }

  const handleKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  // Group messages with date separators
  const grouped = []
  let lastDate = null
  for (const msg of messages) {
    const d = msg.timestamp ? new Date(msg.timestamp) : new Date()
    if (!lastDate || !isSameDay(lastDate, d)) {
      grouped.push({ type: 'separator', date: d, id: `sep-${msg.id}` })
      lastDate = d
    }
    grouped.push(msg)
  }

  return (
    <BottomSheet
      isOpen={activePanel === 'chat'}
      onClose={onClose}
      title="CONVOY CHAT"
      height="full"
    >
      <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 min-h-0">
          {grouped.map(item => {
            if (item.type === 'separator') {
              return (
                <div key={item.id} className="text-center py-2">
                  <span className="font-mono text-textmuted text-xs px-3 py-1 rounded-full" style={{ background: '#112236' }}>
                    {format(item.date, 'MMM d, yyyy')}
                  </span>
                </div>
              )
            }

            if (item.type === 'system') {
              return (
                <div key={item.id} className="text-center py-1">
                  <span className="font-body text-textmuted text-xs italic">{item.text}</span>
                </div>
              )
            }

            if (item.type === 'sos') {
              return (
                <div key={item.id} className="w-full rounded-xl p-3 my-1" style={{ background: '#FF4D6D22', border: '1px solid #FF4D6D55' }}>
                  <span className="font-mono font-bold text-danger text-sm">{item.text}</span>
                </div>
              )
            }

            const isMe = item.senderId === memberId
            return (
              <div key={item.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-0.5`}>
                {!isMe && (
                  <span className="font-mono text-xs px-1" style={{ color: '#00D4FF', fontSize: 10 }}>
                    {item.senderName}
                  </span>
                )}
                <div
                  className="rounded-2xl px-3 py-2 max-w-[80%] break-words"
                  style={{
                    background:  isMe ? '#00FF8818' : '#112236',
                    border:      isMe ? '1px solid #00FF8840' : '1px solid #1A3A5C',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  }}
                >
                  <p className="font-body text-textprimary text-sm leading-snug m-0">{item.text}</p>
                </div>
                <span className="font-mono text-textmuted px-1" style={{ fontSize: 9 }}>
                  {item.timestamp ? format(new Date(item.timestamp), 'h:mm a') : ''}
                </span>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid #1A3A5C' }}
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value.slice(0, 200))}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              className="w-full font-body text-sm text-textprimary rounded-xl px-4 py-2.5 outline-none"
              style={{ background: '#112236', border: '1px solid #1A3A5C', fontSize: 14 }}
            />
            {text.length > 150 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-textmuted">
                {200 - text.length}
              </span>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
            style={{ background: '#00FF88' }}
          >
            <span className="text-black text-lg">→</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
