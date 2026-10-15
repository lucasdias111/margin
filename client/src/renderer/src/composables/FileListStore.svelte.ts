import type { StoredFile } from '$src/interfaces/StoredFile'

export class FileListStore {
  private _files = $state<StoredFile[]>([])
  private requestToken = 0

  get files(): StoredFile[] {
    return this._files
  }

  reset(): void {
    this.requestToken++
    this._files = []
  }

  async load(fetcher: () => Promise<StoredFile[]>): Promise<void> {
    const token = ++this.requestToken
    const result = await fetcher()
    if (token === this.requestToken) this._files = result
  }

  prepend(file: StoredFile): void {
    this.requestToken++
    this._files = [file, ...this._files]
  }

  remove(fileId: number): void {
    this.requestToken++
    this._files = this._files.filter((f) => f.fileId !== fileId)
  }

  replace(updated: StoredFile): void {
    this.requestToken++
    this._files = this._files.map((f) => (f.fileId === updated.fileId ? updated : f))
  }
}
