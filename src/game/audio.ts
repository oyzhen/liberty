export type SfxId = 'stone' | 'capture' | 'success' | 'fail' | 'ui' | 'achievement' | 'feed'

const SCALES: Record<string, number[]> = {
  guqin: [220, 246.94, 293.66, 329.63, 392, 440],
  rain: [261.63, 293.66, 349.23, 392, 440, 523.25],
  starlight: [196, 246.94, 293.66, 369.99, 440, 493.88],
  breeze: [174.61, 220, 261.63, 329.63, 349.23, 440],
}

type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext
}

/**
 * Web Audio needs a user gesture on most browsers. Keep the context locked until
 * unlock() succeeds, and retry on later gestures instead of consuming one chance.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicBus: GainNode | null = null
  private sfxBus: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private musicVoices = new Set<OscillatorNode>()
  private sfxVoices = new Set<OscillatorNode>()
  private step = 0
  muted = false
  volume = .65
  track = 'guqin'
  musicEnabled = true

  constructor(muted = false, volume = .65, track = 'guqin') {
    this.muted = muted
    this.volume = Math.max(0, Math.min(1, volume))
    this.track = track
  }

  private ensure(): AudioContext | null {
    if (this.ctx && this.ctx.state !== 'closed') return this.ctx
    const Context = window.AudioContext || (window as AudioContextWindow).webkitAudioContext
    if (!Context) return null
    try {
      this.ctx = new Context()
      this.master = this.ctx.createGain()
      this.musicBus = this.ctx.createGain()
      this.sfxBus = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume
      this.musicBus.gain.value = .6
      this.sfxBus.gain.value = .85
      this.musicBus.connect(this.master)
      this.sfxBus.connect(this.master)
      this.master.connect(this.ctx.destination)
      return this.ctx
    } catch {
      this.ctx = null
      this.master = null
      this.musicBus = null
      this.sfxBus = null
      return null
    }
  }

  async unlock(): Promise<boolean> {
    const ctx = this.ensure()
    if (!ctx) return false
    try {
      if (ctx.state !== 'running') await ctx.resume()
    } catch {
      return false
    }
    const running = ctx.state === 'running'
    if (running && this.musicEnabled && !this.muted && this.volume > 0) this.startMusic()
    return running
  }

  private updateMaster() {
    if (!this.master || !this.ctx) return
    const target = this.muted ? 0 : this.volume
    this.master.gain.cancelScheduledValues(this.ctx.currentTime)
    this.master.gain.setTargetAtTime(target, this.ctx.currentTime, .015)
  }

  setMuted(value: boolean) {
    this.muted = value
    this.updateMaster()
    if (value) this.stopMusic()
    else if (this.volume > 0) void this.unlock()
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value))
    this.updateMaster()
    if (this.volume === 0) this.stopMusic()
    else if (!this.muted) void this.unlock()
  }

  setTrack(track: string) {
    if (track === this.track) return
    this.track = track
    this.step = 0
    this.stopMusic()
    if (this.ctx?.state === 'running' && !this.muted && this.volume > 0) this.startMusic()
  }

  private tone(
    freq: number,
    duration: number,
    gain: number,
    type: OscillatorType = 'sine',
    delay = 0,
    channel: 'music' | 'sfx' = 'sfx'
  ) {
    if (this.muted || this.volume === 0 || !this.ctx || this.ctx.state !== 'running') return
    const output = channel === 'music' ? this.musicBus : this.sfxBus
    if (!output) return
    const ctx = this.ctx, t = ctx.currentTime + delay
    const osc = ctx.createOscillator(), amp = ctx.createGain()
    const voices = channel === 'music' ? this.musicVoices : this.sfxVoices
    voices.add(osc)
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    amp.gain.setValueAtTime(.0001, t)
    amp.gain.exponentialRampToValueAtTime(gain, t + .012)
    amp.gain.exponentialRampToValueAtTime(.0001, t + duration)
    osc.connect(amp).connect(output)
    osc.onended = () => {
      voices.delete(osc)
      osc.disconnect()
      amp.disconnect()
    }
    osc.start(t)
    osc.stop(t + duration + .03)
  }

  private playSfx(id: SfxId) {
    if (id === 'stone') { this.tone(180, .075, .32, 'triangle'); this.tone(95, .11, .2, 'sine', .012) }
    if (id === 'capture') { this.tone(160, .15, .28, 'triangle'); this.tone(320, .22, .16, 'sine', .045) }
    if (id === 'success') [523.25,659.25,783.99].forEach((n,i) => this.tone(n,.55,.16,'sine',i*.1))
    if (id === 'fail') { this.tone(190,.28,.2,'triangle'); this.tone(150,.3,.14,'triangle',.12) }
    if (id === 'ui') this.tone(480,.075,.12,'sine')
    if (id === 'achievement') [392,523.25,659.25,1046.5].forEach((n,i) => this.tone(n,.65,.14,'sine',i*.09))
    if (id === 'feed') { this.tone(660,.2,.14); this.tone(880,.3,.12,'sine',.09) }
  }

  sfx(id: SfxId) {
    if (this.muted || this.volume === 0) return
    const ctx = this.ensure()
    if (!ctx) return
    if (ctx.state !== 'running') {
      void this.unlock().then(running => { if (running) this.playSfx(id) })
      return
    }
    this.playSfx(id)
  }

  startMusic() {
    if (this.timer || this.muted || !this.musicEnabled || this.volume === 0 || this.ctx?.state !== 'running') return
    const play = () => {
      const scale = SCALES[this.track] || SCALES.guqin
      const note = scale[(this.step * 2 + (this.step % 3)) % scale.length]
      const type: OscillatorType = this.track === 'guqin' || this.track === 'starlight' ? 'triangle' : 'sine'
      this.tone(note, 2.4, .12, type, 0, 'music')
      this.tone(note * 2, 1.1, .035, 'sine', .08, 'music')
      if (this.step % 4 === 0) this.tone(note / 2, 3.6, .07, 'sine', 0, 'music')
      this.step++
    }
    play()
    this.timer = setInterval(play, 1800)
  }

  private stopVoices(voices: Set<OscillatorNode>) {
    for (const osc of voices) {
      try { osc.stop() } catch { /* already stopped */ }
      osc.disconnect()
    }
    voices.clear()
  }

  stopMusic() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.stopVoices(this.musicVoices)
  }

  dispose() {
    this.stopMusic()
    this.stopVoices(this.sfxVoices)
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close()
    this.ctx = null
    this.master = null
    this.musicBus = null
    this.sfxBus = null
  }
}
