export interface VolumeReading {
  _id?: string;
  timestamp: Date;
  volume: number; // in dB
  ambient: number; // in dB
  isActive: boolean;
  noiseType?: string;
  location?: string;
}

export interface VolumeStats {
  avgVolume: number;
  maxVolume: number;
  minVolume: number;
  totalReadings: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface VolumeHistoryData {
  readings: VolumeReading[];
  stats: VolumeStats;
}
