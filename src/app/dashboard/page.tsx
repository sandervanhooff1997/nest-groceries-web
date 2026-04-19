'use client';

import { useAuth } from '@/src/lib/auth-context';
import { ProtectedRoute } from '@/src/components/protected-route';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ShoppingList {
  _id: string;
  title: string;
  description?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { logout, token } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000/api';

  useEffect(() => {
    fetchLists();
  }, [token]);

  const fetchLists = async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/shopping-lists`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch lists');
      }

      const data = await response.json();
      setLists(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !token) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/shopping-lists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to create list');
      }

      const created = await response.json();
      setLists([...lists, created]);
      setNewTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create list');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛒</span>
              <h1 className="text-2xl font-bold text-gray-800">My Shopping Lists</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Create New List Form */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New List</h2>
            <form onSubmit={handleCreateList} className="flex gap-3">
              <input
                type="text"
                placeholder="Give your list a name..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={isCreating || !newTitle.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Lists Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-600">Loading your lists...</p>
              </div>
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-600 text-lg mb-4">No shopping lists yet</p>
              <p className="text-gray-500">Create one above to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => (
                <Link
                  key={list._id}
                  href={`/shopping-lists/${list._id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden group cursor-pointer"
                >
                  <div className="p-6 group-hover:bg-blue-50 transition">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                      {list.title}
                    </h3>
                    {list.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{list.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Created {new Date(list.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 group-hover:bg-blue-100 transition">
                    <span className="text-blue-600 font-semibold group-hover:text-blue-700 transition">
                      View Items →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

