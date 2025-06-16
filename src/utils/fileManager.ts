import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

export interface PhotoOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
  saveToGallery?: boolean;
  width?: number;
  height?: number;
}

export interface FileUploadOptions {
  url: string;
  headers?: Record<string, string>;
  method?: 'POST' | 'PUT';
  fieldName?: string;
  onProgress?: (progress: number) => void;
}

export interface SavedFile {
  filepath: string;
  webviewPath?: string;
  base64Data?: string;
  format: string;
  saved: boolean;
}

export class FileManager {
  private static readonly PHOTO_STORAGE = 'photos';

  static async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  static async selectPhotoSource(): Promise<Photo | null> {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Web fallback
        return await this.takePhoto({ source: CameraSource.Prompt });
      }

      const actionSheet = await ActionSheet.showActions({
        title: 'Select Photo Source',
        message: 'Choose how you want to select a photo',
        options: [
          {
            title: 'Camera',
            style: ActionSheetButtonStyle.Default,
          },
          {
            title: 'Photo Gallery',
            style: ActionSheetButtonStyle.Default,
          },
          {
            title: 'Cancel',
            style: ActionSheetButtonStyle.Cancel,
          },
        ],
      });

      switch (actionSheet.index) {
        case 0:
          return await this.takePhoto({ source: CameraSource.Camera });
        case 1:
          return await this.selectFromGallery();
        default:
          return null;
      }
    } catch (error) {
      console.error('Photo source selection failed:', error);
      return null;
    }
  }

  static async takePhoto(options: PhotoOptions = {}): Promise<Photo> {
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Camera permissions denied');
      }
    }

    const defaultOptions: PhotoOptions = {
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      saveToGallery: true,
      width: 1920,
      height: 1920
    };

    const photo = await Camera.getPhoto({
      ...defaultOptions,
      ...options
    });

    return photo;
  }

  static async selectFromGallery(options: PhotoOptions = {}): Promise<Photo> {
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Photo permissions denied');
      }
    }

    const defaultOptions: PhotoOptions = {
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos
    };

    const photo = await Camera.getPhoto({
      ...defaultOptions,
      ...options
    });

    return photo;
  }

  static async savePhoto(photo: Photo, fileName?: string): Promise<SavedFile> {
    try {
      const savedFileName = fileName || `photo_${Date.now()}.${photo.format}`;
      
      if (Capacitor.isNativePlatform()) {
        // Native platform - save to filesystem
        const base64Data = await this.readAsBase64(photo);
        
        const savedFile = await Filesystem.writeFile({
          path: `${this.PHOTO_STORAGE}/${savedFileName}`,
          data: base64Data,
          directory: Directory.Data
        });

        return {
          filepath: savedFile.uri,
          webviewPath: Capacitor.convertFileSrc(savedFile.uri),
          base64Data,
          format: photo.format || 'jpeg',
          saved: true
        };
      } else {
        // Web platform - save to localStorage or IndexedDB
        const base64Data = await this.readAsBase64(photo);
        localStorage.setItem(`photo_${savedFileName}`, base64Data);
        
        return {
          filepath: savedFileName,
          webviewPath: photo.webPath,
          base64Data,
          format: photo.format || 'jpeg',
          saved: true
        };
      }
    } catch (error) {
      console.error('Save photo failed:', error);
      throw error;
    }
  }

  static async loadSavedPhotos(): Promise<SavedFile[]> {
    try {
      if (Capacitor.isNativePlatform()) {
        const files = await Filesystem.readdir({
          path: this.PHOTO_STORAGE,
          directory: Directory.Data
        });

        return Promise.all(
          files.files.map(async (file) => {
            const filePath = `${this.PHOTO_STORAGE}/${file.name}`;
            const fileData = await Filesystem.readFile({
              path: filePath,
              directory: Directory.Data
            });

            return {
              filepath: filePath,
              webviewPath: Capacitor.convertFileSrc(filePath),
              base64Data: fileData.data as string,
              format: file.name.split('.').pop() || 'jpeg',
              saved: true
            };
          })
        );
      } else {
        // Web platform - load from localStorage
        const photos: SavedFile[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('photo_')) {
            const base64Data = localStorage.getItem(key);
            if (base64Data) {
              photos.push({
                filepath: key,
                webviewPath: `data:image/jpeg;base64,${base64Data}`,
                base64Data,
                format: 'jpeg',
                saved: true
              });
            }
          }
        }
        return photos;
      }
    } catch (error) {
      console.error('Load saved photos failed:', error);
      return [];
    }
  }

  static async deletePhoto(filepath: string): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Filesystem.deleteFile({
          path: filepath,
          directory: Directory.Data
        });
      } else {
        localStorage.removeItem(filepath);
      }
      return true;
    } catch (error) {
      console.error('Delete photo failed:', error);
      return false;
    }
  }

  static async uploadFile(file: SavedFile, options: FileUploadOptions): Promise<any> {
    try {
      const formData = new FormData();
      
      // Convert base64 to blob
      const base64Response = await fetch(`data:image/${file.format};base64,${file.base64Data}`);
      const blob = await base64Response.blob();
      
      formData.append(options.fieldName || 'file', blob, `upload.${file.format}`);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && options.onProgress) {
            const progress = (event.loaded / event.total) * 100;
            options.onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              resolve(xhr.responseText);
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open(options.method || 'POST', options.url);
        
        // Set headers
        if (options.headers) {
          Object.entries(options.headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        }

        xhr.send(formData);
      });
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  private static async readAsBase64(photo: Photo): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      const file = await Filesystem.readFile({
        path: photo.path!
      });
      return file.data as string;
    } else {
      // Web platform
      if (photo.webPath) {
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      throw new Error('No web path available');
    }
  }

  // File system utilities
  static async createDirectory(path: string): Promise<void> {
    try {
      await Filesystem.mkdir({
        path,
        directory: Directory.Data,
        recursive: true
      });
    } catch (error) {
      console.error('Create directory failed:', error);
      throw error;
    }
  }

  static async writeTextFile(path: string, content: string): Promise<void> {
    try {
      await Filesystem.writeFile({
        path,
        data: content,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
    } catch (error) {
      console.error('Write text file failed:', error);
      throw error;
    }
  }

  static async readTextFile(path: string): Promise<string> {
    try {
      const result = await Filesystem.readFile({
        path,
        directory: Directory.Data,
        encoding: Encoding.UTF8
      });
      return result.data as string;
    } catch (error) {
      console.error('Read text file failed:', error);
      throw error;
    }
  }

  static async getFileInfo(path: string): Promise<any> {
    try {
      return await Filesystem.stat({
        path,
        directory: Directory.Data
      });
    } catch (error) {
      console.error('Get file info failed:', error);
      throw error;
    }
  }
}