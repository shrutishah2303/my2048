# My 2048 — Web Puzzle Game with AdSense

A fully playable 2048 game built with React + Vite, ready to deploy to Vercel
and monetize with Google AdSense.

---

## Quick start

```bash
npm install
npm run dev        # runs at http://localhost:5173
```

## Build & deploy

```bash
npm run build      # outputs to /dist
npx vercel         # deploy to Vercel (free)
```

Or drag the `/dist` folder to https://app.netlify.com/drop

---

## AdSense setup (do this after your site is live)

1. Sign up at https://adsense.google.com
2. Add your site URL and wait for approval (1–3 days)
3. Once approved, get your Publisher ID (ca-pub-XXXXXXXX) and Ad Slot IDs

Then replace the placeholders in these files:

| File | What to replace |
|---|---|
| `index.html` | `ca-pub-XXXXXXXXXXXXXXXX` in the script tag |
| `src/AdBanner.jsx` | `AD_CLIENT` and `AD_SLOT` |
| `src/RewardedAdModal.jsx` | `AD_CLIENT` and `AD_SLOT_REWARDED` |

---

## Ad placements

| Location | Type | Triggers |
|---|---|---|
| Top of page | Banner (AdSense) | Always visible |
| Bottom of page | Banner (AdSense) | Always visible |
| Undo (after 1 free) | Rewarded modal | User opts in |
| Keep playing past 2048 | Rewarded modal | User opts in |
| New game after game over | Rewarded modal | Between games |

---

## Capacitor (optional — iOS/Android)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "My 2048" com.yourname.my2048 --web-dir dist
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # opens Android Studio
```

Replace AdSense with @capacitor-community/admob for native mobile ads.

---

## Project structure

```
my-2048/
  index.html              ← AdSense script tag lives here
  src/
    main.jsx              ← React entry point
    App.jsx               ← Game + ad integration
    AdBanner.jsx          ← Reusable AdSense banner component
    RewardedAdModal.jsx   ← Rewarded ad modal with countdown
    index.css             ← Global styles
  vercel.json             ← Vercel deploy config
  vite.config.js
  package.json
```
