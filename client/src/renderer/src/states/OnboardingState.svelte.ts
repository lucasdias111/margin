const STORAGE_PREFIX = 'margin.onboarding.v2:'

type Persisted = {
  completed: string[]
  skippedAll: boolean
}

function storageKey(userId: number): string {
  return `${STORAGE_PREFIX}${userId}`
}

function loadPersisted(userId: number): Persisted {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { completed: [], skippedAll: false }
    const data = JSON.parse(raw) as Partial<Persisted>
    return {
      completed: Array.isArray(data.completed) ? data.completed : [],
      skippedAll: !!data.skippedAll
    }
  } catch {
    return { completed: [], skippedAll: false }
  }
}

class OnboardingState {
  private state = $state<{
    userId: number | null
    activeFlow: string | null
    step: number
    completed: Set<string>
    skippedAll: boolean
  }>({
    userId: null,
    activeFlow: null,
    step: 0,
    completed: new Set(),
    skippedAll: false
  })

  get activeFlow(): string | null {
    return this.state.activeFlow
  }

  get step(): number {
    return this.state.step
  }

  get skippedAll(): boolean {
    return this.state.skippedAll
  }

  loadForUser(userId: number): void {
    if (this.state.userId === userId) return
    const data = loadPersisted(userId)
    this.state.userId = userId
    this.state.completed = new Set(data.completed)
    this.state.skippedAll = data.skippedAll
    this.state.activeFlow = null
    this.state.step = 0
  }

  isCompleted(flowId: string): boolean {
    return this.state.completed.has(flowId)
  }

  startFlow(flowId: string): boolean {
    if (this.state.skippedAll) return false
    if (this.state.activeFlow) return false
    if (this.state.completed.has(flowId)) return false
    this.state.activeFlow = flowId
    this.state.step = 0
    return true
  }

  next(): void {
    this.state.step += 1
  }

  finishFlow(): void {
    if (this.state.activeFlow) {
      this.state.completed.add(this.state.activeFlow)
      this.persist()
    }
    this.state.activeFlow = null
    this.state.step = 0
  }

  skipAll(): void {
    this.state.skippedAll = true
    this.state.activeFlow = null
    this.state.step = 0
    this.persist()
  }

  resetAll(): void {
    this.state.completed = new Set()
    this.state.skippedAll = false
    this.state.activeFlow = null
    this.state.step = 0
    this.persist()
  }

  private persist(): void {
    if (this.state.userId === null) return
    try {
      const data: Persisted = {
        completed: [...this.state.completed],
        skippedAll: this.state.skippedAll
      }
      localStorage.setItem(storageKey(this.state.userId), JSON.stringify(data))
    } catch {
      // local storage unavailable
    }
  }
}

export const onboardingState = new OnboardingState()