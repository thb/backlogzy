// File System Access API type declarations
interface FileSystemPermissionDescriptor {
  mode?: "read" | "readwrite"
}

interface FileSystemFileHandle {
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
  queryPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>
  requestPermission(descriptor?: FileSystemPermissionDescriptor): Promise<PermissionState>
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
