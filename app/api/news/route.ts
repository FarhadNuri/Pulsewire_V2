import { NextRequest, NextResponse } from 'next/server';
import { getCachedData, setCachedData } from '@/lib/redis';

const API_KEY = process.env.GNEWS_API_KEY;

const CACHE_TTL = 21600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    const country = searchParams.get('country') || 'us';
    const lang = searchParams.get('lang') || 'en';
    const max = searchParams.get('max') || '10';

    const cacheKey = `news:${category}:${country}:${lang}:${max}`;

    const cachedData = await getCachedData<{
      totalArticles: number;
      articles: any[];
    }>(cacheKey);

    if (cachedData) {
      console.log(`✅ Cache HIT for ${cacheKey}`);
      return NextResponse.json({
        success: true,
        totalArticles: cachedData.totalArticles,
        articles: cachedData.articles,
        cached: true,
        source: 'redis',
      });
    }

    console.log(`❌ Cache MISS for ${cacheKey} - Fetching from API`);
    
    const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=${lang}&country=${country}&max=${max}&apikey=${API_KEY}`;

    const response = await fetch(url, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();

    const cacheSuccess = await setCachedData(
      cacheKey,
      {
        totalArticles: data.totalArticles,
        articles: data.articles,
      },
      CACHE_TTL
    );

    if (cacheSuccess) {
      console.log(`💾 Cached ${cacheKey} for ${CACHE_TTL / 3600} hours`);
    }

    return NextResponse.json({
      success: true,
      totalArticles: data.totalArticles,
      articles: data.articles,
      cached: false,
      source: 'api',
    });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
