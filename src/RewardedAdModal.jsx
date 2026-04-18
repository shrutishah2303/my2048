import { useEffect, useState } from 'react'

/**
 * RewardedAdModal
 *
 * Simulates a rewarded video ad on web. Shows an AdSense display unit
 * inside a modal with a countdown. After the timer, the reward is granted.
 *
 * For a real video ad experience on web, you can swap the inner <ins> block
 * with a Google Ad Manager video unit or a network like Playwire/Yieldbird.
 *
 * Props:
 *   open        — boolean, show/hide
 *   onRewarded  — called when user earns the reward
 *   onClose     — called if user closes early (no reward)
 *   rewardLabel — string describing what the reward is, e.g. "Undo move"
 */

const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'
const AD_SLOT_REWARDED = 'XXXXXXXXXX'
const WATCH_SECONDS = 15  // seconds user must watch to earn reward

export default function RewardedAdModal({ open, onRewarded, onClose, rewardLabel = 'your reward' }) {
  const [seconds, setSeconds] = useState(WATCH_SECONDS)
  const [earned, setEarned] = useState(false)

  useEffect(() => {
    if (!open) { setSeconds(WATCH_SECONDS); setEarned(false); return }
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(interval)
          setEarned(true)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [open])

  useEffect(() => {
    if (!open) return
    try {
      const adsbygoogle = window.adsbygoogle || []
      adsbygoogle.push({})
    } catch (e) {}
  }, [open])

  if (!open) return null

  return (
    /* Full-screen overlay using normal flow (no position:fixed) */
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      minHeight: '100%',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '24px 20px',
        width: '90%',
        maxWidth: 380,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Advertisement
        </p>

        {/* AdSense unit inside modal */}
        <div style={{ minHeight: 160, background: '#f5f5f5', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ins
            className="adsbygoogle"
            style={{ display: 'block', minWidth: 300, minHeight: 150 }}
            data-ad-client={AD_CLIENT}
            data-ad-slot={AD_SLOT_REWARDED}
            data-ad-format="rectangle"
          />
        </div>

        {earned ? (
          <>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#3b7a3b', marginBottom: 12 }}>
              Thanks for watching!
            </p>
            <button
              onClick={onRewarded}
              style={{
                width: '100%', padding: '12px 0',
                background: '#8f7a66', color: '#fff',
                border: 'none', borderRadius: 8,
                fontSize: 15, fontWeight: 600,
              }}
            >
              Claim — {rewardLabel}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>
              Watch to unlock: <strong>{rewardLabel}</strong>
            </p>
            <div style={{
              width: '100%', background: '#eee', borderRadius: 99, height: 6, marginBottom: 16,
            }}>
              <div style={{
                height: 6, borderRadius: 99, background: '#f59563',
                width: `${((WATCH_SECONDS - seconds) / WATCH_SECONDS) * 100}%`,
                transition: 'width 1s linear',
              }} />
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none',
                color: '#aaa', fontSize: 13, cursor: 'pointer',
              }}
            >
              Skip (no reward) — {seconds}s remaining
            </button>
          </>
        )}
      </div>
    </div>
  )
}
