import { useEffect, useState } from 'react'
import { MessageCircle, Copy, Share2, Check } from 'lucide-react'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { useShallow } from 'zustand/shallow'
import BottomSheet from '../ui/BottomSheet'
import useTripStore from '../../store/tripStore'

const MODE_PREVIEW = {
  hub:       'Joiners see: you, the route and stops. You see everyone. They can pause sharing anytime.',
  proximity: 'Joiners see riders within 5 km plus you. You see everyone. They can pause sharing anytime.',
  everyone:  'Everyone in the trip sees everyone. Members can pause sharing anytime.',
}

export default function InviteSheet({ isOpen, onClose }) {
  const { tripCode, tripName, tripMode } = useTripStore(useShallow(s => ({
    tripCode: s.tripCode,
    tripName: s.tripName,
    tripMode: s.tripMode,
  })))

  const [qrUrl,  setQrUrl]  = useState(null)
  const [copied, setCopied] = useState(false)

  const inviteUrl  = `${window.location.origin}/join?code=${tripCode}`
  const inviteText = `Join my Convoy trip${tripName ? ` "${tripName}"` : ''}! Code: ${tripCode}\n${inviteUrl}`

  useEffect(() => {
    if (!isOpen || !tripCode) return
    QRCode.toDataURL(inviteUrl, {
      width:  360,
      margin: 1,
      color:  { dark: '#1F231F', light: '#FFFFFF' },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null))
  }, [isOpen, tripCode, inviteUrl])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — long-press the link instead')
    }
  }

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank')
  }

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join Convoy Trip', text: inviteText, url: inviteUrl })
      } else {
        await copyLink()
      }
    } catch { /* user cancelled */ }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="INVITE YOUR CONVOY" height="auto">
      <div className="p-5 pb-6 space-y-4 text-center">
        {tripName && <div className="font-display font-semibold text-lg text-ink">{tripName}</div>}

        <div
          className="font-bold"
          style={{ fontFamily: '"Space Mono", monospace', fontSize: 26, letterSpacing: '0.15em', color: '#1B6B4A' }}
        >
          {tripCode}
        </div>

        {qrUrl && (
          <div className="flex justify-center">
            <img
              src={qrUrl}
              alt={`QR code to join trip ${tripCode}`}
              className="rounded-xl"
              style={{ width: 168, height: 168, border: '1px solid #E5E2D9' }}
            />
          </div>
        )}
        <p className="text-mute" style={{ fontSize: 10 }}>Scan to join · works in any phone browser</p>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={shareWhatsApp}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-ink"
            style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
          >
            <MessageCircle size={17} color="#1B6B4A" />
            WhatsApp
          </button>
          <button
            onClick={copyLink}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-ink"
            style={{ background: '#F4F2EC', border: '1px solid #E5E2D9' }}
          >
            {copied ? <Check size={17} color="#1B6B4A" /> : <Copy size={17} color="#67705F" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            onClick={shareNative}
            className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold text-white"
            style={{ background: '#1B6B4A' }}
          >
            <Share2 size={17} />
            Share
          </button>
        </div>

        <div
          className="text-left rounded-xl px-3.5 py-3"
          style={{ background: '#E7F1EA', border: '1px solid #CBDFD2' }}
        >
          <div className="text-[11px] font-bold" style={{ color: '#14523A' }}>What joiners will see</div>
          <p className="text-[11px] mt-1 leading-relaxed text-sub">
            {MODE_PREVIEW[tripMode] ?? MODE_PREVIEW.everyone}
          </p>
        </div>
      </div>
    </BottomSheet>
  )
}
