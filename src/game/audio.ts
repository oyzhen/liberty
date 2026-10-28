export type SfxId = 'stone' | 'capture' | 'success' | 'fail' | 'ui' | 'achievement' | 'feed'

const SCALES: Record<string, number[]> = {
  guqin: [220, 246.94, 293.66, 329.63, 392, 440],
  rain: [261.63, 293.66, 349.23, 392, 440, 523.25],
  starlight: [196, 246.94, 293.66, 369.99, 440, 493.88],
  breeze: [174.61, 220, 261.63, 329.63, 349.23, 440],
}

export class AudioSystem {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private step = 0
  muted = false
  volume = .65
  track = 'guqin'
  musicEnabled = true

  constructor(muted = false, volume = .65, track = 'guqin') { this.muted = muted; this.volume = volume; this.track = track }
  private ensure() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume * .55
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }
  unlock() { this.ensure(); if (this.musicEnabled) this.startMusic() }
  setMuted(value: boolean) { this.muted = value; if (this.master) this.master.gain.value = value ? 0 : this.volume * .55 }
  setVolume(value: number) { this.volume = value; if (this.master && !this.muted) this.master.gain.value = value * .55 }
  setTrack(track: string) { this.track = track; this.step = 0; if (this.timer) { this.stopMusic(); this.startMusic() } }
  private tone(freq: number, duration: number, gain: number, type: OscillatorType = 'sine', delay = 0) {
    if (this.muted) return
    const ctx = this.ensure(), t = ctx.currentTime + delay
    const osc = ctx.createOscillator(), amp = this.ctx.createGain()
    osc.type = type; osc.frequency.setValueAtTime(freq, t)
    amp.gain.setValueAtTime(.0001, t); amp.gain.exponentialRampToValueAtTime(gain, t + .012); amp.gain.exponentialRampToValueAtTime(.0001, t + duration)
    osc.connect(amp).connect(this.master!); osc.start(t); osc.stop(t + duration + .03)
  }
  sfx(id: SfxId) {
    if (id === 'stone') { this.tone(180, .055, .24, 'triangle'); this.tone(95, .08, .14, 'sine', .015) }
    if (id === 'capture') { this.tone(160, .13, .2, 'triangle'); this.tone(320, .17, .1, 'sine', .05) }
    if (id === 'success') [523.25,659.25,783.99].forEach((n,i) => this.tone(n,.55,.1,'sine',i*.1))
    if (id === 'fail') { this.tone(190,.28,.13,'triangle'); this.tone(150,.3,.1,'triangle',.12) }
    if (id === 'ui') this.tone(480,.055,.07,'sine')
    if (id === 'achievement') [392,523.25,659.25,1046.5].forEach((n,i) => this.tone(n,.65,.09,'sine',i*.09))
    if (id === 'feed') { this.tone(660,.2,.08); this.tone(880,.3,.07,'sine',.09) }
  }
  startMusic() {
    if (this.timer || this.muted || !this.musicEnabled) return
    this.ensure()
    const play = () => {
      const scale = SCALES[this.track] || SCALES.guqin
      const note = scale[(this.step * 2 + (this.step % 3)) % scale.length]
      this.tone(note, 2.4, .018, this.track === 'starlight' ? 'triangle' : 'sine')
      if (this.step % 4 === 0) this.tone(note / 2, 3.6, .012, 'sine')
      this.step++
    }
    play(); this.timer = setInterval(play, 1800)
  }
  stopMusic() { if (this.timer) clearInterval(this.timer); this.timer = null }
  dispose() { this.stopMusic(); if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close(); this.ctx = null; this.master = null }
}
