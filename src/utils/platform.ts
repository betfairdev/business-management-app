import { Device, DeviceInfo } from '@capacitor/device';
import { App, AppInfo, AppState } from '@capacitor/app';
import { Network, NetworkStatus, ConnectionType } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface PlatformInfo extends DeviceInfo {
  isNative: boolean;
  isWeb: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  appInfo?: AppInfo;
  networkStatus?: NetworkStatus;
  screenInfo?: ScreenInfo;
  keyboardInfo?: KeyboardInfo;
}

export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  pixelRatio: number;
  orientation: string;
  colorDepth: number;
}

export interface AppStateInfo {
  isActive: boolean;
  url?: string;
  timestamp: number;
}

export interface NetworkInfo extends NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionSpeed?: 'slow' | 'medium' | 'fast';
}

export class PlatformUtil {
  private static instance: PlatformUtil;
  private deviceInfo: DeviceInfo | null = null;
  private appInfo: AppInfo | null = null;
  private networkStatus: NetworkStatus | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private appStateHistory: AppStateInfo[] = [];

  private constructor() {
    this.initializeListeners();
  }

  static getInstance(): PlatformUtil {
    if (!PlatformUtil.instance) {
      PlatformUtil.instance = new PlatformUtil();
    }
    return PlatformUtil.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Get device info
      this.deviceInfo = await Device.getInfo();
      
      // Get app info (native only)
      if (Capacitor.isNativePlatform()) {
        this.appInfo = await App.getInfo();
      }

      // Get network status
      this.networkStatus = await Network.getStatus();

      console.log('✅ Platform utilities initialized');
    } catch (error) {
      console.error('❌ Platform initialization failed:', error);
      throw error;
    }
  }

  private initializeListeners(): void {
    // App state listeners
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', (state: AppState) => {
        const stateInfo: AppStateInfo = {
          isActive: state.isActive,
          timestamp: Date.now()
        };
        this.appStateHistory.push(stateInfo);
        
        // Keep only last 50 state changes
        if (this.appStateHistory.length > 50) {
          this.appStateHistory.shift();
        }

        this.emit('appStateChange', stateInfo);
      });

      App.addListener('appUrlOpen', (data) => {
        this.emit('appUrlOpen', data);
      });

      App.addListener('appRestoredResult', (data) => {
        this.emit('appRestoredResult', data);
      });
    }

    // Network listeners
    Network.addListener('networkStatusChange', (status: NetworkStatus) => {
      this.networkStatus = status;
      const networkInfo: NetworkInfo = {
        ...status,
        isOnline: status.connected,
        isOffline: !status.connected,
        connectionSpeed: this.getConnectionSpeed(status.connectionType)
      };
      this.emit('networkStatusChange', networkInfo);
    });

    // Keyboard listeners (native only)
    if (Capacitor.isNativePlatform()) {
      Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
        this.emit('keyboardWillShow', info);
      });

      Keyboard.addListener('keyboardDidShow', (info: KeyboardInfo) => {
        this.emit('keyboardDidShow', info);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        this.emit('keyboardWillHide');
      });

      Keyboard.addListener('keyboardDidHide', () => {
        this.emit('keyboardDidHide');
      });
    }

    // Web-specific listeners
    if (!Capacitor.isNativePlatform()) {
      window.addEventListener('online', () => {
        this.emit('networkStatusChange', { connected: true, connectionType: ConnectionType.Wifi });
      });

      window.addEventListener('offline', () => {
        this.emit('networkStatusChange', { connected: false, connectionType: ConnectionType.None });
      });

      window.addEventListener('resize', () => {
        this.emit('screenResize', this.getScreenInfo());
      });

      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.emit('orientationChange', this.getScreenInfo());
        }, 100);
      });
    }
  }

  // Platform detection
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  isWeb(): boolean {
    return !Capacitor.isNativePlatform();
  }

  isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  getPlatform(): string {
    return Capacitor.getPlatform();
  }

  // Device information
  async getDeviceInfo(): Promise<DeviceInfo> {
    if (!this.deviceInfo) {
      this.deviceInfo = await Device.getInfo();
    }
    return this.deviceInfo;
  }

  async getAppInfo(): Promise<AppInfo | null> {
    if (!this.appInfo && Capacitor.isNativePlatform()) {
      this.appInfo = await App.getInfo();
    }
    return this.appInfo;
  }

  async getPlatformInfo(): Promise<PlatformInfo> {
    const deviceInfo = await this.getDeviceInfo();
    const appInfo = await this.getAppInfo();
    const networkStatus = await this.getNetworkStatus();

    return {
      ...deviceInfo,
      isNative: this.isNative(),
      isWeb: this.isWeb(),
      isIOS: this.isIOS(),
      isAndroid: this.isAndroid(),
      appInfo: appInfo || undefined,
      networkStatus: networkStatus || undefined,
      screenInfo: this.getScreenInfo(),
      keyboardInfo: undefined // Will be populated when keyboard events occur
    };
  }

  // Network information
  async getNetworkStatus(): Promise<NetworkStatus> {
    if (!this.networkStatus) {
      this.networkStatus = await Network.getStatus();
    }
    return this.networkStatus;
  }

  async isOnline(): Promise<boolean> {
    const status = await this.getNetworkStatus();
    return status.connected;
  }

  async isOffline(): Promise<boolean> {
    return !(await this.isOnline());
  }

  private getConnectionSpeed(connectionType: ConnectionType): 'slow' | 'medium' | 'fast' {
    switch (connectionType) {
      case ConnectionType.Cellular:
        return 'medium';
      case ConnectionType.Wifi:
        return 'fast';
      case ConnectionType.None:
        return 'slow';
      default:
        return 'medium';
    }
  }

  // Screen information
  getScreenInfo(): ScreenInfo {
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: this.getOrientation(),
      colorDepth: window.screen.colorDepth
    };
  }

  getOrientation(): string {
    if (window.screen && 'orientation' in window.screen) {
      return (window.screen.orientation as any).type;
    }
    
    // Fallback
    if (window.innerHeight > window.innerWidth) {
      return 'portrait-primary';
    } else {
      return 'landscape-primary';
    }
  }

  isPortrait(): boolean {
    return window.innerHeight > window.innerWidth;
  }

  isLandscape(): boolean {
    return !this.isPortrait();
  }

  // App state management
  getAppStateHistory(): AppStateInfo[] {
    return [...this.appStateHistory];
  }

  getLastAppState(): AppStateInfo | null {
    return this.appStateHistory.length > 0 ? this.appStateHistory[this.appStateHistory.length - 1] : null;
  }

  async exitApp(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await App.exitApp();
    } else {
      window.close();
    }
  }

  async minimizeApp(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await App.minimizeApp();
    }
  }

  // Status bar control (iOS/Android only)
  async setStatusBarStyle(style: 'light' | 'dark'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setStyle({
        style: style === 'light' ? Style.Light : Style.Dark
      });
    }
  }

  async hideStatusBar(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.hide();
    }
  }

  async showStatusBar(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.show();
    }
  }

  async setStatusBarBackgroundColor(color: string): Promise<void> {
    if (this.isAndroid()) {
      await StatusBar.setBackgroundColor({ color });
    }
  }

  // Keyboard control
  async showKeyboard(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.show();
    }
  }

  async hideKeyboard(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Keyboard.hide();
    }
  }

  async setKeyboardAccessoryBarVisible(visible: boolean): Promise<void> {
    if (this.isIOS()) {
      await Keyboard.setAccessoryBarVisible({ isVisible: visible });
    }
  }

  async setKeyboardStyle(style: 'light' | 'dark'): Promise<void> {
    if (this.isIOS()) {
      await Keyboard.setStyle({
        style: style === 'light' ? 'LIGHT' : 'DARK'
      });
    }
  }

  // Device capabilities
  async getDeviceCapabilities(): Promise<{
    hasCamera: boolean;
    hasGPS: boolean;
    hasBiometric: boolean;
    hasNFC: boolean;
    hasAccelerometer: boolean;
    hasGyroscope: boolean;
    hasCompass: boolean;
    hasVibration: boolean;
  }> {
    const capabilities = {
      hasCamera: false,
      hasGPS: false,
      hasBiometric: false,
      hasNFC: false,
      hasAccelerometer: false,
      hasGyroscope: false,
      hasCompass: false,
      hasVibration: false
    };

    if (this.isWeb()) {
      // Web capabilities detection
      capabilities.hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      capabilities.hasGPS = !!navigator.geolocation;
      capabilities.hasVibration = !!navigator.vibrate;
      capabilities.hasAccelerometer = !!(window as any).DeviceMotionEvent;
      capabilities.hasGyroscope = !!(window as any).DeviceOrientationEvent;
    } else {
      // Native platforms typically have most capabilities
      capabilities.hasCamera = true;
      capabilities.hasGPS = true;
      capabilities.hasVibration = true;
      capabilities.hasAccelerometer = true;
      capabilities.hasGyroscope = true;
      capabilities.hasCompass = true;
      
      if (this.isAndroid()) {
        capabilities.hasNFC = true;
      }
      
      if (this.isIOS()) {
        capabilities.hasBiometric = true;
      }
    }

    return capabilities;
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    memoryUsage?: number;
    batteryLevel?: number;
    isLowPowerMode?: boolean;
    connectionType: string;
    screenSize: string;
    pixelRatio: number;
  } {
    const screenInfo = this.getScreenInfo();
    
    return {
      memoryUsage: (performance as any).memory?.usedJSHeapSize,
      connectionType: this.networkStatus?.connectionType || 'unknown',
      screenSize: `${screenInfo.width}x${screenInfo.height}`,
      pixelRatio: screenInfo.pixelRatio
    };
  }

  // Device fingerprinting (for analytics)
  async getDeviceFingerprint(): Promise<string> {
    const deviceInfo = await this.getDeviceInfo();
    const screenInfo = this.getScreenInfo();
    
    const fingerprint = [
      deviceInfo.platform,
      deviceInfo.model,
      deviceInfo.operatingSystem,
      deviceInfo.osVersion,
      screenInfo.width,
      screenInfo.height,
      screenInfo.pixelRatio,
      navigator.language,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}