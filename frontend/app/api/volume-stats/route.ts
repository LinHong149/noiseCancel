import { NextRequest, NextResponse } from 'next/server';
import { getVolumeStats } from '@/lib/volume-history';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const stats = await getVolumeStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching volume stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volume stats' },
      { status: 500 }
    );
  }
}
