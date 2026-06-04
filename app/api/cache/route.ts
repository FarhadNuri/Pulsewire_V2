import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, deleteCachedPattern, deleteCachedData } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const stats = await getCacheStats();

    if (!stats) {
      return NextResponse.json({
        success: false,
        message: 'Redis not available',
        connected: false,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        connected: stats.connected,
        totalKeys: stats.keys,
        memoryUsage: stats.memory,
      },
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern') || 'news:*';
    const key = searchParams.get('key');

    let deletedCount = 0;

    if (key) {
      const success = await deleteCachedData(key);
      deletedCount = success ? 1 : 0;
    } else {
      deletedCount = await deleteCachedPattern(pattern);
    }

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} cache entries`,
      deletedCount,
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
