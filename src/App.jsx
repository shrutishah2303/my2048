import { useState, useEffect, useRef, useCallback } from 'react'
import AdBanner from './AdBanner'
import RewardedAdModal from './RewardedAdModal'

/* ── Tile colours ─────────────────────────────────────────────────── */
const TILE_STYLE = {
  2:    { bg: '#eee4da', color: '#776e65' },
  4:    { bg: '#ede0c8', color: '#776e65' },
  8:    { bg: '#f2b179', color: '#f9f6f2' },
  16:   { bg: '#f59563', color: '#f9f6f2' },
  32:   { bg: '#f67c5f', color: '#f9f6f2' },
  64:   { bg: '#f65e3b', color: '#f9f6f2' },
  128:  { bg: '#edcf72', color: '#f9f6f2' },
  256:  { bg: '#edcc61', color: '#f9f6f2' },
  512:  { bg: '#edc850', color: '#f9f6f2' },
  1024: { bg: '#edc53f', color: '#f9f6f2' },
  2048: { bg: '#edc22e', color: '#f9f6f2' },
}
const DEFAULT_TILE = { bg: '#3c3a32', color: '#f9f6f2' }
const tileFont = v => v >= 1000 ? 16 : v >= 100 ? 22 : 28

/* ── Game logic ───────────────────────────────────────────────────── */
const empty = () => Array(4).fill(null).map(() => Array(4).fill(0))
const clone = b => b.map(r => [...r])

function addTile(board) {
  const cells = []
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (!board[r][c]) cells.push([r, c])
  if (!cells.length) return board
  const b = clone(board)
  const [r, c] = cells[Math.floor(Math.random() * cells.length)]
  b[r][c] = Math.random() < 0.9 ? 2 : 4
  return b
}

function applyMove(board, dir) {
  const rot  = b => b[0].map((_, i) => b.map(r => r[i]).reverse())
  const irot = b => b[0].map((_, i) => b.map(r => r[i])).map(r => r.reverse())
  const times = { left: 0, right: 2, up: 3, down: 1 }
  let b = clone(board)
  for (let i = 0; i < times[dir]; i++) b = rot(b)
  let gained = 0, moved = false
  for (let r = 0; r < 4; r++) {
    let row = b[r].filter(Boolean)
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === row[i + 1]) {
        gained += row[i] * 2
        row[i] *= 2
        row.splice(i + 1, 1)
      }
    }
    while (row.length < 4) row.push(0)
    if (row.join() !== b[r].join()) moved = true
    b[r] = row
  }
  const uninv = { left: 0, right: 2, up: 1, down: 3 }
  for (let i = 0; i < uninv[dir]; i++) b = irot(b)
  return { board: b, gained, moved }
}

function isOver(board) {
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) return false
      if (c < 3 && board[r][c] === board[r][c + 1]) return false
      if (r < 3 && board[r][c] === board[r + 1][c]) return false
    }
  return true
}

function hasWon(board) {
  return board.flat().some(v => v === 2048)
}

function startBoard() {
  return addTile(addTile(empty()))
}

/* ── Component ────────────────────────────────────────────────────── */
export default function App() {
  const [board,      setBoard]      = useState(startBoard)
  const [score,      setScore]      = useState(0)
  const [best,       setBest]       = useState(() => Number(localStorage.getItem('best') || 0))
  const [status,     setStatus]     = useState('playing')   // playing | won | over
  const [freeUndos,  setFreeUndos]  = useState(1)
  const [adOpen,     setAdOpen]     = useState(false)
  const [adReward,   setAdReward]   = useState(null)        // { label, callback }

  const prevRef  = useRef(null)
  const touchRef = useRef({})

  /* Save best score */
  useEffect(() => {
    if (score > best) {
      setBest(score)
      localStorage.setItem('best', score)
    }
  }, [score])

  /* ── Move ── */
  const move = useCallback((dir) => {
    if (status !== 'playing') return
    setBoard(prev => {
      const { board: nb, gained, moved } = applyMove(prev, dir)
      if (!moved) return prev
      prevRef.current = { board: prev, score }
      const next = addTile(nb)
      if (gained) setScore(s => s + gained)
      if (hasWon(next)) setStatus('won')
      else if (isOver(next)) setStatus('over')
      return next
    })
  }, [status, score])

  /* ── Keyboard ── */
  useEffect(() => {
    const MAP = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down' }
    const fn = e => { if (MAP[e.key]) { e.preventDefault(); move(MAP[e.key]) } }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [move])

  /* ── Touch / swipe ── */
  const onTouchStart = e => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = e => {
    const dx = e.changedTouches[0].clientX - touchRef.current.x
    const dy = e.changedTouches[0].clientY - touchRef.current.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
  }

  /* ── Rewarded ad helper ── */
  function showRewarded(label, callback) {
    setAdReward({ label, callback })
    setAdOpen(true)
  }

  /* ── Undo ── */
  function handleUndo() {
    if (!prevRef.current) return
    if (freeUndos > 0) {
      doUndo()
      setFreeUndos(f => f - 1)
    } else {
      showRewarded('undo last move', doUndo)
    }
  }

  function doUndo() {
    if (!prevRef.current) return
    setBoard(prevRef.current.board)
    setScore(prevRef.current.score)
    prevRef.current = null
    setStatus('playing')
  }

  /* ── Keep playing past 2048 ── */
  function handleKeepPlaying() {
    showRewarded('keep playing past 2048', () => setStatus('playing'))
  }

  /* ── New game (interstitial-style: show full-page ad before resetting) ── */
  function handleNewGame() {
    if (status === 'over') {
      showRewarded('start a new game', resetGame)
    } else {
      resetGame()
    }
  }

  function resetGame() {
    setBoard(startBoard())
    setScore(0)
    setFreeUndos(1)
    prevRef.current = null
    setStatus('playing')
  }

  /* ── Styles ── */
  const S = {
    page: {
      maxWidth: 480,
      margin: '0 auto',
      padding: '16px 12px 32px',
      position: 'relative',   // needed for modal positioning
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: { fontSize: 40, fontWeight: 700, color: '#776e65', letterSpacing: -1 },
    scoreRow: { display: 'flex', gap: 8 },
    scoreBox: {
      background: '#bbada0',
      borderRadius: 6, padding: '6px 14px',
      textAlign: 'center', minWidth: 72,
    },
    scoreLabel: { fontSize: 11, color: '#eee4da', textTransform: 'uppercase', letterSpacing: '0.5px' },
    scoreVal: { fontSize: 18, fontWeight: 600, color: '#fff' },
    btnRow: { display: 'flex', gap: 8, marginBottom: 12 },
    btn: (accent) => ({
      flex: 1, padding: '9px 0',
      background: accent ? '#f59563' : '#8f7a66',
      color: '#fff', border: 'none',
      borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: 'pointer',
    }),
    board: {
      background: '#bbada0',
      borderRadius: 10, padding: 10,
      position: 'relative',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 10,
    },
    cell: {
      aspectRatio: '1',
      background: 'rgba(238,228,218,0.35)',
      borderRadius: 6,
    },
    overlay: {
      position: 'absolute', inset: 0,
      background: 'rgba(238,228,218,0.88)',
      borderRadius: 10,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 12, zIndex: 10,
    },
    overlayTitle: { fontSize: 26, fontWeight: 700, color: '#776e65' },
    arrowPad: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 52px)',
      gap: 6,
      justifyContent: 'center',
      marginTop: 14,
    },
    arrowBtn: {
      width: 52, height: 52, fontSize: 20,
      background: '#8f7a66', color: '#fff',
      border: 'none', borderRadius: 8, cursor: 'pointer',
    },
    hint: { fontSize: 12, color: '#a39487', textAlign: 'center', marginTop: 8 },
  }

  return (
    <div style={S.page}>
      {/* Rewarded ad modal (positioned inside page div) */}
      <RewardedAdModal
        open={adOpen}
        rewardLabel={adReward?.label}
        onRewarded={() => { setAdOpen(false); adReward?.callback() }}
        onClose={() => setAdOpen(false)}
      />

      {/* ── Top AdSense banner ── */}
      <AdBanner />

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.title}>2048</div>
        <div style={S.scoreRow}>
          {[['Score', score], ['Best', best]].map(([label, val]) => (
            <div key={label} style={S.scoreBox}>
              <div style={S.scoreLabel}>{label}</div>
              <div style={S.scoreVal}>{val.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Buttons ── */}
      <div style={S.btnRow}>
        <button style={S.btn(false)} onClick={handleNewGame}>New game</button>
        <button
          style={S.btn(freeUndos === 0)}
          onClick={handleUndo}
          disabled={!prevRef.current}
        >
          {freeUndos > 0 ? 'Undo (free)' : 'Undo (watch ad)'}
        </button>
      </div>

      {/* ── Board ── */}
      <div
        style={S.board}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Background grid */}
        <div style={S.grid}>
          {Array(16).fill(null).map((_, i) => (
            <div key={i} style={S.cell} />
          ))}
        </div>

        {/* Tiles */}
        <div style={{ ...S.grid, position: 'absolute', inset: 10 }}>
          {board.flat().map((v, i) => {
            const ts = v ? (TILE_STYLE[v] || DEFAULT_TILE) : null
            return (
              <div key={i} style={{
                aspectRatio: '1',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: ts ? ts.bg : 'transparent',
                color: ts ? ts.color : 'transparent',
                fontSize: v ? tileFont(v) : 0,
                fontWeight: 600,
                transition: 'background 0.1s',
              }}>
                {v || ''}
              </div>
            )
          })}
        </div>

        {/* Game-over / win overlay */}
        {status !== 'playing' && (
          <div style={S.overlay}>
            <div style={S.overlayTitle}>
              {status === 'won' ? 'You reached 2048!' : 'Game over!'}
            </div>
            {status === 'won' && (
              <button style={S.btn(true)} onClick={handleKeepPlaying}>
                Keep playing (watch ad)
              </button>
            )}
            <button style={{ ...S.btn(false), minWidth: 140 }} onClick={handleNewGame}>
              {status === 'over' ? 'Try again' : 'New game'}
            </button>
          </div>
        )}
      </div>

      {/* ── Arrow pad (mobile) ── */}
      <div style={S.arrowPad}>
        {['', 'up', '', 'left', 'down', 'right'].map((dir, i) => (
          dir
            ? <button key={i} style={S.arrowBtn} onClick={() => move(dir)}>
                {dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'left' ? '←' : '→'}
              </button>
            : <div key={i} />
        ))}
      </div>

      <p style={S.hint}>Arrow keys or swipe to play</p>

      {/* ── Bottom AdSense banner ── */}
      <AdBanner style={{ marginTop: 20 }} />
    </div>
  )
}
