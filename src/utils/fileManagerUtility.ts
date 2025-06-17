import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

export interface FileInfo {
  name: string;
  path: string;
  uri?: string;
  size?: number;
  modificationTime?: number;
}

export interface FilterOptions {
  fromDate?: Date;
  toDate?: Date;
  extensions?: string[]; // e.g. ['.txt', '.jpg']
}

export class FileManager {
  private directory: Directory;

  constructor(directory: Directory = Directory.Documents) {
    this.directory = directory;
  }

  /**
   * Upload or store a file
   * @param path relative path including file name, e.g. 'folder/file.txt'
   * @param data base64 encoded string
   * @param encoding Defaults to UTF8
   */
  async upload(path: string, data: string, encoding: Encoding = Encoding.UTF8): Promise<FileInfo> {
    await Filesystem.writeFile({
      path,
      data,
      directory: this.directory,
      encoding,
    });
    return this.getInfo(path);
  }

  /**
   * Remove a file
   * @param path relative path including file name
   */
  async remove(path: string): Promise<void> {
    await Filesystem.deleteFile({
      path,
      directory: this.directory,
    });
  }

  /**
   * Get file information
   */
  async getInfo(path: string): Promise<FileInfo> {
    const stat = await Filesystem.stat({
      path,
      directory: this.directory,
    });
    return {
      name: stat.name,
      path: stat.uri,
      uri: stat.uri,
      size: stat.size,
      modificationTime: stat.mtime,
    };
  }

  /**
   * List files in a directory
   * @param path relative folder path, e.g. 'folder'
   */
  async list(path: string = ''): Promise<FileInfo[]> {
    const result = await Filesystem.readdir({
      path,
      directory: this.directory,
    });
    // stat each entry
    const infos = await Promise.all(
      result.files.map(async name => {
        const filePath: string = typeof name === 'string' ? (path ? `${path}/${name}` : name) : name.name;
        return this.getInfo(filePath);
      })
    );
    return infos;
  }

  /**
   * Filter files by date range and/or extension
   */
  async filter(path: string = '', opts: FilterOptions): Promise<FileInfo[]> {
    const list = await this.list(path);
    return list.filter(info => {
      let ok = true;
      if (opts.fromDate) {
        ok = ok && info.modificationTime! >= opts.fromDate.getTime();
      }
      if (opts.toDate) {
        ok = ok && info.modificationTime! <= opts.toDate.getTime();
      }
      if (opts.extensions && opts.extensions.length) {
        ok = ok && opts.extensions!.some(ext => info.name.endsWith(ext));
      }
      return ok;
    });
  }

  /**
   * Search files by name substring
   */
  async search(path: string = '', query: string): Promise<FileInfo[]> {
    const list = await this.list(path);
    const lower = query.toLowerCase();
    return list.filter(info => info.name.toLowerCase().includes(lower));
  }
}
