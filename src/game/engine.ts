export interface GameLoopHooks {
  update: (dt: number) => void;
  render: (alpha: number) => void;
}

export class GameLoop {
  static readonly STEP = 1 / 60;
  private static readonly MAX_FRAME = 0.25;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  constructor(private hooks: GameLoopHooks) {}
  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const frame = (now: number) => {
      if (!this.running) return;
      let delta = (now - this.last) / 1000;
      this.last = now;
      if (delta > GameLoop.MAX_FRAME) delta = GameLoop.MAX_FRAME;
      this.acc += delta;
      while (this.acc >= GameLoop.STEP) {
        this.hooks.update(GameLoop.STEP);
        this.acc -= GameLoop.STEP;
      }
      this.hooks.render(this.acc / GameLoop.STEP);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }
  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
}
