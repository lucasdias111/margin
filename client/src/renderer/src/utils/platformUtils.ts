export const isElectron = (): boolean =>
  typeof window !== 'undefined' && 'secureStorage' in window
