'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import Toast from '@/components/Toast';

interface ReadHistory {
  _id: string;
  article: {
    title: string;
    url: string;
    category: string;
    source: string;
    image?: string;
    description?: string;
  };
  readAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [history, setHistory] = useState<ReadHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
      return;
    }

    if (session?.user) {
      fetchHistory();
    }
  }, [session, isPending, router]);

  const fetchHistory = async (category?: string) => {
    setLoading(true);
    try {
      const url = category && category !== 'all' 
        ? `/api/history?category=${category}` 
        : '/api/history';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setToast({ message: 'Failed to load reading history', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all reading history? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/history', {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setHistory([]);
        setToast({ message: 'Reading history cleared!', type: 'success' });
      } else {
        setToast({ message: data.message || 'Failed to clear history', type: 'error' });
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    }
  };

  const handleArticleClick = (article: ReadHistory['article']) => {
    window.open(article.url, '_blank');
  };

  const handleFilterChange = (category: string) => {
    setFilterCategory(category);
    fetchHistory(category);
  };

  const categories = Array.from(new Set(history.map(h => h.article.category).filter(Boolean)));

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
      <main className="container mx-auto px-4 py-6 md:py-8 flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Reading History</h1>
            <p className="text-gray-600 text-sm md:text-base">
              {history.length} article{history.length !== 1 ? 's' : ''} read
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="cursor-pointer px-4 py-2 text-sm bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => handleFilterChange('all')}
                className={`cursor-pointer px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors text-sm ${
                  filterCategory === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterChange(cat)}
                  className={`cursor-pointer px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors text-sm capitalize ${
                    filterCategory === cat
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
            <svg
              className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">No reading history yet</h3>
            <p className="text-gray-600 text-sm md:text-base mb-4">
              Articles you mark as read will appear here
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Browse News
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <article
                key={item._id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4 md:p-5">
                  {item.article.image && (
                    <div
                      className="w-full sm:w-40 h-32 sm:h-28 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden"
                      onClick={() => handleArticleClick(item.article)}
                    >
                      <img
                        src={item.article.image}
                        alt={item.article.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}


                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3
                        className="font-bold text-base md:text-lg hover:text-red-600 cursor-pointer line-clamp-2"
                        onClick={() => handleArticleClick(item.article)}
                      >
                        {item.article.title}
                      </h3>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full whitespace-nowrap capitalize flex-shrink-0">
                        {item.article.category || 'General'}
                      </span>
                    </div>

                    {item.article.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.article.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                        {item.article.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(item.readAt).toLocaleDateString()} at {new Date(item.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
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
