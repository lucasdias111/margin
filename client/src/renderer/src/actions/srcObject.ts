export function srcObject(
  node: HTMLVideoElement | HTMLAudioElement,
  stream: MediaStream | null
): {
  update(newStream: MediaStream | null): void
  destroy(): void
} {
  node.srcObject = stream

  return {
    update(newStream: MediaStream | null) {
      node.srcObject = newStream
    },
    destroy() {
      node.srcObject = null
    }
  }
}
