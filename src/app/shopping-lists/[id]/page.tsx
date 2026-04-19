'use client';

import { useAuth } from '@/src/lib/auth-context';
import { ProtectedRoute } from '@/src/components/protected-route';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface GroceryItem {
  _id: string;
  name: string;
  quantity?: number;
  unit?: string;
  isCompleted?: boolean;
  notes?: string;
}

interface ShoppingList {
  _id: string;
  title: string;
  description?: string;
}

export default async function ShoppingListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { token, logout } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000/api';
  const listId = id;

  useEffect(() => {
    if (token) {
      fetchListDetails();
      fetchItems();
    }
  }, [token, listId]);

  const fetchListDetails = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/shopping-lists/${listId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch list');
      const data = await response.json();
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch list');
    }
  };

  const fetchItems = async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/shopping-lists/${listId}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !token) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newItemName,
          quantity: parseInt(newItemQuantity) || 1,
          unit: newItemUnit,
        }),
      });

      if (!response.ok) throw new Error('Failed to add item');
      const created = await response.json();
      setItems([...items, created]);
      setNewItemName('');
      setNewItemQuantity('1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleItem = async (itemId: string, currentStatus: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isCompleted: !currentStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update item');
      const updated = await response.json();
      setItems(items.map((item) => (item._id === itemId ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/shopping-lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete item');
      setItems(items.filter((item) => item._id !== itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  const completedCount = items.filter((item) => item.isCompleted).length;
  const completionPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
                ← Back to Lists
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
              >
                Logout
              </button>
            </div>
            {list && (
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{list.title}</h1>
                {list.description && <p className="text-gray-600 mt-1">{list.description}</p>}
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Progress Bar */}
          {items.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">Progress</span>
                <span className="text-lg font-bold text-blue-600">
                  {completedCount}/{items.length}
                </span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{completionPercent}% complete</p>
            </div>
          )}

          {/* Add Item Form */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Item</h2>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Item name..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="md:col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Qty"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                min="1"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
              </select>
              <button
                type="submit"
                disabled={isCreating || !newItemName.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                {isCreating ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Items List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-gray-600">Loading items...</p>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <div className="text-5xl mb-4">🛍️</div>
              <p className="text-gray-600 text-lg mb-4">No items yet</p>
              <p className="text-gray-500">Add items above to start shopping</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item._id}
                  className={`bg-white rounded-lg shadow-sm hover:shadow-md transition p-4 flex items-center justify-between ${
                    item.isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={item.isCompleted || false}
                      onChange={() => handleToggleItem(item._id, item.isCompleted || false)}
                      className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          item.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'
                        }`}
                      >
                        {item.name}
                      </p>
                      {item.notes && <p className="text-sm text-gray-500 mt-1">{item.notes}</p>}
                    </div>
                    {item.quantity && (
                      <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded">
                        {item.quantity} {item.unit || 'pcs'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    className="ml-4 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

