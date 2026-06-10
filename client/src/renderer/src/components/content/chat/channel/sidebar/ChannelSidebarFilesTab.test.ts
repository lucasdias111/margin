import { render, screen, waitFor } from '@testing-library/svelte'
import { fireEvent } from '@testing-library/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChannelSidebarFilesTab from './ChannelSidebarFilesTab.svelte'
import { fileStorageService } from '$src/services/FileStorageService'
import type { StoredFile } from '$src/interfaces/StoredFile'
import type { Channel } from '$src/interfaces/Channel'

vi.mock('$src/services/FileStorageService', () => ({
  fileStorageService: {
    getChannelFiles: vi.fn(),
    uploadChannelFile: vi.fn()
  }
}))

function storedFile(fileId: number, fileName: string): StoredFile {
  return { fileId, fileName, sizeBytes: 10, uploadedBy: { id: 1 } } as StoredFile
}

function channel(): Channel {
  return { id: 1, conversationId: 20 } as Channel
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

function setInputFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', { value: files, configurable: true })
}

describe('ChannelSidebarFilesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders files returned by the initial load', async () => {
    vi.mocked(fileStorageService.getChannelFiles).mockResolvedValue([storedFile(1, 'report.pdf')])

    render(ChannelSidebarFilesTab, { props: { channel: channel(), fileCount: 0 } })

    expect(await screen.findByText('report.pdf')).toBeInTheDocument()
  })

  it('keeps an uploaded file when the initial load resolves afterwards', async () => {
    const initialLoad = deferred<StoredFile[]>()
    vi.mocked(fileStorageService.getChannelFiles).mockReturnValue(initialLoad.promise)
    vi.mocked(fileStorageService.uploadChannelFile).mockResolvedValue(storedFile(99, 'uploaded.png'))

    const { container } = render(ChannelSidebarFilesTab, {
      props: { channel: channel(), fileCount: 0 }
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    setInputFiles(input, [new File(['x'], 'uploaded.png', { type: 'image/png' })])
    await fireEvent.change(input)
    expect(await screen.findByText('uploaded.png')).toBeInTheDocument()

    initialLoad.resolve([storedFile(1, 'report.pdf')])
    await waitFor(() => expect(screen.queryByText('report.pdf')).not.toBeInTheDocument())
    expect(screen.getByText('uploaded.png')).toBeInTheDocument()
  })
})
