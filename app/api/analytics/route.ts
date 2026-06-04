
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ReadingHistory from '@/models/ReadingHistory';
import Bookmark from '@/models/Bookmark';
import { getUserFromRequest } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const totalReads = await ReadingHistory.countDocuments({ userId: user.id });
    
    const categoryStats = await ReadingHistory.aggregate([
      { $match: { userId: user.id } },
      { $group: { 
          _id: '$article.category', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);


    const totalBookmarks = await Bookmark.countDocuments({ userId: user.id });

    return NextResponse.json({
      success: true,
      analytics: {
        totalReads,
        totalBookmarks,
        categoryStats,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
