import { describe, expect, it } from 'vitest'
import { FileListStore } from '$src/composables/FileListStore.svelte'
import type { StoredFile } from '$src/interfaces/StoredFile'

function file(fileId: number, fileName = `file-${fileId}`): StoredFile {
  return { fileId, fileName } as StoredFile
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe('FileListStore', () => {
  it('applies a load result when nothing newer happened', async () => {
    const store = new FileListStore()

    await store.load(async () => [file(1), file(2)])

    expect(store.files.map((f) => f.fileId)).toEqual([1, 2])
  })

  it('discards a stale load that resolves after an optimistic prepend', async () => {
    const store = new FileListStore()
    const initial = deferred<StoredFile[]>()

    const loadPromise = store.load(() => initial.promise)
    store.prepend(file(99))
    initial.resolve([file(1), file(2)])
    await loadPromise

    expect(store.files.map((f) => f.fileId)).toEqual([99])
  })

  it('keeps only the newest load when two loads overlap', async () => {
    const store = new FileListStore()
    const first = deferred<StoredFile[]>()

    const firstLoad = store.load(() => first.promise)
    await store.load(async () => [file(2)])
    first.resolve([file(1)])
    await firstLoad

    expect(store.files.map((f) => f.fileId)).toEqual([2])
  })

  it('reset clears the list and invalidates an in-flight load', async () => {
    const store = new FileListStore()
    const initial = deferred<StoredFile[]>()

    const loadPromise = store.load(() => initial.promise)
    store.reset()
    initial.resolve([file(1)])
    await loadPromise

    expect(store.files).toEqual([])
  })

  it('prepend adds the file to the front', async () => {
    const store = new FileListStore()
    await store.load(async () => [file(1)])

    store.prepend(file(2))

    expect(store.files.map((f) => f.fileId)).toEqual([2, 1])
  })

  it('remove drops the file with the given id', async () => {
    const store = new FileListStore()
    await store.load(async () => [file(1), file(2)])

    store.remove(1)

    expect(store.files.map((f) => f.fileId)).toEqual([2])
  })

  it('replace swaps the matching file in place', async () => {
    const store = new FileListStore()
    await store.load(async () => [file(1, 'old'), file(2)])

    store.replace(file(1, 'renamed'))

    expect(store.files.find((f) => f.fileId === 1)?.fileName).toBe('renamed')
    expect(store.files.map((f) => f.fileId)).toEqual([1, 2])
  })
})
