export class AudioMonitor {
  private static instance: AudioMonitor;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isMonitoring = false;
  private animationFrame: number | null = null;
  private onVolumeUpdate: ((volume: number) => void) | null = null;

  static getInstance(): AudioMonitor {
    if (!AudioMonitor.instance) {
      AudioMonitor.instance = new AudioMonitor();
    }
    return AudioMonitor.instance;
  }

  async startMonitoring(onVolumeUpdate: (volume: number) => void): Promise<boolean> {
    try {
      this.onVolumeUpdate = onVolumeUpdate;
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);

      // Configure analyser
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Connect microphone to analyser
      this.microphone.connect(this.analyser);

      this.isMonitoring = true;
      this.startVolumeAnalysis();
      
      return true;
    } catch (error) {
      console.error('Error starting audio monitoring:', error);
      return false;
    }
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.microphone = null;
    this.onVolumeUpdate = null;
  }

  private startVolumeAnalysis(): void {
    if (!this.analyser || !this.isMonitoring) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!this.analyser || !this.isMonitoring) return;

      this.analyser.getByteFrequencyData(dataArray);
      
      // Calculate RMS (Root Mean Square) for volume level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      
      // Convert to percentage (0-100)
      const volume = Math.min(100, (rms / 128) * 100);
      
      if (this.onVolumeUpdate) {
        this.onVolumeUpdate(volume);
      }

      this.animationFrame = requestAnimationFrame(analyze);
    };

    analyze();
  }

  getVolumeLevel(): number {
    if (!this.analyser) return 0;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength);
    return Math.min(100, (rms / 128) * 100);
  }
}
