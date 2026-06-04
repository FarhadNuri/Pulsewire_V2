import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ReadingHistory from '@/models/ReadingHistory';
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const category = searchParams.get('category');

    const query: any = { userId: user.id };
    if (category) {
      query['article.category'] = category;
    }

    const history = await ReadingHistory.find(query)
      .sort({ readAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error('Fetch history error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reading history' },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { article, readDuration } = body;

    if (!article || !article.url) {
      return NextResponse.json(
        { success: false, message: 'Article data is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const historyEntry = await ReadingHistory.create({
      userId: user.id,
      article,
      readAt: new Date(),
      readDuration,
    });

    return NextResponse.json(
      {
        success: true,
        historyEntry,
        message: 'Added to reading history',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add to history error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add to reading history' },
      { status: 500 }
    );
  }
}


export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const result = await ReadingHistory.deleteMany({ userId: user.id });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} history entries`,
    });
  } catch (error) {
    console.error('Clear history error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear history' },
      { status: 500 }
    );
  }
}
