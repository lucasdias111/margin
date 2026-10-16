export const MIN_PASSWORD_LENGTH = 8

/** What's wrong with a new password and its confirmation, or null when they're fine. */
export function passwordProblem(password: string, repeat: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password !== repeat) return "Passwords don't match."
  return null
}
