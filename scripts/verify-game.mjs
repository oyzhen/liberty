/** Production smoke check. Build first: npm run build && npm run verify.
 * Headless SwiftShader checks correctness only, never real-GPU performance.
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = fileURLToPath(new URL('../', import.meta.url))
const DIST = existsSync(join(ROOT, 'dist/public/index.html')) ? join(ROOT, 'dist/public') : join(ROOT, 'dist')
if (!existsSync(join(DIST, 'index.html'))) throw new Error('Run npm run build first')
const SHOTS = join(ROOT, 'verification-shots')
mkdirSync(SHOTS, { recursive: true })
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.json':'application/json', '.wasm':'application/wasm' }
const server = createServer(async (req, res) => {
  try {
    const raw = req.url === '/' ? '/index.html' : req.url.split('?')[0]
    let path
    try { path = decodeURIComponent(raw) } catch { path = raw }
    const file = resolve(DIST, '.' + path)
    if (file !== DIST && !file.startsWith(DIST + sep)) { res.writeHead(403).end(); return }
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    res.end(data)
  } catch { res.writeHead(404).end() }
})
const fail = message => { console.error('VERIFY FAIL:', message); server.close(); process.exit(1) }
await new Promise(resolve => server.listen(0, resolve))
const port = server.address().port
const candidates = [process.env.CHROMIUM_PATH, '/opt/gchrome/opt/google/chrome/chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean)
let browser
for (const executablePath of [null, ...candidates]) {
  try {
    browser = await chromium.launch(executablePath ? { executablePath, args:['--no-sandbox','--disable-gpu-sandbox','--use-gl=swiftshader'] } : {})
    break
  } catch {}
}
if (!browser) fail('No usable Chromium browser found')
const page = await browser.newPage({ viewport:{ width:1280, height:720 } })
const consoleErrors = []
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })
page.on('pageerror', error => consoleErrors.push(String(error)))
await page.route('**/api/trpc/progress.status', route => route.fulfill({
  status:200, contentType:'application/json',
  body:JSON.stringify({ result:{ data:{ json:{ available:false } } } })
}))
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil:'networkidle' })
await page.waitForFunction(() => window.__GAME_READY__ === true, null, { timeout:8000 })
await page.waitForTimeout(800)
const shot = await page.evaluate(() => {
  const canvas = document.getElementById('game-canvas')
  if (!(canvas instanceof HTMLCanvasElement)) return { kind:'no-canvas' }
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  if (!gl) return { kind:'no-context' }
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight
  if (!w || !h) return { kind:'empty-buffer' }
  const samples = [[.5,.5],[.25,.5],[.75,.5],[.5,.25],[.5,.75]]
  const pixel = new Uint8Array(4)
  let lit = 0
  for (const [x,y] of samples) {
    gl.readPixels((w*x)|0, (h*y)|0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
    if (pixel[3] > 0 && pixel[0]+pixel[1]+pixel[2] > 8) lit++
  }
  return { kind:'lit', lit, total:samples.length }
})
if (shot.kind !== 'lit' || shot.lit < 2) fail(`Canvas did not render: ${JSON.stringify(shot)}`)
await page.screenshot({ path:join(SHOTS,'01-title.png') })
await page.keyboard.press('Space')
await page.waitForTimeout(400)
if (await page.getByRole('button', { name:'再试一次' }).count()) {
  await page.getByRole('button', { name:'再试一次' }).click()
  await page.waitForTimeout(300)
}
const position = () => page.evaluate(() => window.__gameProbe?.())
async function delta(key) {
  const before = await position()
  if (!before) return null
  await page.keyboard.press(key)
  await page.waitForTimeout(250)
  const after = await position()
  return { dx:after.x-before.x, dz:after.z-before.z }
}
const up = await delta('ArrowUp')
if (up && up.dz >= 0) fail(`ArrowUp direction is wrong: ${up.dz}`)
const right = await delta('ArrowRight')
if (right && right.dx <= 0) fail(`ArrowRight direction is wrong: ${right.dx}`)
await page.screenshot({ path:join(SHOTS,'02-gameplay.png') })
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
await page.screenshot({ path:join(SHOTS,'03-paused.png') })
if (consoleErrors.length) fail(`${consoleErrors.length} console error(s): ${consoleErrors[0]}`)
await browser.close()
server.close()
console.log('VERIFY OK: render/enter/direction/pause/console all passed')
