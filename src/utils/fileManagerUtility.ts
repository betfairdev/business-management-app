// fileManagerUtility.ts

import { Capacitor } from '@capacitor/core';
import {
  Filesystem,
  Directory,
  type ReaddirResult,
  type ReadFileResult,
  type WriteFileOptions,
  type DeleteFileOptions,
} from '@capacitor/filesystem';
import { FileViewer } from '@capacitor/file-viewer';
import axios, { type AxiosInstance } from 'axios';

export interface FileEntry {
  name: string;
  uri?: string;       // local URI or remote URL
  size?: number;
  modified?: number;
}

/**
 * FileManagerUtility
 *
 * – Local FS (Capacitor & web)
 *   • pickFile() → File
 *   • saveLocal(file)
 *   • listLocal()
 *   • viewLocal(name)
 *   • deleteLocal(name)
 *
 * – Remote API (via Axios)
 *   • listRemote(endpoint)
 *   • uploadRemote(file or localName, endpoint)
 *   • downloadRemote(name, endpoint)
 *   • viewRemote(name, endpoint)
 *   • deleteRemote(name, endpoint)
 *
 */
export class FileManagerUtility {
  private static apiClient: AxiosInstance;

  /** Must be called once before any remote calls */
  static initApi(baseUrl: string) {
    this.apiClient = axios.create({
      baseURL: baseUrl,
      responseType: 'json',
    });
  }

  // ────────────────
  // LOCAL OPERATIONS
  // ────────────────

  /** Pick a File (browser input or native DocumentPicker) */
  static async pickFile(): Promise<File | null> {
    if (Capacitor.getPlatform() === 'web') {
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = () => resolve(input.files?.[0] ?? null);
        input.click();
      });
    } else {
      // Native: use @capacitor-community/document-picker
      const { DocumentPicker } = await import('@capacitor-community/document-picker');
      const { result } = await DocumentPicker.pick({ multiple: false });
      if (!result.length) return null;

      const doc = result[0];
      // Read as base64
      const read = await Filesystem.readFile({
        path: doc.uri,
        directory: Directory.Data,
        encoding: 'base64',
      });
      const blob = FileManagerUtility.base64ToBlob(read.data, doc.mimeType || '');
      return new File([blob], doc.name, { type: doc.mimeType });
    }
  }

  /** Save a File locally under Directory.Data */
  static async saveLocal(file: File): Promise<void> {
    const base64 = await FileManagerUtility.blobToBase64(file);
    const opts: WriteFileOptions = {
      path: file.name,
      data: base64,
      directory: Directory.Data,
    };
    await Filesystem.writeFile(opts);
  }

  /** List all local files */
  static async listLocal(): Promise<FileEntry[]> {
    const dir: ReaddirResult = await Filesystem.readdir({
      path: '',
      directory: Directory.Data,
    });
    return dir.files.map(name => ({ name }));
  }

  /** Get a URI for a local file (for viewing or downloading in web) */
  private static async getLocalUri(name: string): Promise<string> {
    if (Capacitor.getPlatform() === 'web') {
      const read: ReadFileResult = await Filesystem.readFile({
        path: name,
        directory: Directory.Data,
        encoding: 'base64',
      });
      const mime = FileManagerUtility.getMimeType(name);
      const blob = FileManagerUtility.base64ToBlob(read.data, mime);
      return URL.createObjectURL(blob);
    } else {
      const { uri } = await Filesystem.getUri({
        path: name,
        directory: Directory.Data,
      });
      return uri;
    }
  }

  /** View a local file (opens with native FileViewer or in new tab on web) */
  static async viewLocal(name: string): Promise<void> {
    const uri = await this.getLocalUri(name);
    if (Capacitor.getPlatform() === 'web') {
      window.open(uri, '_blank');
    } else {
      await FileViewer.open({ filePath: uri });
    }
  }

  /** Delete a local file */
  static async deleteLocal(name: string): Promise<void> {
    const opts: DeleteFileOptions = {
      path: name,
      directory: Directory.Data,
    };
    await Filesystem.deleteFile(opts);
  }

  // ────────────────
  // REMOTE OPERATIONS
  // ────────────────

  /** List files from your API: GET /endpoint → [{ name, uri, size?, modified? }, …] */
  static async listRemote(endpoint: string): Promise<FileEntry[]> {
    if (!this.apiClient) throw new Error('API not initialized');
    const resp = await this.apiClient.get<FileEntry[]>(endpoint);
    return resp.data;
  }

  /**
   * Upload:
   *  - if you pass a File instance, it will directly upload that
   *  - if you pass a local filename, it will read from local FS then upload
   */
  static async uploadRemote(
    fileOrName: File | string,
    endpoint: string,
    extraParams?: Record<string,string>
  ): Promise<any> {
    if (!this.apiClient) throw new Error('API not initialized');

    let file: File;
    if (typeof fileOrName === 'string') {
      const read = await Filesystem.readFile({
        path: fileOrName,
        directory: Directory.Data,
        encoding: 'base64'
      });
      const mime = FileManagerUtility.getMimeType(fileOrName);
      file = new File([FileManagerUtility.base64ToBlob(read.data, mime)], fileOrName, { type: mime });
    } else {
      file = fileOrName;
    }

    const form = new FormData();
    form.append('file', file, file.name);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k,v]) => form.append(k,v));
    }

    // adjust headers for multipart
    return this.apiClient.post(endpoint, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  }

  /** Download a remote file as Blob */
  static async downloadRemote(name: string, endpoint: string): Promise<Blob> {
    if (!this.apiClient) throw new Error('API not initialized');
    const resp = await this.apiClient.get<Blob>(`${endpoint}/${encodeURIComponent(name)}`, {
      responseType: 'blob'
    });
    return resp.data;
  }

  /** View a remote file: downloads and then opens */
  static async viewRemote(name: string, endpoint: string): Promise<void> {
    const blob = await this.downloadRemote(name, endpoint);
    const url = URL.createObjectURL(blob);
    if (Capacitor.getPlatform() === 'web') {
      window.open(url, '_blank');
    } else {
      // write to cache then open
      const base64 = await FileManagerUtility.blobToBase64(blob);
      const path = `${Directory.Cache}/${name}`;
      await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache });
      await FileViewer.open({ filePath: path });
    }
  }

  /** Delete a remote file: DELETE /endpoint/{name} */
  static async deleteRemote(name: string, endpoint: string): Promise<any> {
    if (!this.apiClient) throw new Error('API not initialized');
    return this.apiClient.delete(`${endpoint}/${encodeURIComponent(name)}`)
      .then(r => r.data);
  }

  // ────────────────
  // HELPERS
  // ────────────────

  /** Convert Blob to base64 */
  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        res(dataUrl.split(',')[1]);
      };
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  }

  /** Convert base64 to Blob */
  private static base64ToBlob(base64: string, mime: string): Blob {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return new Blob([bytes], { type: mime });
  }

  /** Simple extension → MIME map */
  private static getMimeType(name: string): string {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'pdf': return 'application/pdf';
      case 'txt': return 'text/plain';
      case 'csv': return 'text/csv';
      case 'json': return 'application/json';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'application/octet-stream';
    }
  }
}
