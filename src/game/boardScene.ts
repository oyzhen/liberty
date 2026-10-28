import * as THREE from 'three'
import { GameLoop } from './engine'
import type { GameSnapshot, Vertex, ViewMode } from './goTypes'
interface SceneOptions { onPlace: (v: Vertex) => void; onHover: (v: Vertex | null) => void }
const BOARD_Y = .36
const themeColors: Record<string, { wood: string; line: string; glow: string; ground: string }> = {
  ink: { wood: '#c59b62', line: '#392b23', glow: '#a8d8c5', ground: '#0b1a1b' },
  dream: { wood: '#c9a9cb', line: '#48354f', glow: '#f5c6ff', ground: '#19142c' },
  classical: { wood: '#ad7845', line: '#291b12', glow: '#e9c68e', ground: '#21170f' },
  modern: { wood: '#d5d6d1', line: '#333b40', glow: '#7dd3fc', ground: '#11171c' },
  tech: { wood: '#243e4c', line: '#79e7ec', glow: '#5ff6ff', ground: '#050f19' },
  aesthetic: { wood: '#ddbdad', line: '#563d3c', glow: '#ffd5db', ground: '#24181e' },
  forest: { wood: '#a88c58', line: '#243a29', glow: '#b5e49a', ground: '#0d1d15' },
  night: { wood: '#62677c', line: '#d4d8e8', glow: '#b8c4ff', ground: '#0b1020' },
  vermilion: { wood: '#c7976e', line: '#51231e', glow: '#ffba96', ground: '#26100e' },
  celadon: { wood: '#a9c4b2', line: '#314e47', glow: '#d1fff0', ground: '#10231f' },
  snow: { wood: '#d7d9d6', line: '#49545d', glow: '#ffffff', ground: '#18232c' },
  golden: { wood: '#c3a158', line: '#3b2c13', glow: '#ffe29a', ground: '#211b0e' },
  sakura: { wood: '#d5aaa9', line: '#5c373e', glow: '#ffd1df', ground: '#281820' },
}
export class BoardScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(38, 1, .1, 100)
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private boardGroup = new THREE.Group()
  private stoneGroup = new THREE.Group()
  private boardMesh!: THREE.Mesh
  private blackStones!: THREE.InstancedMesh
  private whiteStones!: THREE.InstancedMesh
  private hoverStone: THREE.Mesh
  private lastMarker: THREE.Mesh
  private hintMarker: THREE.Mesh
  private cursorMarker: THREE.Mesh
  private particles: THREE.Points
  private loop: GameLoop
  private size = 9
  private spacing = 1
  private view: ViewMode = '2.5d'
  private theme = 'ink'
  private snapshot: GameSnapshot | null = null
  private hover: Vertex | null = null
  private hint: Vertex | null = null
  private cursor: Vertex | null = null
  private interactive = true
  private showCoordinates = true
  private yaw = 0
  private pitch = .78
  private distance = 15.8
  private targetDistance = 15.8
  private down = { x: 0, y: 0, yaw: 0, pitch: 0, dragging: false }
  private pointers = new Map<number, { x: number; y: number }>()
  private pinchDistance = 0
  private disposed = false
  private softwareRenderer = false
  private elapsed = 0
  private resizeObserver: ResizeObserver
  private stoneGeometry = new THREE.SphereGeometry(.43, 24, 16)
  private blackMaterial: THREE.MeshStandardMaterial = new THREE.MeshPhysicalMaterial({ color: 0x111817, roughness: .22, metalness: .08, clearcoat: .7, clearcoatRoughness: .18 })
  private whiteMaterial: THREE.MeshStandardMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf2eee3, roughness: .3, clearcoat: .45 })
  constructor(private canvas: HTMLCanvasElement, private options: SceneOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    const gl = this.renderer.getContext()
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    const gpu = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : ''
    this.softwareRenderer = /swiftshader|llvmpipe|software/i.test(gpu)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.softwareRenderer ? 1 : 1.75))
    this.renderer.shadowMap.enabled = !this.softwareRenderer
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.08
    if (this.softwareRenderer) {
      this.stoneGeometry.dispose()
      this.stoneGeometry = new THREE.SphereGeometry(.43, 12, 8)
      this.blackMaterial.dispose(); this.whiteMaterial.dispose()
      this.blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111817, roughness: .28, metalness: .06 })
      this.whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xf2eee3, roughness: .38 })
    }
    this.scene.add(this.boardGroup, this.stoneGroup)
    this.scene.add(new THREE.HemisphereLight(0xe6f3ec, 0x17201d, 2.0))
    const key = new THREE.DirectionalLight(0xffe5c2, 3.2)
    key.position.set(-6, 12, 7); key.castShadow = true
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -8; key.shadow.camera.right = 8; key.shadow.camera.top = 8; key.shadow.camera.bottom = -8
    this.scene.add(key)
    const rim = new THREE.DirectionalLight(0x8bd6ca, 1.5); rim.position.set(8, 6, -8); this.scene.add(rim)
    this.hoverStone = new THREE.Mesh(this.stoneGeometry, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .36, depthWrite: false }))
    this.hoverStone.visible = false; this.scene.add(this.hoverStone)
    this.lastMarker = new THREE.Mesh(new THREE.RingGeometry(.16, .22, 32), new THREE.MeshBasicMaterial({ color: 0xe6b86a, side: THREE.DoubleSide, depthTest: false }))
    this.lastMarker.rotation.x = -Math.PI / 2; this.lastMarker.renderOrder = 8; this.lastMarker.visible = false; this.scene.add(this.lastMarker)
    this.hintMarker = new THREE.Mesh(new THREE.RingGeometry(.36, .43, 32), new THREE.MeshBasicMaterial({ color: 0x9fffd4, side: THREE.DoubleSide, transparent: true, opacity: .8, depthTest: false }))
    this.hintMarker.rotation.x = -Math.PI / 2; this.hintMarker.visible = false; this.hintMarker.renderOrder = 9; this.scene.add(this.hintMarker)
    this.cursorMarker = new THREE.Mesh(new THREE.RingGeometry(.46, .49, 4), new THREE.MeshBasicMaterial({ color: 0xf5d48d, side: THREE.DoubleSide, depthTest: false }))
    this.cursorMarker.rotation.x = -Math.PI / 2; this.cursorMarker.rotation.z = Math.PI / 4; this.cursorMarker.visible = false; this.cursorMarker.renderOrder = 9; this.scene.add(this.cursorMarker)
    this.particles = this.makeParticles(); this.particles.visible = !this.softwareRenderer; this.scene.add(this.particles)
    this.createStones(); this.buildBoard(9); this.bindInput()
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas.parentElement || canvas)
    this.resize()
    this.loop = new GameLoop({ update: dt => this.update(dt), render: () => this.render() })
    this.loop.start()
  }
  private makeParticles() {
    const positions = new Float32Array(54 * 3)
    for (let i = 0; i < 54; i++) { positions[i * 3] = Math.sin(i * 12.31) * 13; positions[i * 3 + 1] = (i % 9) * .75; positions[i * 3 + 2] = Math.cos(i * 7.17) * 13 }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xa9d6c2, size: .035, transparent: true, opacity: .35, depthWrite: false }))
  }
  private createStones() {
    this.blackStones = new THREE.InstancedMesh(this.stoneGeometry, this.blackMaterial, 361)
    this.whiteStones = new THREE.InstancedMesh(this.stoneGeometry, this.whiteMaterial, 361)
    this.blackStones.castShadow = true; this.blackStones.receiveShadow = true
    this.whiteStones.castShadow = true; this.whiteStones.receiveShadow = true
    this.blackStones.count = 0; this.whiteStones.count = 0
    this.stoneGroup.add(this.blackStones, this.whiteStones)
  }
  private woodTexture(base: string) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512
    const ctx = c.getContext('2d')!; ctx.fillStyle = base; ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 90; i++) {
      ctx.strokeStyle = `rgba(60,35,18,${.015 + (i % 4) * .008})`; ctx.lineWidth = 1 + i % 2
      ctx.beginPath(); const y = i * 6 + Math.sin(i) * 3
      for (let x = 0; x <= 512; x += 16) ctx.lineTo(x, y + Math.sin(x * .025 + i) * 3)
      ctx.stroke()
    }
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4
    return texture
  }
  private buildBoard(size: number) {
    this.size = size; this.spacing = 8.8 / (size - 1)
    while (this.boardGroup.children.length) {
      const child = this.boardGroup.children.pop() as THREE.Mesh
      child.geometry?.dispose()
      const material = child.material as THREE.Material & { map?: THREE.Texture }
      material?.map?.dispose(); material?.dispose()
    }
    const colors = themeColors[this.theme] || themeColors.ink
    const wood = new THREE.MeshStandardMaterial({ map: this.woodTexture(colors.wood), roughness: .58, metalness: .02 })
    this.boardMesh = new THREE.Mesh(new THREE.BoxGeometry(10.4, .58, 10.4, 1, 1, 1), wood)
    this.boardMesh.position.y = 0; this.boardMesh.receiveShadow = true; this.boardMesh.castShadow = true; this.boardGroup.add(this.boardMesh)
    const linePositions: number[] = []
    for (let i = 0; i < size; i++) {
      const p = -4.4 + i * this.spacing
      linePositions.push(-4.4, BOARD_Y, p, 4.4, BOARD_Y, p, p, BOARD_Y, -4.4, p, BOARD_Y, 4.4)
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: colors.line, transparent: true, opacity: .88 }))
    this.boardGroup.add(lines)
    const stars = size === 19 ? [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]] : size === 13 ? [[3,3],[3,9],[6,6],[9,3],[9,9]] : [[2,2],[2,6],[4,4],[6,2],[6,6]]
    for (const [x,y] of stars) {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(.07, 16), new THREE.MeshBasicMaterial({ color: colors.line, side: THREE.DoubleSide }))
      dot.rotation.x = -Math.PI / 2; dot.position.copy(this.vertexPosition([x,y], .012)); this.boardGroup.add(dot)
    }
    if (this.showCoordinates) this.addCoordinates(colors.line)
    this.hover = null; this.hint = null; this.cursor = null
  }
  private addCoordinates(color: string) {
    const letters = 'ABCDEFGHJKLMNOPQRST'
    for (let i = 0; i < this.size; i++) {
      for (const [text, x, z] of [[letters[i], -4.4 + i * this.spacing, 4.92], [String(this.size - i), -4.92, -4.4 + i * this.spacing]] as [string,number,number][]) {
        const c = document.createElement('canvas'); c.width = 64; c.height = 64
        const ctx = c.getContext('2d')!; ctx.fillStyle = color; ctx.font = '500 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 32, 32)
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false }))
        sprite.position.set(x, BOARD_Y + .03, z); sprite.scale.set(.34,.34,.34); sprite.renderOrder = 4; this.boardGroup.add(sprite)
      }
    }
  }
  private vertexPosition(v: Vertex, lift = 0) {
    return new THREE.Vector3(-4.4 + v[0] * this.spacing, BOARD_Y + lift, -4.4 + v[1] * this.spacing)
  }
  updateBoard(snapshot: GameSnapshot, theme = this.theme, view = this.view, coordinates = this.showCoordinates) {
    const rebuild = snapshot.size !== this.size || theme !== this.theme || coordinates !== this.showCoordinates
    this.theme = theme; this.showCoordinates = coordinates
    if (rebuild) this.buildBoard(snapshot.size)
    this.snapshot = snapshot
    let black = 0, white = 0
    const matrix = new THREE.Matrix4(), scale = new THREE.Vector3(), quaternion = new THREE.Quaternion()
    const radius = Math.min(.43, this.spacing * .46)
    for (let y = 0; y < snapshot.size; y++) for (let x = 0; x < snapshot.size; x++) {
      const color = snapshot.signMap[y][x]
      if (!color) continue
      const position = this.vertexPosition([x,y], radius * .42)
      scale.set(radius / .43, radius / .43 * .58, radius / .43)
      matrix.compose(position, quaternion, scale)
      if (color === 1) this.blackStones.setMatrixAt(black++, matrix)
      else this.whiteStones.setMatrixAt(white++, matrix)
    }
    this.blackStones.count = black; this.whiteStones.count = white
    this.blackStones.instanceMatrix.needsUpdate = true; this.whiteStones.instanceMatrix.needsUpdate = true
    this.lastMarker.visible = !!snapshot.lastMove
    if (snapshot.lastMove) { this.lastMarker.position.copy(this.vertexPosition(snapshot.lastMove, radius * .86 + .02)); this.lastMarker.scale.setScalar(radius / .43) }
    if (view !== this.view) this.setView(view)
  }
  setView(view: ViewMode) {
    this.view = view
    const fit = Math.max(1, 1.02 / Math.max(.45, this.camera.aspect))
    if (view === '2d') { this.pitch = Math.PI / 2; this.yaw = 0; this.targetDistance = 15.4 * fit }
    else if (view === '2.5d') { this.pitch = .76; this.yaw = 0; this.targetDistance = 15.8 * fit }
    else { this.pitch = .82; this.yaw = -.4; this.targetDistance = 16.4 * fit }
  }
  setTheme(theme: string) { if (theme !== this.theme) { this.theme = theme; this.buildBoard(this.size); if (this.snapshot) this.updateBoard(this.snapshot, theme, this.view, this.showCoordinates) } }
  setHint(v: Vertex | null) { this.hint = v; this.hintMarker.visible = !!v; if (v) this.hintMarker.position.copy(this.vertexPosition(v, .12)) }
  setCursor(v: Vertex | null) { this.cursor = v; this.cursorMarker.visible = !!v; if (v) this.cursorMarker.position.copy(this.vertexPosition(v, .13)) }
  setInteractive(value: boolean) { this.interactive = value; if (!value) this.hoverStone.visible = false }
  private update(dt: number) {
    this.elapsed += dt
    this.distance += (this.targetDistance - this.distance) * Math.min(1, dt * 8)
    const horizontal = this.view === '2d' ? .001 : Math.cos(this.pitch) * this.distance
    this.camera.position.set(Math.sin(this.yaw) * horizontal, Math.sin(this.pitch) * this.distance, Math.cos(this.yaw) * horizontal)
    this.camera.up.set(0, this.view === '2d' ? 0 : 1, this.view === '2d' ? -1 : 0)
    this.camera.lookAt(0, 0, 0)
    this.particles.rotation.y += dt * .012
    if (this.hintMarker.visible) { const s = 1 + Math.sin(this.elapsed * 4) * .12; this.hintMarker.scale.setScalar(s) }
    if (this.hoverStone.visible) {
      const color = this.snapshot?.turn || 1
      ;(this.hoverStone.material as THREE.MeshStandardMaterial).color.set(color === 1 ? 0x101716 : 0xf6f1e8)
    }
  }
  private render() { if (!this.disposed && !document.hidden) { this.renderer.render(this.scene, this.camera); window.__GAME_READY__ = true } }
  private resize() {
    const parent = this.canvas.parentElement
    const w = parent?.clientWidth || window.innerWidth, h = parent?.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false); this.camera.aspect = w / Math.max(1, h); this.camera.updateProjectionMatrix()
    this.setView(this.view)
  }
  private pick(clientX: number, clientY: number): Vertex | null {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const point = new THREE.Vector3()
    if (!this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0), -BOARD_Y), point)) return null
    const x = Math.round((point.x + 4.4) / this.spacing), y = Math.round((point.z + 4.4) / this.spacing)
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return null
    const center = this.vertexPosition([x,y])
    if (Math.hypot(center.x - point.x, center.z - point.z) > this.spacing * .55) return null
    return [x,y]
  }
  private updateHover(v: Vertex | null) {
    this.hover = v; this.options.onHover(v)
    this.hoverStone.visible = this.interactive && !!v && !!this.snapshot && !this.snapshot.over && this.snapshot.signMap[v![1]][v![0]] === 0
    if (v) {
      const r = Math.min(.43, this.spacing * .46)
      this.hoverStone.position.copy(this.vertexPosition(v, r * .42)); this.hoverStone.scale.set(r / .43, r / .43 * .58, r / .43)
    }
  }
  private bindInput() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerup', this.onPointerUp)
    this.canvas.addEventListener('pointercancel', this.onPointerUp)
    this.canvas.addEventListener('pointerleave', this.onPointerLeave)
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.canvas.addEventListener('contextmenu', this.onContextMenu)
  }
  private onContextMenu = (e: Event) => e.preventDefault()
  private onPointerDown = (e: PointerEvent) => {
    this.canvas.setPointerCapture(e.pointerId); this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    this.down = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch, dragging: false }
    if (this.pointers.size === 2) { const p = [...this.pointers.values()]; this.pinchDistance = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) }
  }
  private onPointerMove = (e: PointerEvent) => {
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (this.pointers.size === 2) {
      const p = [...this.pointers.values()], d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
      if (this.pinchDistance > 0) this.targetDistance = THREE.MathUtils.clamp(this.targetDistance * this.pinchDistance / Math.max(1,d), 10, 23)
      this.pinchDistance = d; this.down.dragging = true; return
    }
    if (this.pointers.has(e.pointerId) && e.buttons) {
      const dx = e.clientX - this.down.x, dy = e.clientY - this.down.y
      if (Math.hypot(dx,dy) > 6) this.down.dragging = true
      if (this.down.dragging && this.view === '3d') {
        this.yaw = this.down.yaw - dx * .006; this.pitch = THREE.MathUtils.clamp(this.down.pitch + dy * .004, .25, 1.35); this.updateHover(null); return
      }
    }
    this.updateHover(this.pick(e.clientX, e.clientY))
  }
  private onPointerUp = (e: PointerEvent) => {
    const wasDragging = this.down.dragging
    this.pointers.delete(e.pointerId)
    if (!wasDragging && this.interactive && e.type === 'pointerup') { const v = this.pick(e.clientX,e.clientY); if (v) this.options.onPlace(v) }
    this.down.dragging = false
  }
  private onPointerLeave = () => { if (!this.pointers.size) this.updateHover(null) }
  private onWheel = (e: WheelEvent) => { e.preventDefault(); this.targetDistance = THREE.MathUtils.clamp(this.targetDistance + e.deltaY * .008, 10, 23) }
  getPerformanceInfo() { return { x: this.cursor?.[0] ?? 0, z: this.cursor?.[1] ?? 0, calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, geometries: this.renderer.info.memory.geometries, quality: this.softwareRenderer ? 'compatibility' : 'full' } }
  projectVertex(v: Vertex) {
    const point = this.vertexPosition(v, .1).project(this.camera)
    const rect = this.canvas.getBoundingClientRect()
    return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 }
  }
  dispose() {
    this.disposed = true; this.loop.stop(); this.resizeObserver.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown); this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerup', this.onPointerUp); this.canvas.removeEventListener('pointercancel', this.onPointerUp)
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave); this.canvas.removeEventListener('wheel', this.onWheel); this.canvas.removeEventListener('contextmenu', this.onContextMenu)
    this.scene.traverse(obj => { if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.LineSegments) { obj.geometry.dispose(); const materials = Array.isArray(obj.material) ? obj.material : [obj.material]; materials.forEach(m => { const mat = m as THREE.Material & { map?: THREE.Texture }; mat.map?.dispose(); mat.dispose() }) } })
    this.stoneGeometry.dispose(); this.blackMaterial.dispose(); this.whiteMaterial.dispose(); this.renderer.dispose()
  }
}
