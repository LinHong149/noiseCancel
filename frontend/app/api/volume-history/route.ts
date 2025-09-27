import { NextRequest, NextResponse } from 'next/server';
import { addVolumeReading, getVolumeHistory, getVolumeStats } from '@/lib/volume-history';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '1000');
    
    const history = await getVolumeHistory(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      limit
    );
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching volume history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timestamp, volume, ambient, isActive, noiseType, location } = body;
    
    if (!timestamp || volume === undefined || ambient === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: timestamp, volume, ambient' },
        { status: 400 }
      );
    }
    
    const readingId = await addVolumeReading({
      timestamp: new Date(timestamp),
      volume,
      ambient,
      isActive: isActive || false,
      noiseType,
      location,
    });
    
    return NextResponse.json({ id: readingId, success: true });
  } catch (error) {
    console.error('Error adding volume reading:', error);
    return NextResponse.json(
      { error: 'Failed to add volume reading' },
      { status: 500 }
    );
  }
}
