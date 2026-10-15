const MOBILE_BREAKPOINT = 768

class ViewportState {
  width = $state(typeof window !== 'undefined' ? window.innerWidth : 1024)

  get isMobile(): boolean {
    return this.width <= MOBILE_BREAKPOINT
  }

  observe(): () => void {
    if (typeof window === 'undefined') return () => {}

    const onResize = (): void => {
      this.width = window.innerWidth
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }
}

export const viewportState = new ViewportState()
