import '@testing-library/jest-dom/vitest'

if (!Element.prototype.animate) {
  Element.prototype.animate = function (): Animation {
    return {
      finished: Promise.resolve(),
      cancel: () => {},
      finish: () => {},
      pause: () => {},
      play: () => {},
      onfinish: null
    } as unknown as Animation
  }
}
