import { useEffect, useRef } from 'react'

/**
 * AdBanner
 *
 * Renders a Google AdSense display unit.
 * Replace AD_CLIENT and AD_SLOT with your real values from AdSense dashboard.
 *
 * During development, the ad will show a blank/test state — that's normal.
 * Ads only fill after your site is approved and live on your domain.
 */
const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX'  // <-- your AdSense publisher ID
const AD_SLOT   = 'XXXXXXXXXX'               // <-- your ad unit slot ID

export default function AdBanner({ style = {} }) {
  const ref = useRef(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    pushed.current = true
    try {
      const adsbygoogle = window.adsbygoogle || []
      adsbygoogle.push({})
    } catch (e) {
      console.warn('AdSense push failed (expected in dev):', e.message)
    }
  }, [])

  return (
    <div style={{ textAlign: 'center', margin: '12px 0', minHeight: 90, ...style }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
