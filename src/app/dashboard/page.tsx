'use client';

import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, LogOut, Plus, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/src/components/protected-route';
import { useAuth } from '@/src/lib/auth-context';
import { ShoppingListsService } from '@/src/api/generated';
import { useRouter } from 'next/navigation';

interface ShoppingList {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  createdAt?: string;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [duplicatingIds, setDuplicatingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const fetchLists = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await ShoppingListsService.shoppingListsControllerFindAll();
      const normalised: ShoppingList[] = Array.isArray(data)
        ? (data as ShoppingList[])
        : ((data as { data?: ShoppingList[] })?.data ?? []);
      setLists(normalised);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lists');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchLists();
  }, [fetchLists]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !token) return;

    setIsCreating(true);
    setError('');
    try {
      const created = (await ShoppingListsService.shoppingListsControllerCreate({
        requestBody: { name: newTitle, items: [] },
      })) as ShoppingList;
      setLists((prev) => [...prev, created]);
      setNewTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create list');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (e: React.MouseEvent, listId: string) => {
    e.preventDefault();
    if (!token || !confirm('Delete this shopping list? This cannot be undone.')) return;
    setDeletingIds((prev) => new Set(prev).add(listId));
    setError('');
    try {
      await ShoppingListsService.shoppingListsControllerDelete({ id: listId });
      setLists((prev) => prev.filter((l) => l._id !== listId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(listId);
        return next;
      });
    }
  };

  const handleDuplicateList = async (e: React.MouseEvent, listId: string) => {
    e.preventDefault();
    if (!token) return;
    setDuplicatingIds((prev) => new Set(prev).add(listId));
    setError('');
    try {
      const duplicated = (await ShoppingListsService.shoppingListActionsControllerDuplicate({
        id: listId,
        requestBody: {},
      })) as ShoppingList;
      router.push(`/shopping-lists/${duplicated._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate list');
      setDuplicatingIds((prev) => {
        const next = new Set(prev);
        next.delete(listId);
        return next;
      });
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛒</span>
              <h1 className="text-2xl font-bold text-gray-800">My Shopping Lists</h1>
            </div>
            <LogoutLink
              postLogoutRedirectURL="/"
              title="Log out"
              aria-label="Log out"
              className="rounded-lg p-2 text-red-600 hover:text-red-800 hover:bg-red-50 transition"
            >
              <LogOut className="w-5 h-5" />
            </LogoutLink>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
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
                title="Create new shopping list"
                aria-label="Create new shopping list"
                className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center gap-2"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isCreating ? 'Creating…' : 'Create'}
              </button>
            </form>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading your lists…</p>
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
                <div
                  key={list._id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
                >
                  <Link
                    href={`/shopping-lists/${list._id}`}
                    className="flex-1 p-6 hover:bg-blue-50 transition group block"
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                      {list.title ?? list.name ?? 'Untitled'}
                    </h3>
                    {list.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{list.description}</p>
                    )}
                    {list.createdAt && (
                      <p className="text-xs text-gray-400">
                        Created {new Date(list.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </Link>
                  <div className="px-4 py-2 bg-gray-50 flex items-center gap-1">
                    <Link
                      href={`/shopping-lists/${list._id}`}
                      className="flex-1 text-blue-600 font-semibold hover:text-blue-700 transition text-sm"
                    >
                      View Items →
                    </Link>
                    <button
                      onClick={(e) => void handleDuplicateList(e, list._id)}
                      disabled={duplicatingIds.has(list._id) || deletingIds.has(list._id)}
                      title="Duplicate this list"
                      aria-label="Duplicate this list"
                      className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {duplicatingIds.has(list._id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => void handleDeleteList(e, list._id)}
                      disabled={deletingIds.has(list._id) || duplicatingIds.has(list._id)}
                      title="Delete this list permanently"
                      aria-label="Delete this list permanently"
                      className="rounded-lg p-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deletingIds.has(list._id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
