import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = { userId: user.id };
    if (category) {
      query['article.category'] = category;
    }

    const bookmarks = await Bookmark.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      bookmarks,
      count: bookmarks.length,
    });
  } catch (error) {
    console.error('Fetch bookmarks error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch bookmarks' },
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
    const { article, notes, tags } = body;

    if (!article || !article.url) {
      return NextResponse.json(
        { success: false, message: 'Article data is required' },
        { status: 400 }
      );
    }

    await connectDB();


    const existing = await Bookmark.findOne({
      userId: user.id,
      'article.url': article.url,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Article already bookmarked' },
        { status: 409 }
      );
    }

    const bookmark = await Bookmark.create({
      userId: user.id,
      article,
      notes,
      tags: tags || [],
    });

    return NextResponse.json(
      {
        success: true,
        bookmark,
        message: 'Bookmark created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create bookmark error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create bookmark' },
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

    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get('id');

    if (!bookmarkId) {
      return NextResponse.json(
        { success: false, message: 'Bookmark ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const bookmark = await Bookmark.findOneAndDelete({
      _id: bookmarkId,
      userId: user.id, 
    });

    if (!bookmark) {
      return NextResponse.json(
        { success: false, message: 'Bookmark not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bookmark deleted successfully',
    });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete bookmark' },
      { status: 500 }
    );
  }
}
