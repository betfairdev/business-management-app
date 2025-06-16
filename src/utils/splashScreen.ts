import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

export interface SplashScreenConfig {
  showDuration?: number;
  fadeOutDuration?: number;
  autoHide?: boolean;
  backgroundColor?: string;
  showSpinner?: boolean;
  spinnerColor?: string;
}

export interface WebSplashConfig extends SplashScreenConfig {
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  customHTML?: string;
  customCSS?: string;
}

export class SplashScreenManager {
  private static instance: SplashScreenManager;
  private config: SplashScreenConfig;
  private webSplashElement: HTMLElement | null = null;
  private isShowing = false;

  private constructor(config: SplashScreenConfig = {}) {
    this.config = {
      showDuration: 3000,
      fadeOutDuration: 500,
      autoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
      spinnerColor: '#000000',
      ...config
    };
  }

  static getInstance(config?: SplashScreenConfig): SplashScreenManager {
    if (!SplashScreenManager.instance) {
      SplashScreenManager.instance = new SplashScreenManager(config);
    }
    return SplashScreenManager.instance;
  }

  async show(config?: Partial<SplashScreenConfig>): Promise<void> {
    const finalConfig = { ...this.config, ...config };

    try {
      if (Capacitor.isNativePlatform()) {
        await this.showNativeSplash(finalConfig);
      } else {
        await this.showWebSplash(finalConfig as WebSplashConfig);
      }

      this.isShowing = true;

      // Auto hide if configured
      if (finalConfig.autoHide && finalConfig.showDuration) {
        setTimeout(() => {
          this.hide();
        }, finalConfig.showDuration);
      }
    } catch (error) {
      console.error('Show splash screen failed:', error);
      throw error;
    }
  }

  async hide(fadeOut = true): Promise<void> {
    if (!this.isShowing) return;

    try {
      if (Capacitor.isNativePlatform()) {
        await SplashScreen.hide({
          fadeOutDuration: fadeOut ? this.config.fadeOutDuration : 0
        });
      } else {
        await this.hideWebSplash(fadeOut);
      }

      this.isShowing = false;
    } catch (error) {
      console.error('Hide splash screen failed:', error);
      throw error;
    }
  }

  private async showNativeSplash(config: SplashScreenConfig): Promise<void> {
    // Native splash screen is typically shown automatically
    // We can configure it but showing is handled by the system
    await SplashScreen.show({
      showDuration: config.showDuration,
      fadeInDuration: 200,
      fadeOutDuration: config.fadeOutDuration,
      autoHide: config.autoHide
    });
  }

  private async showWebSplash(config: WebSplashConfig): Promise<void> {
    // Remove existing splash if any
    if (this.webSplashElement) {
      this.webSplashElement.remove();
    }

    // Create splash screen element
    this.webSplashElement = document.createElement('div');
    this.webSplashElement.id = 'capacitor-splash-screen';
    
    // Apply styles
    this.webSplashElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: ${config.backgroundColor || '#ffffff'};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    `;

    // Add content
    if (config.customHTML) {
      this.webSplashElement.innerHTML = config.customHTML;
    } else {
      this.webSplashElement.innerHTML = this.getDefaultSplashHTML(config);
    }

    // Add custom CSS if provided
    if (config.customCSS) {
      const style = document.createElement('style');
      style.textContent = config.customCSS;
      document.head.appendChild(style);
    }

    // Add to DOM
    document.body.appendChild(this.webSplashElement);

    // Fade in
    requestAnimationFrame(() => {
      if (this.webSplashElement) {
        this.webSplashElement.style.opacity = '1';
      }
    });
  }

  private async hideWebSplash(fadeOut: boolean): Promise<void> {
    if (!this.webSplashElement) return;

    if (fadeOut) {
      // Fade out animation
      this.webSplashElement.style.opacity = '0';
      
      // Wait for animation to complete
      await new Promise(resolve => {
        setTimeout(resolve, this.config.fadeOutDuration || 500);
      });
    }

    // Remove from DOM
    this.webSplashElement.remove();
    this.webSplashElement = null;
  }

  private getDefaultSplashHTML(config: WebSplashConfig): string {
    const logoHTML = config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" style="max-width: 200px; max-height: 200px; margin-bottom: 20px;">` : '';
    const titleHTML = config.title ? `<h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 300; color: #333;">${config.title}</h1>` : '';
    const subtitleHTML = config.subtitle ? `<p style="margin: 0 0 30px 0; font-size: 16px; color: #666;">${config.subtitle}</p>` : '';
    const spinnerHTML = config.showSpinner ? this.getSpinnerHTML(config.spinnerColor || '#000000') : '';

    return `
      ${logoHTML}
      ${titleHTML}
      ${subtitleHTML}
      ${spinnerHTML}
    `;
  }

  private getSpinnerHTML(color: string): string {
    return `
      <div style="
        width: 40px;
        height: 40px;
        border: 3px solid rgba(${this.hexToRgb(color)}, 0.3);
        border-top: 3px solid ${color};
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0, 0, 0';
    
    return [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ].join(', ');
  }

  // Utility methods
  isVisible(): boolean {
    return this.isShowing;
  }

  updateConfig(config: Partial<SplashScreenConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SplashScreenConfig {
    return { ...this.config };
  }

  // Preset configurations
  static createMinimalConfig(): SplashScreenConfig {
    return {
      showDuration: 1500,
      fadeOutDuration: 300,
      autoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false
    };
  }

  static createBrandedConfig(options: {
    backgroundColor: string;
    logoUrl?: string;
    title?: string;
    showSpinner?: boolean;
  }): WebSplashConfig {
    return {
      showDuration: 3000,
      fadeOutDuration: 500,
      autoHide: true,
      backgroundColor: options.backgroundColor,
      logoUrl: options.logoUrl,
      title: options.title,
      showSpinner: options.showSpinner || false,
      spinnerColor: '#666666'
    };
  }

  static createLoadingConfig(): SplashScreenConfig {
    return {
      showDuration: 0, // Manual hide
      fadeOutDuration: 300,
      autoHide: false,
      backgroundColor: '#f8f9fa',
      showSpinner: true,
      spinnerColor: '#007bff'
    };
  }

  // Advanced features
  async showWithProgress(steps: string[], stepDuration = 1000): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      await this.showProgressSplash(steps, stepDuration);
    } else {
      // For native, just show regular splash
      await this.show({ autoHide: false });
    }
  }

  private async showProgressSplash(steps: string[], stepDuration: number): Promise<void> {
    const config: WebSplashConfig = {
      ...this.config,
      autoHide: false,
      customHTML: `
        <div style="text-align: center;">
          <div id="splash-logo" style="margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; border: 3px solid #ddd; border-top: 3px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          </div>
          <div id="splash-progress" style="margin-bottom: 20px;">
            <div style="width: 200px; height: 4px; background: #ddd; border-radius: 2px; margin: 0 auto; overflow: hidden;">
              <div id="progress-bar" style="width: 0%; height: 100%; background: #007bff; transition: width 0.3s ease;"></div>
            </div>
          </div>
          <div id="splash-step" style="font-size: 14px; color: #666;">Initializing...</div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `
    };

    await this.showWebSplash(config);

    // Animate through steps
    for (let i = 0; i < steps.length; i++) {
      const stepElement = document.getElementById('splash-step');
      const progressBar = document.getElementById('progress-bar');
      
      if (stepElement) {
        stepElement.textContent = steps[i];
      }
      
      if (progressBar) {
        const progress = ((i + 1) / steps.length) * 100;
        progressBar.style.width = `${progress}%`;
      }

      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }

    // Auto hide after completion
    setTimeout(() => {
      this.hide();
    }, 500);
  }
}