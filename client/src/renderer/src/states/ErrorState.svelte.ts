export class ErrorStateSvelte {
  hasError: boolean = $state<boolean>(false)
  errorMessage: string = $state<string>('')

  setError(errorMessage: string): void {
    this.hasError = true
    this.errorMessage = errorMessage
  }
}

export const errorState = new ErrorStateSvelte()
