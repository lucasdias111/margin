const KEY = 'margin.onboarding.v2'

type Stored = { completed: string[]; skippedAll: boolean }

function load(): Stored {
  const raw = localStorage.getItem(KEY)
  if (!raw) return { completed: [], skippedAll: false }
  try {
    const data = JSON.parse(raw)
    return { completed: data.completed ?? [], skippedAll: !!data.skippedAll }
  } catch {
    return { completed: [], skippedAll: false }
  }
}

function save(data: Stored): void {
  localStorage.setItem(KEY, JSON.stringify(data))
}

let activeFlow = $state<string | null>(null)
let step = $state(0)

export const onboardingState = {
  get activeFlow() {
    return activeFlow
  },
  get step() {
    return step
  },
  get skippedAll() {
    return load().skippedAll
  },
  isCompleted(id: string): boolean {
    return load().completed.includes(id)
  },
  startFlow(id: string): boolean {
    const data = load()
    if (data.skippedAll) return false
    if (activeFlow) return false
    if (data.completed.includes(id)) return false
    activeFlow = id
    step = 0
    return true
  },
  next(): void {
    step += 1
  },
  finishFlow(): void {
    const id = activeFlow
    activeFlow = null
    step = 0
    if (!id) return
    const data = load()
    if (!data.completed.includes(id)) {
      data.completed.push(id)
      save(data)
    }
  },
  skipAll(): void {
    activeFlow = null
    step = 0
    const data = load()
    data.skippedAll = true
    save(data)
  }
}