// shareUtility.ts
// ----------------
// Cross‑platform file sharing via Capacitor Share plugin (iOS/Android) and Web Share API (PWA/Web)

import { Share as CapacitorShare, type ShareOptions } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

export class ShareUtility {
  /**
   * Share a file blob:
   * - Native (iOS/Android): writes to cache and uses @capacitor/share
   * - Web: tries Web Share API, then falls back to download
   */
  static async shareFile(
    blob: Blob,
    filename: string,
    dialogTitle?: string,
    text?: string,
    url?: string
  ): Promise<void> {
    const isNative = !!(window as unknown as { Capacitor?: unknown }).Capacitor;

    if (isNative) {
      const base64 = await ShareUtility.blobToBase64(blob);
      const path = `${Directory.Cache}/${filename}`;

      await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache });
      const opts: ShareOptions = {
        title: filename,
        text,
        url,
        dialogTitle: dialogTitle || `Share ${filename}`,
        files: [path],
      };
      await CapacitorShare.share(opts);
    } else if (
      navigator.canShare &&
      navigator.canShare({ files: [new File([blob], filename)] })
    ) {
      await navigator.share({
        files: [new File([blob], filename)],
        title: dialogTitle || filename,
        text,
        url,
      });
    } else {
      // fallback download
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(urlObj);
    }
  }

  private static blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
