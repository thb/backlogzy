// File System Access API type declarations
interface FileSystemFileHandle {
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
}

interface FilePickerOptions {
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  startIn?: string
  suggestedName?: string
}

interface Window {
  showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle>
}
