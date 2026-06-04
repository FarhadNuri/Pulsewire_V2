'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark } from '@/types';
import { useSession } from '@/lib/auth-client';
import Toast from '@/components/Toast';

export default function BookmarksPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
      return;
    }

    if (session?.user) {
      fetchBookmarks();
      fetchReadHistory();
    }
  }, [session, isPending, router]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks');

      const data = await response.json();
      if (data.success) {
        setBookmarks(data.bookmarks);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
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

  const handleArticleClick = (article: Bookmark['article']) => {
    window.open(article.url, '_blank');
  };

  const handleMarkAsRead = async (e: React.MouseEvent, article: Bookmark['article']) => {
    e.stopPropagation();

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
            category: article.category,
            source: article.source,
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

  const deleteBookmark = async (e: React.MouseEvent, bookmarkId: string) => {
    e.stopPropagation();

    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setBookmarks(bookmarks.filter((b) => b._id !== bookmarkId));
        setToast({ message: 'Bookmark removed successfully', type: 'success' });
      } else {
        setToast({ message: data.message || 'Failed to remove bookmark', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      setToast({ message: 'An error occurred', type: 'error' });
    }
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
      <main className="container mx-auto px-4 py-6 md:py-8 flex-1">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Your Bookmarks</h1>
            <p className="text-gray-600 text-sm md:text-base">
              {bookmarks.length} saved {bookmarks.length === 1 ? 'article' : 'articles'}
            </p>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
            <svg
              className="cursor-pointer w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-4"
              fill="none"
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
            <h2 className="text-lg md:text-xl font-bold text-gray-700 mb-2">No bookmarks yet</h2>
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
              Start saving articles you want to read later
            </p>
            <Link
              href="/"
              className="cursor-pointer inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm md:text-base"
            >
              Browse News
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {bookmarks.map((bookmark) => (
              <article
                key={bookmark._id}
                className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow relative group"
              >
                {/* Mark as Read Button - Top Left */}
                <button
                  onClick={(e) => handleMarkAsRead(e, bookmark.article)}
                  className={`cursor-pointer absolute top-3 left-3 z-10 p-2 rounded-full shadow-lg transition-all active:scale-95 ${
                    readArticles.has(bookmark.article.url)
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-green-50 hover:text-green-600 opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label={readArticles.has(bookmark.article.url) ? 'Marked as read' : 'Mark as read'}
                  title={readArticles.has(bookmark.article.url) ? 'Already read' : 'Mark as read'}
                >
                  <svg
                    className="w-5 h-5"
                    fill={readArticles.has(bookmark.article.url) ? 'currentColor' : 'none'}
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

                {/* Delete/Trash Button - Top Right */}
                <button
                  onClick={(e) => deleteBookmark(e, bookmark._id)}
                  className="cursor-pointer absolute top-3 right-3 z-10 p-2 rounded-full shadow-lg transition-all active:scale-95 bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100"
                  aria-label="Remove bookmark"
                  title="Remove bookmark"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>

                <div
                  className="cursor-pointer"
                  onClick={() => handleArticleClick(bookmark.article)}
                >
                  <img
                    src={bookmark.article.image || '/placeholder.jpg'}
                    alt={bookmark.article.title}
                    className="w-full h-40 md:h-48 object-cover rounded-t-lg"
                  />
                  <div className="p-3 md:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded capitalize">
                        {bookmark.article.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2 hover:text-red-600">
                      {bookmark.article.title}
                    </h3>
                    <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                      {bookmark.article.description}
                    </p>

                    {bookmark.notes && (
                      <div className="mb-3 md:mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs md:text-sm">
                        <p className="text-gray-700 italic line-clamp-2">"{bookmark.notes}"</p>
                      </div>
                    )}

                    {bookmark.tags && bookmark.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3 md:mb-4">
                        {bookmark.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{bookmark.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="truncate mr-2">{bookmark.article.source}</span>
                      <span className="whitespace-nowrap">{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Toast Notification */}
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
