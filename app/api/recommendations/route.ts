import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ReadingHistory from '@/models/ReadingHistory';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const betterAuthUser = await getUserFromRequest(request);
    
    if (!betterAuthUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();


    const user = await User.findOne({ email: betterAuthUser.email }).select('preferences');
    
    if (!user) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        recommendedCategories: ['general'],
        totalArticles: 0,
        insight: 'Set your preferences to get personalized recommendations',
      });
    }


    const history = await ReadingHistory.aggregate([
      { $match: { userId: betterAuthUser.id } },
      { $group: { 
          _id: '$article.category', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);


    const preferredCategories = user.preferences.categories;
    const historyCategories = history.map(h => h._id).filter(Boolean);
    

    const recommendedCategories = [
      ...new Set([...historyCategories, ...preferredCategories])
    ].slice(0, 5);


    const API_KEY = process.env.GNEWS_API_KEY;
    const newsPromises = recommendedCategories.map(async (category) => {
      const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${user.preferences.language}&country=${user.preferences.country}&max=5&apikey=${API_KEY}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        return data.articles || [];
      } catch {
        return [];
      }
    });

    const newsArrays = await Promise.all(newsPromises);
    const allNews = newsArrays.flat();


    const shuffled = allNews.sort(() => 0.5 - Math.random()).slice(0, 15);

    return NextResponse.json({
      success: true,
      recommendations: shuffled,
      recommendedCategories,
      totalArticles: shuffled.length,
      insight: `Based on your reading history (${history.length} categories analyzed) and preferences`,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
