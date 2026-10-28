import { BoardScene } from './boardScene'
import type { GameSnapshot, Vertex, ViewMode } from './goTypes'

declare global {
  interface Window {
    __GAME_READY__?: boolean
    __gameProbe?: () => { x: number; y: number; z: number; calls?: number; triangles?: number }
    __boardProject?: (v: Vertex) => { x: number; y: number }
  }
}

let scene: BoardScene | null = null

export function startGame(canvas: HTMLCanvasElement, onPlace: (v: Vertex) => void = () => {}, onHover: (v: Vertex | null) => void = () => {}) {
  stopGame()
  scene = new BoardScene(canvas, { onPlace, onHover })
  window.__gameProbe = () => {
    const info = scene?.getPerformanceInfo()
    return { x: info?.x ?? 0, y: 0, z: info?.z ?? 0, ...info }
  }
  window.__boardProject = v => scene?.projectVertex(v) || { x: 0, y: 0 }
}

export function updateGameBoard(snapshot: GameSnapshot, theme: string, view: ViewMode, coordinates: boolean) {
  scene?.updateBoard(snapshot, theme, view, coordinates)
}
export function setBoardView(view: ViewMode) { scene?.setView(view) }
export function setBoardHint(vertex: Vertex | null) { scene?.setHint(vertex) }
export function setBoardCursor(vertex: Vertex | null) { scene?.setCursor(vertex) }
export function setBoardTargets(vertices: Vertex[]) { scene?.setTargets(vertices) }
export function setBoardInteractive(value: boolean) { scene?.setInteractive(value) }
export function stopGame() {
  scene?.dispose(); scene = null
  window.__GAME_READY__ = false
  delete window.__gameProbe
  delete window.__boardProject
}
