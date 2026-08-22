import '@testing-library/jest-dom/vitest'

if (!Element.prototype.animate) {
  Element.prototype.animate = function (
    _keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions
  ): Animation {
    const duration = typeof options === 'number' ? options : (Number(options?.duration) ?? 0)
    const delay = typeof options === 'number' ? 0 : (options?.delay ?? 0)
    const total = (Number.isFinite(duration) ? duration : 0) + delay

    let onfinish: ((this: Animation, ev: AnimationPlaybackEvent) => void) | null = null
    let finished = false
    let cancelled = false

    const settle = (): void => {
      if (finished || cancelled) return
      finished = true
      animation.playState = 'finished'
      animation.currentTime = total
      onfinish?.call(animation as Animation, {} as AnimationPlaybackEvent)
      resolveFinished(animation as Animation)
    }

    let resolveFinished: (a: Animation) => void = () => {}
    const finishedPromise = new Promise<Animation>((resolve) => {
      resolveFinished = resolve
    })

    const timer = setTimeout(settle, total)

    const animation = {
      currentTime: 0,
      startTime: 0,
      playbackRate: 1,
      playState: 'running' as AnimationPlayState,
      finished: finishedPromise,
      effect: {
        getComputedTiming: () => ({ duration, delay, endTime: total })
      },
      get onfinish() {
        return onfinish
      },
      set onfinish(handler) {
        onfinish = handler
        if (finished) handler?.call(animation as Animation, {} as AnimationPlaybackEvent)
      },
      cancel: () => {
        cancelled = true
        clearTimeout(timer)
        animation.playState = 'idle'
      },
      finish: () => {
        clearTimeout(timer)
        settle()
      },
      pause: () => {
        animation.playState = 'paused'
      },
      play: () => {
        animation.playState = 'running'
      },
      reverse: () => {},
      commitStyles: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    }

    return animation as unknown as Animation
  }
}

if (!Element.prototype.getAnimations) {
  Element.prototype.getAnimations = function (): Animation[] {
    return []
  }
}
