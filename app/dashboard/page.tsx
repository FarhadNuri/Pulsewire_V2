'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewsArticle, CATEGORIES } from '@/types';
import { useSession } from '@/lib/auth-client';
import Toast from '@/components/Toast';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [recommendations, setRecommendations] = useState<NewsArticle[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
      return;
    }

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session, isPending, router]);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, prefsRes, bookmarksRes, historyRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/preferences'),
        fetch('/api/bookmarks'),
        fetch('/api/history'),
      ]);

      const analyticsData = await analyticsRes.json();
      const prefsData = await prefsRes.json();
      const bookmarksData = await bookmarksRes.json();
      const historyData = await historyRes.json();

      if (analyticsData.success) setAnalytics(analyticsData.analytics);
      if (prefsData.success) {
        const cats = prefsData.preferences.categories;
        setPreferences(cats);
        fetchRecommendations(cats);
      }
      if (bookmarksData.success) {
        const bookmarkedUrls = new Set<string>(bookmarksData.bookmarks.map((b: any) => b.article.url));
        setBookmarkedArticles(bookmarkedUrls);
      }
      if (historyData.success) {
        const readUrls = new Set<string>(historyData.history.map((h: any) => h.article.url));
        setReadArticles(readUrls);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (categories: string[]) => {
    if (categories.length === 0) {
      setRecommendations([]);
      return;
    }

    setRecommendationsLoading(true);
    try {
      const articlesPerCategory = categories.length <= 3 ? 4 : 2;
      
      const newsPromises = categories.map(async (category) => {
        try {
          const response = await fetch(`/api/news?category=${category}&max=${articlesPerCategory}`);
          const data = await response.json();
          return data.success ? data.articles : [];
        } catch {
          return [];
        }
      });

      const newsArrays = await Promise.all(newsPromises);
      const allNews = newsArrays.flat();
      
      const shuffled = allNews.sort(() => 0.5 - Math.random());
      setRecommendations(shuffled);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setToast({ message: 'Failed to load recommendations', type: 'error' });
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const updatePreferences = async () => {
    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories: preferences }),
      });

      const data = await response.json();
      if (data.success) {
        setToast({ message: 'Preferences updated successfully!', type: 'success' });
        fetchRecommendations(preferences);
      } else {
        setToast({ message: data.message || 'Failed to update preferences', type: 'error' });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setToast({ message: 'An error occurred. Please try again.', type: 'error' });
    }
  };

  const handleArticleClick = (article: NewsArticle) => {
    window.open(article.url, '_blank');
  };

  const handleMarkAsRead = async (e: React.MouseEvent, article: NewsArticle, category: string) => {
    e.stopPropagation(); // Prevent article click

    const isRead = readArticles.has(article.url);

    if (isRead) {
      return;
    }

    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article: {
            title: article.title,
            url: article.url,
            category: category,
            source: article.source.name,
            image: article.image,
            description: article.description,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReadArticles(prev => new Set(prev).add(article.url));
        setToast({ message: 'Marked as read!', type: 'success' });
        
        if (analytics) {
          setAnalytics({
            ...analytics,
            totalReads: analytics.totalReads + 1,
          });
        }
      } else {
        setToast({ message: data.message || 'Failed to mark as read', type: 'error' });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    }
  };

  const handleBookmark = async (e: React.MouseEvent, article: NewsArticle, category: string) => {
    e.stopPropagation();

    const isBookmarked = bookmarkedArticles.has(article.url);

    try {
      if (isBookmarked) {
        setToast({ message: 'Go to Bookmarks page to remove', type: 'info' });
      } else {
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            article: {
              title: article.title,
              url: article.url,
              category: category,
              source: article.source.name,
              image: article.image,
              description: article.description,
            },
          }),
        });

        const data = await response.json();
        if (data.success) {
          setBookmarkedArticles(prev => new Set(prev).add(article.url));
          setToast({ message: 'Article bookmarked!', type: 'success' });
          if (analytics) {
            setAnalytics({
              ...analytics,
              totalBookmarks: analytics.totalBookmarks + 1,
            });
          }
        } else {
          setToast({ message: data.message || 'Failed to bookmark', type: 'error' });
        }
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    }
  };

  const toggleCategory = (categoryId: string) => {
    setPreferences((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <main className="container mx-auto px-4 py-6 md:py-8 flex-1 border-b border-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Dashboard</h1>
            <p className="text-gray-600 text-sm md:text-base">Welcome back, {session.user.name}!</p>
          </div>
        </div>


        {analytics && (
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <p className="text-gray-600 text-xs md:text-sm mb-1">Total Articles Read</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600">{analytics.totalReads}</p>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <p className="text-gray-600 text-xs md:text-sm mb-1">Bookmarks</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600">{analytics.totalBookmarks}</p>
            </div>
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Your Preferences</h2>
          <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">Select categories you're interested in:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`cursor-pointer px-3 md:px-4 py-2 rounded-full font-medium transition-colors text-sm md:text-base ${
                  preferences.includes(cat.id)
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <button
            onClick={updatePreferences}
            className="cursor-pointer w-full md:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm md:text-base"
          >
            Save Preferences
          </button>
        </div>

        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Recommended For You</h2>
          
          {recommendationsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow">
              <div className="spinner mb-4"></div>
              <p className="text-gray-600 text-sm md:text-base">Fetching latest news from your selected categories...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <h3 className="text-lg font-bold text-gray-700 mb-2">No recommendations yet</h3>
              <p className="text-gray-600 text-sm">Select your preferred categories above to get personalized news recommendations</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {recommendations.map((article, index) => (
                <article
                  key={index}
                  className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow relative group"
                >
                  <button
                    onClick={(e) => handleMarkAsRead(e, article, 'recommended')}
                    className={`cursor-pointer absolute top-3 left-3 z-10 p-2 rounded-full shadow-lg transition-all active:scale-95 ${
                      readArticles.has(article.url)
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label={readArticles.has(article.url) ? 'Marked as read' : 'Mark as read'}
                    title={readArticles.has(article.url) ? 'Already read' : 'Mark as read'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={readArticles.has(article.url) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => handleBookmark(e, article, 'recommended')}
                    className={`cursor-pointer absolute top-3 right-3 z-10 p-2 rounded-full shadow-lg transition-all active:scale-95 ${
                      bookmarkedArticles.has(article.url)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label={bookmarkedArticles.has(article.url) ? 'Bookmarked' : 'Add bookmark'}
                    title={bookmarkedArticles.has(article.url) ? 'Bookmarked' : 'Bookmark'}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={bookmarkedArticles.has(article.url) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>

                  <div
                    className="cursor-pointer"
                    onClick={() => handleArticleClick(article)}
                  >
                    <img
                      src={article.image || '/placeholder.jpg'}
                      alt={article.title}
                      className="w-full h-32 md:h-40 object-cover rounded-t-lg"
                    />
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500">{article.source.name}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {analytics && analytics.categoryStats.length > 0 && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow">
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Reading by Category</h2>
            <div className="space-y-3">
              {analytics.categoryStats.map((stat: any) => (
                <div key={stat._id} className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize text-sm md:text-base truncate mr-2">{stat._id}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 md:w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{
                          width: `${(stat.count / analytics.totalReads) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-6 md:w-8 text-right">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
