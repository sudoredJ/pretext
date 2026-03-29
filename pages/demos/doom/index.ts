// ASCII DOOM — Pretext Demo
//
// Monospace raycaster with classic DOOM elements: title screen, 3D scene,
// pistol weapon, status bar HUD, crosshair, shooting with muzzle flash.
// Pretext measures HUD text for centering and layout.

import { prepareWithSegments, layoutWithLines } from '../../../src/layout.ts'
import doomLogoUrl from './doom-logo.png'

// ── Grid ────────────────────────────────────────────────────────────
const C = 120                // columns
const VR = 40                // 3D viewport rows
const HR = 8                 // HUD rows
const R = VR + HR            // total rows
const FOV = Math.PI / 3
const MAXD = 20

// ── Brightness ramp (monospace, dark → bright) ──────────────────────
const RAMP = ' .,-~:;=!*#$@'
function rampCh(b: number): string {
  const i = Math.round(Math.max(0, Math.min(1, b)) * (RAMP.length - 1))
  return RAMP[i]!
}

// ── Map ─────────────────────────────────────────────────────────────
// E1M1-inspired: start room → zigzag corridor → nukage room → arena → exit room
const MW = 24, MH = 24
// prettier-ignore
const MAP = [
//0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 0
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, // 1
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, // 2
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 3
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 4, 0, 4, 0, 0, 1, // 4
  1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, // 5
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, // 6
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 7
  1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 8
  1, 1, 1, 0, 1, 1, 1, 0, 0, 3, 3, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 9
  1, 0, 0, 0, 0, 0, 1, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 10
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 11
  1, 0, 0, 0, 0, 0, 1, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 12
  1, 1, 1, 0, 1, 1, 1, 0, 0, 3, 3, 0, 0, 3, 3, 0, 0, 0, 2, 0, 2, 0, 0, 1, // 13
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 14
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 15
  1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, // 16
  1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, // 17
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 18
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, // 19
  1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, // 20
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 21
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, // 22
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 23
]
function m(x: number, y: number): number {
  if (x < 0 || x >= MW || y < 0 || y >= MH) return 1; return MAP[y * MW + x]!
}

// ── Wall colors ─────────────────────────────────────────────────────
const WC: [number, number, number][] = [
  [0,0,0], [170,75,55], [55,145,55], [55,85,170], [170,155,45],
]
const FC: [number, number, number] = [85,75,60]
const CC: [number, number, number] = [40,40,70]
function sc(c: [number, number, number], t: number): string {
  return `rgb(${Math.min(255, Math.round(c[0]*t))},${Math.min(255, Math.round(c[1]*t))},${Math.min(255, Math.round(c[2]*t))})`
}

// ── Player state ────────────────────────────────────────────────────
// Start in bottom-left room, facing north toward the corridor
let px = 2.5, py = 21.5, pa = -Math.PI / 2
let hp = 100, ar = 0, am = 50
let shootTic = 0 // >0 means muzzle flash active

// ── Enemies ─────────────────────────────────────────────────────────
type Enemy = { x: number; y: number; alive: boolean; deathTic: number }
const enemies: Enemy[] = [
  { x: 2.5, y: 19.5, alive: true, deathTic: 0 },  // right ahead in start room
  { x: 7.5, y: 16.5, alive: true, deathTic: 0 },  // corridor after first door
  { x: 14.5, y: 7.5, alive: true, deathTic: 0 },  // central hall
  { x: 11.5, y: 9.5, alive: true, deathTic: 0 },  // near blue room
  { x: 21.5, y: 2.5, alive: true, deathTic: 0 },  // northeast room
]

// ASCII sprites — DOOM imp: horns, hunched, claws
// prettier-ignore
const ENEMY_SPRITE = [
  ' /VV\\  ',
  ' #OO#  ',
  ' #/\\#  ',
  '  ##   ',
  ' /##\\  ',
  '/####\\ ',
  ' #/\\#  ',
  ' /  \\  ',
]
// prettier-ignore
const ENEMY_DEAD = [
  '       ',
  '       ',
  ' .___. ',
  ' |x_x| ',
  '~|___|~',
  '~~~~~~~',
  '       ',
  '       ',
]

// ── Sound engine (Web Audio API — synthesized retro SFX) ────────────
let audioCtx: AudioContext | null = null
function getAudio(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function sfxShoot(): void {
  try {
    const ctx = getAudio()
    // Noise burst for gunshot
    const bufLen = Math.floor(ctx.sampleRate * 0.08)
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) {
      const env = 1 - i / bufLen
      data[i] = (Math.random() * 2 - 1) * env * env
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const gain = ctx.createGain()
    gain.gain.value = 0.3
    src.connect(gain).connect(ctx.destination)
    src.start()
    // Low thump
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(80, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.1)
    const g2 = ctx.createGain()
    g2.gain.setValueAtTime(0.4, ctx.currentTime)
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(g2).connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.1)
  } catch { /* audio not available */ }
}

function sfxEnemyDeath(): void {
  try {
    const ctx = getAudio()
    // Descending growl
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 0.4)
    // Noise component
    const bufLen = Math.floor(ctx.sampleRate * 0.3)
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufLen) * 0.15
    const ns = ctx.createBufferSource(); ns.buffer = buf
    const g2 = ctx.createGain(); g2.gain.value = 0.2
    ns.connect(g2).connect(ctx.destination); ns.start()
  } catch { /* audio not available */ }
}

// sfxPickup reserved for item pickups (future)

// ── Input ───────────────────────────────────────────────────────────
const kd = new Set<string>()
let mdx = 0, shooting = false

// ── DOM ─────────────────────────────────────────────────────────────
const sceneEl = document.getElementById('scene') ?? document.body
const hintEl = document.getElementById('hint')
const logoEl = document.getElementById('logo')
const rows: HTMLDivElement[] = []
for (let i = 0; i < R; i++) { const d = document.createElement('div'); d.className = 'r'; sceneEl.appendChild(d); rows.push(d) }

// ── Draggable DOOM logo (canvas-drawn, hidden on title) ─────────────
let logoRect = { x: 0, y: 0, w: 0, h: 0 }
let logoDragging = false
let logoDragOffX = 0, logoDragOffY = 0
let logoVisible = false
let logoBouncing = false
let logoVx = 0, logoVy = 0
const BOUNCE_SPEED = 4.5

// Set logo src from bundled import
if (logoEl instanceof HTMLImageElement) logoEl.src = doomLogoUrl

function showLogo(): void {
  if (!logoEl) return
  logoEl.style.display = 'block'
  logoVisible = true
  updateLogoRect()
}

void function _hideLogo() {
  if (!logoEl) return
  logoEl.style.display = 'none'
  logoVisible = false
  logoRect = { x: 0, y: 0, w: 0, h: 0 }
}

function updateLogoRect(): void {
  if (!logoEl || !logoVisible) { logoRect = { x: 0, y: 0, w: 0, h: 0 }; return }
  const r = logoEl.getBoundingClientRect()
  logoRect = { x: r.left, y: r.top, w: r.width, h: r.height }
}

if (logoEl) {
  logoEl.addEventListener('mousedown', e => {
    if (!logoVisible) return
    if (logoBouncing) {
      // Click while bouncing: stop and grab
      logoBouncing = false
      logoDragging = true
      logoDragOffX = e.clientX - logoEl!.offsetLeft
      logoDragOffY = e.clientY - logoEl!.offsetTop
    } else {
      // Click while stationary: start bouncing
      logoBouncing = true
      const angle = Math.random() * Math.PI * 2
      logoVx = Math.cos(angle) * BOUNCE_SPEED
      logoVy = Math.sin(angle) * BOUNCE_SPEED
    }
    e.preventDefault()
    e.stopPropagation()
  })
  window.addEventListener('mousemove', e => {
    if (!logoDragging) return
    logoEl!.style.left = `${e.clientX - logoDragOffX}px`
    logoEl!.style.top = `${e.clientY - logoDragOffY}px`
    updateLogoRect()
  })
  window.addEventListener('mouseup', () => { logoDragging = false })
}

function updateLogoBounce(): void {
  if (!logoBouncing || !logoEl || !logoVisible) return
  let lx = logoEl.offsetLeft + logoVx
  let ly = logoEl.offsetTop + logoVy
  const lw = logoEl.offsetWidth
  const lh = logoEl.offsetHeight
  // Bounce off window edges
  if (lx <= 0) { lx = 0; logoVx = Math.abs(logoVx) }
  if (ly <= 0) { ly = 0; logoVy = Math.abs(logoVy) }
  if (lx + lw >= window.innerWidth) { lx = window.innerWidth - lw; logoVx = -Math.abs(logoVx) }
  if (ly + lh >= window.innerHeight) { ly = window.innerHeight - lh; logoVy = -Math.abs(logoVy) }
  logoEl.style.left = `${lx}px`
  logoEl.style.top = `${ly}px`
  updateLogoRect()
}

// Per-cell: character + color
const ch = new Array<string>(C * R)
const co = new Array<string>(C * R)
function clr(): void { for (let i = 0; i < ch.length; i++) { ch[i] = ' '; co[i] = '#000' } }
clr()

// ── Pretext: measure text for HUD centering ─────────────────────────
const HUD_FONT = '12px "Courier New", Courier, monospace'
function ptWidth(text: string): number {
  try {
    const p = prepareWithSegments(text, HUD_FONT)
    const l = layoutWithLines(p, 9999, 14)
    return l.lines.length > 0 ? l.lines[0]!.width : text.length * 7.2
  } catch { return text.length * 7.2 }
}
function ptCenter(text: string, regionCols: number): number {
  const textW = ptWidth(text)
  const regionW = regionCols * 7.2 // approx monospace char width
  return Math.max(0, Math.floor((regionW - textW) / 2 / 7.2))
}

// ══════════════════════════════════════════════════════════════════════
//  TITLE SCREEN
// ══════════════════════════════════════════════════════════════════════
// prettier-ignore
const LOGO = [
  '  ######    #######    #######   ##     ##  ',
  '  ##   ##  ##     ##  ##     ##  ###   ###  ',
  '  ##    ## ##     ##  ##     ##  #### ####  ',
  '  ##    ## ##     ##  ##     ##  ## ### ##  ',
  '  ##    ## ##     ##  ##     ##  ##  #  ##  ',
  '  ##   ##  ##     ##  ##     ##  ##     ##  ',
  '  ######    #######    #######   ##     ##  ',
]
const SUB = 'P R E T E X T   E D I T I O N'

let state: 'title' | 'play' = 'title'
let t0 = performance.now()

function renderTitle(): void {
  clr()
  const lr = Math.floor(R / 2) - 7
  const lc = Math.floor((C - LOGO[0]!.length) / 2)
  for (let r = 0; r < LOGO.length; r++) {
    const line = LOGO[r]!
    for (let c = 0; c < line.length; c++) {
      if (line[c] !== ' ') { ch[(lr + r) * C + lc + c] = line[c]!; co[(lr + r) * C + lc + c] = '#d32' }
    }
  }
  const sc2 = Math.floor((C - SUB.length) / 2)
  for (let i = 0; i < SUB.length; i++) {
    if (SUB[i] !== ' ') { ch[(lr + LOGO.length + 2) * C + sc2 + i] = SUB[i]!; co[(lr + LOGO.length + 2) * C + sc2 + i] = '#876' }
  }
  if (Math.floor((performance.now() - t0) / 600) % 2 === 0) {
    const pk = '[ PRESS ANY KEY ]'
    const pc = Math.floor((C - pk.length) / 2)
    for (let i = 0; i < pk.length; i++) {
      if (pk[i] !== ' ') { ch[(lr + LOGO.length + 5) * C + pc + i] = pk[i]!; co[(lr + LOGO.length + 5) * C + pc + i] = '#665' }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
//  RAYCASTER
// ══════════════════════════════════════════════════════════════════════
function cast(): void {
  const half = VR / 2
  for (let col = 0; col < C; col++) {
    const ang = pa - FOV / 2 + (col / C) * FOV
    const rx = Math.cos(ang), ry = Math.sin(ang)
    let mx = Math.floor(px), my = Math.floor(py)
    const dx = Math.abs(1 / rx), dy = Math.abs(1 / ry)
    let sx: number, sy: number, sdx: number, sdy: number
    if (rx < 0) { sx = -1; sdx = (px - mx) * dx } else { sx = 1; sdx = (mx + 1 - px) * dx }
    if (ry < 0) { sy = -1; sdy = (py - my) * dy } else { sy = 1; sdy = (my + 1 - py) * dy }
    let side = 0, wt = 1, hit = false
    for (let i = 0; i < 64; i++) {
      if (sdx < sdy) { sdx += dx; mx += sx; side = 0 } else { sdy += dy; my += sy; side = 1 }
      const c = m(mx, my); if (c > 0) { wt = c; hit = true; break }
    }
    const pd = hit ? Math.abs(side === 0 ? (mx - px + (1 - sx) / 2) / rx : (my - py + (1 - sy) / 2) / ry) : MAXD
    depthBuf[col] = pd // Store for sprite clipping

    // Texture U for wall grain
    let wu = side === 0 ? (py + pd * ry) % 1 : (px + pd * rx) % 1; if (wu < 0) wu += 1

    const wH = Math.min(VR, Math.round(VR / Math.max(0.001, pd)))
    const wT = Math.max(0, Math.floor(half - wH / 2))
    const wB = Math.min(VR, Math.floor(half + wH / 2))
    const wb = Math.max(0.08, 1 - pd / MAXD)
    const ss = side === 1 ? 0.6 : 1.0
    const wBr = wb * ss
    const tv = Math.sin(wu * Math.PI * 8) * 0.05
    const wColor = sc(WC[wt] ?? WC[1]!, wBr)

    for (let row = 0; row < VR; row++) {
      const idx = row * C + col
      if (row < wT) {
        const t = wT > 0 ? 1 - (wT - row) / half : 1
        const cb = 0.1 + t * 0.45
        ch[idx] = rampCh(cb); co[idx] = sc(CC, cb)
      } else if (row < wB) {
        const rv = ((row + col) & 1) ? 0.03 : -0.02
        ch[idx] = rampCh(wBr + tv + rv); co[idx] = wColor
      } else {
        const t = VR > wB ? (row - wB) / (VR - wB) : 0
        const fb = 0.06 + t * 0.55
        ch[idx] = rampCh(fb); co[idx] = sc(FC, fb)
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
//  GUN — ASCII pistol, bottom center of viewport
// ══════════════════════════════════════════════════════════════════════
// prettier-ignore
const GUN_IDLE = [
  '          ##          ',
  '       ########       ',
  '       ########       ',
  '       ########       ',
  '       ########       ',
  '        ######        ',
  '        ######        ',
  '        ######        ',
]
// prettier-ignore
const GUN_FIRE = [
  '        \\##/          ',
  '       *####*         ',
  '        /##\\          ',
  '       ########       ',
  '       ########       ',
  '       ########       ',
  '       ########       ',
  '        ######        ',
  '        ######        ',
  '        ######        ',
]

function drawGun(): void {
  const gun = shootTic > 0 ? GUN_FIRE : GUN_IDLE
  const gH = gun.length
  const gW = gun[0]!.length
  const r0 = VR - gH
  const c0 = Math.floor((C - gW) / 2)
  const gunColor = shootTic > 0 ? '#ffa' : '#bbb'
  const flashColor = '#ff4'

  for (let r = 0; r < gH; r++) {
    const row = r0 + r; if (row < 0 || row >= VR) continue
    const line = gun[r]!
    for (let c = 0; c < line.length; c++) {
      const col = c0 + c; if (col < 0 || col >= C) continue
      const g = line[c]!
      if (g !== ' ') {
        ch[row * C + col] = g
        // Flash chars (muzzle) in yellow, gun body in gray
        co[row * C + col] = (shootTic > 0 && r < 3 && (g === '*' || g === '-' || g === '\\' || g === '/')) ? flashColor : gunColor
      }
    }
  }
}

// Crosshair
function drawCrosshair(): void {
  const cx = Math.floor(C / 2), cy = Math.floor(VR / 2)
  if (cy >= 0 && cy < VR) {
    if (cx - 1 >= 0) { ch[cy * C + cx - 1] = '-'; co[cy * C + cx - 1] = '#0f0' }
    ch[cy * C + cx] = '+'; co[cy * C + cx] = '#0f0'
    if (cx + 1 < C) { ch[cy * C + cx + 1] = '-'; co[cy * C + cx + 1] = '#0f0' }
  }
  if (cy - 1 >= 0) { ch[(cy - 1) * C + cx] = '|'; co[(cy - 1) * C + cx] = '#0f0' }
  if (cy + 1 < VR) { ch[(cy + 1) * C + cx] = '|'; co[(cy + 1) * C + cx] = '#0f0' }
}

// ══════════════════════════════════════════════════════════════════════
//  ENEMIES — billboard sprites in the 3D view
// ══════════════════════════════════════════════════════════════════════
// Per-column depth buffer for sprite clipping (filled during cast)
const depthBuf = new Float64Array(C)

function drawEnemies(): void {
  // Sort enemies far to near (painter's algorithm)
  const sorted = enemies
    .map(e => ({ e, dist: Math.sqrt((e.x - px) ** 2 + (e.y - py) ** 2) }))
    .sort((a, b) => b.dist - a.dist)

  for (const { e, dist } of sorted) {
    if (dist < 0.5 || dist > MAXD) continue

    // Angle from player to enemy
    const angleToEnemy = Math.atan2(e.y - py, e.x - px)
    let relAngle = angleToEnemy - pa
    while (relAngle < -Math.PI) relAngle += Math.PI * 2
    while (relAngle > Math.PI) relAngle -= Math.PI * 2

    // Check if in FOV
    if (Math.abs(relAngle) > FOV / 2 + 0.2) continue

    // Project to screen column
    const screenX = Math.floor(C / 2 + relAngle * C / FOV)

    // Sprite scale based on distance
    const spriteScale = Math.min(4, VR / dist / 5)
    const sprite = e.alive ? ENEMY_SPRITE : ENEMY_DEAD
    const spriteH = sprite.length
    const spriteW = sprite[0]!.length

    const scaledH = Math.round(spriteH * spriteScale)
    const scaledW = Math.round(spriteW * spriteScale)

    const drawTop = Math.floor(VR / 2 - scaledH / 2 + scaledH * 0.15) // slightly above center (feet on ground)
    const drawLeft = Math.floor(screenX - scaledW / 2)

    const deadFade = e.deathTic > 0 ? Math.max(0.3, 1 - e.deathTic / 30) : 1

    for (let dr = 0; dr < scaledH; dr++) {
      const row = drawTop + dr
      if (row < 0 || row >= VR) continue
      const srcR = Math.floor(dr / spriteScale)
      if (srcR >= spriteH) continue
      const line = sprite[srcR]!

      for (let dc = 0; dc < scaledW; dc++) {
        const col = drawLeft + dc
        if (col < 0 || col >= C) continue
        // Depth test — only draw if closer than the wall at this column
        if (dist > depthBuf[col]!) continue
        const srcC = Math.floor(dc / spriteScale)
        if (srcC >= spriteW) continue
        const sc = line[srcC]!
        if (sc === ' ') continue
        ch[row * C + col] = sc
        // Darken with distance
        const bright = Math.max(0.2, 1 - dist / MAXD) * deadFade
        const r = Math.round(e.alive ? 200 * bright : 130 * bright)
        const g = Math.round(e.alive ? 60 * bright : 60 * bright)
        const b = Math.round(e.alive ? 60 * bright : 60 * bright)
        co[row * C + col] = `rgb(${r},${g},${b})`
      }
    }
  }
}

// Hitscan — check if shooting hits an enemy
function hitscan(): void {
  let closestDist = MAXD
  let closestEnemy: Enemy | null = null

  for (const e of enemies) {
    if (!e.alive) continue
    const dx = e.x - px, dy = e.y - py
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > closestDist) continue

    const angleToEnemy = Math.atan2(dy, dx)
    let relAngle = angleToEnemy - pa
    while (relAngle < -Math.PI) relAngle += Math.PI * 2
    while (relAngle > Math.PI) relAngle -= Math.PI * 2

    // Hit if within ~3 degrees of center
    const hitRadius = Math.atan2(0.5, dist) // half-unit radius at that distance
    if (Math.abs(relAngle) < hitRadius) {
      // Check if a wall is blocking
      const wallDist = castRayDist(pa)
      if (dist < wallDist) {
        closestDist = dist
        closestEnemy = e
      }
    }
  }

  if (closestEnemy !== null) {
    closestEnemy.alive = false
    closestEnemy.deathTic = 1
    sfxEnemyDeath()
  }
}

// Cast a single ray and return distance to first wall
function castRayDist(angle: number): number {
  const rx = Math.cos(angle), ry = Math.sin(angle)
  let mx = Math.floor(px), my = Math.floor(py)
  const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry)
  let sx: number, sy: number, sdx: number, sdy: number
  if (rx < 0) { sx = -1; sdx = (px - mx) * ddx } else { sx = 1; sdx = (mx + 1 - px) * ddx }
  if (ry < 0) { sy = -1; sdy = (py - my) * ddy } else { sy = 1; sdy = (my + 1 - py) * ddy }
  let side = 0
  for (let i = 0; i < 64; i++) {
    if (sdx < sdy) { sdx += ddx; mx += sx; side = 0 } else { sdy += ddy; my += sy; side = 1 }
    if (m(mx, my) > 0) {
      return Math.abs(side === 0 ? (mx - px + (1 - sx) / 2) / rx : (my - py + (1 - sy) / 2) / ry)
    }
  }
  return MAXD
}

// ══════════════════════════════════════════════════════════════════════
//  HUD — Classic DOOM status bar
//
//  ========================================================================
//  | AMMO |      HEALTH      | ARMS  |  FACE  | KEYS |      ARMOR       |
//  |  50  |       100%       | 1 2 3 | [>:|]  |  B   |        0%        |
//  |      |                  | 4 5 6 |        |  R   |                  |
//  |      |                  |   7   |        |  Y   |                  |
//  ========================================================================
// ══════════════════════════════════════════════════════════════════════

function renderHud(): void {
  const y = VR
  const bdr = '#665'
  const lbl = '#887'
  const dim = '#554'
  const red = '#d33'
  const yel = '#dc3'
  const blu = '#49e'
  const grn = '#4b4'
  const wht = '#bba'

  // Border
  hline(y, 0, C, '=', bdr)
  hline(y + HR - 1, 0, C, '=', bdr)

  // Vertical separators: | at fixed columns
  const seps = [10, 35, 48, 61, 72]
  for (const s of seps) {
    for (let r = 1; r < HR - 1; r++) { ch[(y + r) * C + s] = '|'; co[(y + r) * C + s] = dim }
  }

  // AMMO section (cols 0-9)
  htext(y + 1, 3, 'AMMO', lbl)
  const ammoStr = String(am)
  htext(y + 3, ptCenter(ammoStr, 10), ammoStr, yel)

  // HEALTH section (cols 11-34)
  htext(y + 1, 18, 'HEALTH', lbl)
  const hpStr = String(hp) + '%'
  htext(y + 3, 11 + ptCenter(hpStr, 24), hpStr, red)

  // ARMS section (cols 36-47)
  htext(y + 1, 39, 'ARMS', lbl)
  htext(y + 3, 37, '1', yel) // selected
  htext(y + 3, 39, '2', dim); htext(y + 3, 41, '3', dim)
  htext(y + 4, 37, '4', dim); htext(y + 4, 39, '5', dim); htext(y + 4, 41, '6', dim)
  htext(y + 5, 39, '7', dim)

  // FACE section (cols 49-60)
  const face = hp > 60 ? '>:|' : hp > 30 ? '>;[' : 'x_x'
  htext(y + 2, 52, '.---.', grn)
  htext(y + 3, 52, '|' + face + '|', grn)
  htext(y + 4, 52, "'---'", grn)

  // KEYS section (cols 62-71)
  htext(y + 1, 65, 'KEYS', lbl)
  htext(y + 3, 66, 'B', blu)
  htext(y + 4, 66, 'R', red)
  htext(y + 5, 66, 'Y', yel)

  // ARMOR section (cols 73-end)
  htext(y + 1, 85, 'ARMOR', lbl)
  const arStr = String(ar) + '%'
  htext(y + 3, 73 + ptCenter(arStr, 30), arStr, blu)

  // Ammo types (far right)
  htext(y + 2, 107, 'BULL', dim); htext(y + 2, 113, '200', wht)
  htext(y + 3, 107, 'SHEL', dim); htext(y + 3, 113, ' 50', wht)
  htext(y + 4, 107, 'RCKT', dim); htext(y + 4, 113, '  0', wht)
  htext(y + 5, 107, 'CELL', dim); htext(y + 5, 113, '  0', wht)
}

function hline(row: number, col: number, len: number, c: string, color: string): void {
  if (row < 0 || row >= R) return
  for (let i = 0; i < len && col + i < C; i++) { ch[row * C + col + i] = c; co[row * C + col + i] = color }
}
function htext(row: number, col: number, text: string, color: string): void {
  if (row < 0 || row >= R) return
  for (let i = 0; i < text.length; i++) {
    const c = col + i; if (c < 0 || c >= C) continue
    const t = text[i]!; if (t === ' ') continue
    const safe = t === '<' ? '&lt;' : t === '>' ? '&gt;' : t === '&' ? '&amp;' : t
    ch[row * C + c] = safe; co[row * C + c] = color
  }
}

// ══════════════════════════════════════════════════════════════════════
//  FLUSH TO DOM — batch chars with same color into spans
// ══════════════════════════════════════════════════════════════════════
function flush(): void {
  const sr = sceneEl.getBoundingClientRect()
  updateLogoRect()
  const cW = sr.width > 0 ? sr.width / C : 7.2
  const cH = sr.height > 0 ? sr.height / R : 14

  // Logo bounds in cell coordinates
  const lL = Math.floor((logoRect.x - sr.left) / cW)
  const lR = Math.ceil((logoRect.x + logoRect.w - sr.left) / cW)
  const lT = Math.floor((logoRect.y - sr.top) / cH)
  const lB = Math.ceil((logoRect.y + logoRect.h - sr.top) / cH)
  const lCx = (lL + lR) / 2
  const lCy = (lT + lB) / 2
  const lHalfW = (lR - lL) / 2
  const lHalfH = (lB - lT) / 2
  const active = logoVisible && lR > lL && lB > lT
  const FALLOFF = 16
  const MAX_PUSH = Math.max(lHalfW, lHalfH) * 0.7 + 3

  for (let row = 0; row < R; row++) {
    let html = ''
    let runColor = '', run = ''

    for (let col = 0; col < C; col++) {
      let srcRow = row, srcCol = col
      let gap = false

      if (active) {
        // Normalized distance from logo center (0 = center, 1 = edge, >1 = outside)
        const ndx = lHalfW > 0 ? (col - lCx) / lHalfW : 0
        const ndy = lHalfH > 0 ? (row - lCy) / lHalfH : 0
        const nd = Math.sqrt(ndx * ndx + ndy * ndy)

        if (nd < 0.95) {
          // Inside the logo — gap
          gap = true
        } else if (nd < 1 + FALLOFF / Math.max(lHalfW, lHalfH)) {
          // In the displacement zone: push radially outward
          // Strength: 1 at logo edge, 0 at falloff boundary
          const edgeDist = nd - 0.95
          const maxEdgeDist = FALLOFF / Math.max(lHalfW, lHalfH)
          const strength = Math.max(0, 1 - edgeDist / maxEdgeDist)
          const push = strength * strength * MAX_PUSH // quadratic falloff

          // Direction: away from logo center
          const len = Math.sqrt((col - lCx) ** 2 + (row - lCy) ** 2)
          if (len > 0.1) {
            const dirX = (col - lCx) / len
            const dirY = (row - lCy) / len
            // Source = pull back toward logo center
            srcCol = Math.max(0, Math.min(C - 1, Math.round(col - dirX * push)))
            srcRow = Math.max(0, Math.min(R - 1, Math.round(row - dirY * push)))
          }
        }
      }

      const color = gap ? '#000' : co[srcRow * C + srcCol]!
      const c = gap ? ' ' : ch[srcRow * C + srcCol]!

      if (color === runColor) { run += c }
      else { if (run) html += runColor === '#000' ? run : `<span style="color:${runColor}">${run}</span>`; runColor = color; run = c }
    }

    if (run) html += runColor === '#000' ? run : `<span style="color:${runColor}">${run}</span>`
    rows[row]!.innerHTML = html
  }
}

// ══════════════════════════════════════════════════════════════════════
//  PLAYER + SHOOTING
// ══════════════════════════════════════════════════════════════════════
function update(): void {
  if (mdx !== 0) { pa += mdx * 0.003; mdx = 0 }
  if (kd.has('ArrowLeft')) pa -= 0.045
  if (kd.has('ArrowRight')) pa += 0.045
  let dx = 0, dy = 0
  const cs = Math.cos(pa), sn = Math.sin(pa)
  if (kd.has('KeyW') || kd.has('ArrowUp')) { dx += cs * 0.07; dy += sn * 0.07 }
  if (kd.has('KeyS') || kd.has('ArrowDown')) { dx -= cs * 0.07; dy -= sn * 0.07 }
  if (kd.has('KeyA')) { dx += sn * 0.07; dy -= cs * 0.07 }
  if (kd.has('KeyD')) { dx -= sn * 0.07; dy += cs * 0.07 }
  const mg = 0.25
  if (dx !== 0 && m(Math.floor(px + dx + Math.sign(dx) * mg), Math.floor(py)) === 0) px += dx
  if (dy !== 0 && m(Math.floor(px), Math.floor(py + dy + Math.sign(dy) * mg)) === 0) py += dy

  // Shooting — spacebar or left mouse button
  if (kd.has('Space')) shooting = true
  if (shooting) {
    if (am > 0 && shootTic <= 0) {
      shootTic = 8; am--
      sfxShoot()
      hitscan()
    }
    shooting = false
  }
  if (shootTic > 0) shootTic--
  // Update dead enemy tics
  for (const e of enemies) { if (!e.alive && e.deathTic > 0 && e.deathTic < 30) e.deathTic++ }
}

// ══════════════════════════════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════════════════════════════
window.addEventListener('keydown', e => {
  kd.add(e.code)
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
  if (state === 'title') { state = 'play'; showLogo() }
})
window.addEventListener('keyup', e => kd.delete(e.code))
sceneEl.addEventListener('click', () => {
  if (state === 'title') { state = 'play'; showLogo(); return }
  if (document.pointerLockElement !== sceneEl) { sceneEl.requestPointerLock(); if (hintEl) hintEl.style.opacity = '0' }
})
document.addEventListener('mousedown', () => {
  if (document.pointerLockElement === sceneEl) shooting = true
})
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === sceneEl) mdx += e.movementX
})

// ══════════════════════════════════════════════════════════════════════
//  LOOP
// ══════════════════════════════════════════════════════════════════════
let fps = 0, ffc = 0, flt = performance.now()
function loop(): void {
  ffc++; const now = performance.now()
  if (now - flt >= 1000) { fps = ffc; ffc = 0; flt = now }

  clr()
  if (state === 'title') { renderTitle() }
  else {
    update()
    updateLogoBounce()
    cast()
    drawEnemies()
    drawCrosshair()
    drawGun()
    renderHud()
    htext(VR + 1, C - 7, `${fps}fps`, '#554')
  }
  flush()
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)
