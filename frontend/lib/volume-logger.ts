import { VolumeReading } from './types';

export class VolumeLogger {
  private static instance: VolumeLogger;
  private isLogging = false;
  private logInterval: NodeJS.Timeout | null = null;
  private currentVolume = 0;
  private currentAmbient = 0;
  private isActive = false;

  static getInstance(): VolumeLogger {
    if (!VolumeLogger.instance) {
      VolumeLogger.instance = new VolumeLogger();
    }
    return VolumeLogger.instance;
  }

  startLogging(): void {
    if (this.isLogging) return;
    
    this.isLogging = true;
    
    // Check every minute if the minute is divisible by 5
    this.logInterval = setInterval(() => {
      const now = new Date();
      const minutes = now.getMinutes();
      
      // Only log when minutes % 5 === 0 (0, 5, 10, 15, 20, etc.)
      if (minutes % 5 === 0) {
        this.logVolumeReading();
      }
    }, 60000); // Check every minute (60000ms)
  }

  stopLogging(): void {
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }
    this.isLogging = false;
  }

  updateVolume(volume: number, ambient: number, isActive: boolean): void {
    this.currentVolume = volume;
    this.currentAmbient = ambient;
    this.isActive = isActive;
  }

  private async logVolumeReading(): Promise<void> {
    try {
      const reading: Omit<VolumeReading, '_id'> = {
        timestamp: new Date(),
        volume: this.currentVolume,
        ambient: this.currentAmbient,
        isActive: this.isActive,
        noiseType: this.getNoiseType(this.currentVolume),
        location: 'default', // You can make this configurable
      };

      const response = await fetch('/api/volume-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reading),
      });

      if (!response.ok) {
        console.error('Failed to log volume reading:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging volume reading:', error);
    }
  }

  private getNoiseType(volume: number): string {
    if (volume < 30) return 'Quiet';
    if (volume < 50) return 'Low';
    if (volume < 70) return 'Medium';
    if (volume < 90) return 'High';
    return 'Very High';
  }

  // Manual logging method for immediate recording
  async logImmediate(volume: number, ambient: number, isActive: boolean, noiseType?: string): Promise<void> {
    try {
      const reading: Omit<VolumeReading, '_id'> = {
        timestamp: new Date(),
        volume,
        ambient,
        isActive,
        noiseType: noiseType || this.getNoiseType(volume),
        location: 'default',
      };

      const response = await fetch('/api/volume-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reading),
      });

      if (!response.ok) {
        console.error('Failed to log immediate volume reading:', response.statusText);
      }
    } catch (error) {
      console.error('Error logging immediate volume reading:', error);
    }
  }
}
