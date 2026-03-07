import { errorState } from '$src/states/ErrorState.svelte'

class ErrorService {
  reportError(errorMessage: string): void {
    errorState.setError(errorMessage)
    setTimeout(() => {
      this.clearError()
    }, 3000)
  }
  clearError(): void {
    errorState.hasError = false
  }
}

export const errorService = new ErrorService()
