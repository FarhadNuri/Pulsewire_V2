'use client';

import { useEffect, useState } from 'react';
import { NewsArticle, CATEGORIES } from '@/types';
import { useSession } from '@/lib/auth-client';
import Toast from '@/components/Toast';

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('general');
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const { data: session } = useSession();

  useEffect(() => {
    fetchNews(category);
    if (session?.user) {
      fetchBookmarks();
      fetchReadHistory();
    }
  }, [category, session]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks');
      const data = await response.json();
      if (data.success) {
        const bookmarkedUrls = new Set<string>(data.bookmarks.map((b: any) => b.article.url));
        setBookmarkedArticles(bookmarkedUrls);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchReadHistory = async () => {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      if (data.success) {
        const readUrls = new Set<string>(data.history.map((h: any) => h.article.url));
        setReadArticles(readUrls);
      }
    } catch (error) {
      console.error('Error fetching read history:', error);
    }
  };

  const fetchNews = async (cat: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news?category=${cat}&max=12`);
      const data = await response.json();
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = (article: NewsArticle) => {
    window.open(article.url, '_blank');
  };

  const handleMarkAsRead = async (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation(); 

    if (!session?.user) {
      setToast({ message: 'Please login to track reading history', type: 'info' });
      return;
    }

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
      } else {
        setToast({ message: data.message || 'Failed to mark as read', type: 'error' });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    }
  };

  const handleBookmark = async (e: React.MouseEvent, article: NewsArticle) => {
    e.stopPropagation(); // Prevent article click

    if (!session?.user) {
      setToast({ message: 'Please login to bookmark articles', type: 'info' });
      return;
    }

    const isBookmarked = bookmarkedArticles.has(article.url);

    try {
      if (isBookmarked) {
        setToast({ message: 'Removing bookmark...', type: 'info' });
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
        } else {
          setToast({ message: data.message || 'Failed to bookmark', type: 'error' });
        }
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    }
  };

  return (
    <>
      <div className="bg-gray-50 border-b border-b-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 md:py-4 scrollbar-hide snap-x snap-mandatory">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`cursor-pointer px-4 md:px-6 py-2 rounded-full whitespace-nowrap font-medium transition-colors text-sm md:text-base snap-start ${
                  category === cat.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 md:py-8 flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {articles.map((article, index) => (
              <article
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow animate-fadeIn relative group"
              >
                {session?.user && (
                  <button
                    onClick={(e) => handleMarkAsRead(e, article)}
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
                )}

                {session?.user && (
                  <button
                    onClick={(e) => handleBookmark(e, article)}
                    className={`cursor-pointer  absolute top-3 right-3 z-10 p-2 rounded-full shadow-lg transition-all active:scale-95 ${
                      bookmarkedArticles.has(article.url)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                    }`}
                    aria-label={bookmarkedArticles.has(article.url) ? 'Remove bookmark' : 'Add bookmark'}
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
                )}

                <div
                  className="cursor-pointer"
                  onClick={() => handleArticleClick(article)}
                >
                  <img
                    src={article.image || '/placeholder.jpg'}
                    alt={article.title}
                    className="w-full h-40 md:h-48 object-cover"
                  />
                  <div className="p-3 md:p-4">
                    <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2 hover:text-red-600">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-3">
                      {article.description}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="font-medium truncate mr-2">{article.source.name}</span>
                      <span className="whitespace-nowrap">{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
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
