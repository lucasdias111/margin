class Clock {
  private _now = $state(Date.now())

  constructor() {
    setInterval(() => (this._now = Date.now()), 60_000)
  }

  get now(): number {
    return this._now
  }
}

export const clock = new Clock()
