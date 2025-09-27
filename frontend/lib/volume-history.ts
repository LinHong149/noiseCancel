import { getDatabase } from './mongodb';
import { VolumeReading, VolumeStats, VolumeHistoryData } from './types';

const COLLECTION_NAME = 'Volume';

export async function addVolumeReading(reading: Omit<VolumeReading, '_id'>): Promise<string> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);
  
  const result = await collection.insertOne({
    ...reading,
    timestamp: new Date(reading.timestamp),
  });
  
  return result.insertedId.toString();
}

export async function getVolumeHistory(
  startDate?: Date,
  endDate?: Date,
  limit: number = 1000
): Promise<VolumeHistoryData> {
  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);
  
  // Build query filter
  const filter: any = {};
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = startDate;
    if (endDate) filter.timestamp.$lte = endDate;
  }
  
  // Get readings
  const readings = await collection
    .find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  // Calculate stats
  const stats = calculateStats(readings);
  
    return {
      readings: readings.map(reading => ({
        _id: reading._id.toString(),
        timestamp: reading.timestamp,
        volume: reading.volume,
        ambient: reading.ambient,
        isActive: reading.isActive,
        noiseType: reading.noiseType,
        location: reading.location,
      })),
      stats,
    };
  } catch (error) {
    console.error('Error in getVolumeHistory:', error);
    throw error;
  }
}

export async function getVolumeStats(
  startDate?: Date,
  endDate?: Date
): Promise<VolumeStats> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);
  
  // Build query filter
  const filter: any = {};
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = startDate;
    if (endDate) filter.timestamp.$lte = endDate;
  }
  
  // Get all readings for stats calculation
  const readings = await collection.find(filter).toArray();
  
  return calculateStats(readings);
}

export async function getRecentVolumeReadings(limit: number = 24): Promise<VolumeReading[]> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);
  
  const readings = await collection
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
  
  return readings.map(reading => ({
    _id: reading._id.toString(),
    timestamp: reading.timestamp,
    volume: reading.volume,
    ambient: reading.ambient,
    isActive: reading.isActive,
    noiseType: reading.noiseType,
    location: reading.location,
  }));
}

export async function deleteOldReadings(olderThanDays: number = 30): Promise<number> {
  const db = await getDatabase();
  const collection = db.collection(COLLECTION_NAME);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const result = await collection.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
}

function calculateStats(readings: any[]): VolumeStats {
  if (readings.length === 0) {
    return {
      avgVolume: 0,
      maxVolume: 0,
      minVolume: 0,
      totalReadings: 0,
      timeRange: {
        start: new Date(),
        end: new Date(),
      },
    };
  }
  
  const volumes = readings.map(r => r.volume);
  const timestamps = readings.map(r => new Date(r.timestamp));
  
  return {
    avgVolume: Math.round(volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length),
    maxVolume: Math.max(...volumes),
    minVolume: Math.min(...volumes),
    totalReadings: readings.length,
    timeRange: {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime()))),
    },
  };
}
