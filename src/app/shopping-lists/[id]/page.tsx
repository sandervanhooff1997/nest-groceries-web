'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/src/lib/auth-context';
import { ShoppingListsService } from '@/src/api/generated';
import { GroceryItemDto } from '@/src/api/generated/models/GroceryItemDto';
import { ProtectedRoute } from '@/src/components/protected-route';

interface GroceryItem {
  _id: string;
  name: string;
  quantity?: number;
  unit?: string;
  purchased?: boolean;
}

interface ShoppingList {
  _id: string;
  name?: string;
  items?: GroceryItem[];
}

const UNIT_OPTIONS: { value: GroceryItemDto.unit; label: string }[] = [
  { value: GroceryItemDto.unit.PIECE_S_, label: 'Piece(s)' },
  { value: GroceryItemDto.unit.GRAM, label: 'Gram' },
  { value: GroceryItemDto.unit.KILOGRAM, label: 'Kilogram' },
  { value: GroceryItemDto.unit.LITER, label: 'Liter' },
  { value: GroceryItemDto.unit.MILLILITER, label: 'Milliliter' },
];

function IconBtn({
  onClick,
  disabled,
  title,
  children,
  variant = 'default',
  type = 'button',
}: {
  onClick?: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'primary' | 'success';
  type?: 'button' | 'submit';
}) {
  const colours = {
    default: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
    danger: 'text-red-500 hover:text-red-700 hover:bg-red-50',
    primary: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    success: 'text-green-600 hover:text-green-800 hover:bg-green-50',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`rounded-lg p-2 transition disabled:opacity-40 disabled:cursor-not-allowed ${colours[variant]}`}
    >
      {children}
    </button>
  );
}

export default function ShoppingListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listId } = use(params);
  const { token } = useAuth();
  const router = useRouter();

  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState<GroceryItemDto.unit>(GroceryItemDto.unit.PIECE_S_);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Edit list name
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Delete / duplicate list
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Per-item loading states
  const [togglingItems, setTogglingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const loadList = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const data = (await ShoppingListsService.shoppingListsControllerFindById({
        id: listId,
      })) as ShoppingList;
      setList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch list');
    } finally {
      setIsLoading(false);
    }
  }, [listId, token]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !token) return;
    setIsAddingItem(true);
    setError('');
    try {
      const quantity = Math.max(1, parseInt(newItemQuantity, 10) || 1);
      const updated = (await ShoppingListsService.groceryItemsControllerAddItem({
        id: listId,
        requestBody: { name: newItemName.trim(), quantity, unit: newItemUnit },
      })) as ShoppingList;
      setList(updated);
      setNewItemName('');
      setNewItemQuantity('1');
      setNewItemUnit(GroceryItemDto.unit.PIECE_S_);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleToggleItem = async (itemId: string, currentlyPurchased: boolean) => {
    if (!token) return;
    setTogglingItems((prev) => new Set(prev).add(itemId));
    setList((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items?.map((item) =>
              item._id === itemId ? { ...item, purchased: !currentlyPurchased } : item
            ),
          }
        : prev
    );
    try {
      const updated = (
        currentlyPurchased
          ? await ShoppingListsService.groceryItemActionsControllerUncompleteItem({ id: listId, itemId })
          : await ShoppingListsService.groceryItemActionsControllerCompleteItem({ id: listId, itemId })
      ) as ShoppingList;
      setList(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      void loadList();
    } finally {
      setTogglingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!token) return;
    setRemovingItems((prev) => new Set(prev).add(itemId));
    setError('');
    try {
      const updated = (await ShoppingListsService.groceryItemsControllerRemoveItem({
        id: listId,
        itemId,
      })) as ShoppingList;
      setList(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || !token) return;
    setIsSavingName(true);
    setError('');
    try {
      const updated = (await ShoppingListsService.shoppingListsControllerUpdate({
        id: listId,
        requestBody: { name: editedName.trim() },
      })) as ShoppingList;
      setList(updated);
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update list name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteList = async () => {
    if (!token || !confirm('Delete this shopping list? This cannot be undone.')) return;
    setIsDeletingList(true);
    setError('');
    try {
      await ShoppingListsService.shoppingListsControllerDelete({ id: listId });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete list');
      setIsDeletingList(false);
    }
  };

  const handleDuplicate = async () => {
    if (!token) return;
    setIsDuplicating(true);
    setError('');
    try {
      const duplicated = (await ShoppingListsService.shoppingListActionsControllerDuplicate({
        id: listId,
        requestBody: {},
      })) as ShoppingList;
      router.push(`/shopping-lists/${duplicated._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate list');
      setIsDuplicating(false);
    }
  };

  const items = list?.items ?? [];
  const purchasedCount = items.filter((i) => i.purchased).length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* ── Header ── */}
        <header className="bg-white shadow sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
            <Link
              href="/dashboard"
              title="Back to all lists"
              aria-label="Back to all lists"
              className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    className="flex-1 px-3 py-1 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold text-gray-800"
                  />
                  <IconBtn
                    onClick={() => void handleSaveName()}
                    disabled={isSavingName || !editedName.trim()}
                    title="Save new name"
                    variant="primary"
                  >
                    {isSavingName ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </IconBtn>
                  <IconBtn
                    onClick={() => setIsEditingName(false)}
                    title="Cancel rename"
                    variant="default"
                  >
                    <X className="w-4 h-4" />
                  </IconBtn>
                </div>
              ) : (
                <h1 className="text-xl font-bold text-gray-800 truncate">
                  {list?.name ?? 'Shopping List'}
                </h1>
              )}
            </div>

            {!isEditingName && (
              <div className="flex items-center shrink-0">
                <IconBtn
                  onClick={() => {
                    setEditedName(list?.name ?? '');
                    setIsEditingName(true);
                  }}
                  title="Rename this list"
                  variant="default"
                >
                  <Pencil className="w-4 h-4" />
                </IconBtn>
                <IconBtn
                  onClick={() => void handleDuplicate()}
                  disabled={isDuplicating}
                  title="Duplicate this list"
                  variant="default"
                >
                  {isDuplicating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </IconBtn>
                <IconBtn
                  onClick={() => void handleDeleteList()}
                  disabled={isDeletingList}
                  title="Delete this list permanently"
                  variant="danger"
                >
                  {isDeletingList ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </IconBtn>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Add item form ── */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Add Item
            </h2>
            <form onSubmit={(e) => void handleAddItem(e)} className="space-y-3">
              <input
                type="text"
                placeholder="Item name…"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  title="Quantity"
                  aria-label="Quantity"
                  className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value as GroceryItemDto.unit)}
                  title="Unit of measurement"
                  aria-label="Unit of measurement"
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isAddingItem || !newItemName.trim()}
                  title="Add item to list"
                  aria-label="Add item to list"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
                >
                  {isAddingItem ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="font-semibold">{isAddingItem ? 'Adding…' : 'Add'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* ── Items list ── */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Items</h2>
              {items.length > 0 && (
                <span className="text-sm text-gray-500">
                  {purchasedCount}/{items.length} purchased
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-gray-500">No items yet. Add one above!</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((item) => {
                  const isToggling = togglingItems.has(item._id);
                  const isRemoving = removingItems.has(item._id);
                  return (
                    <li
                      key={item._id}
                      className={`flex items-center gap-3 px-6 py-4 transition ${item.purchased ? 'bg-gray-50' : ''}`}
                    >
                      {/* Toggle purchased */}
                      <button
                        onClick={() => void handleToggleItem(item._id, item.purchased ?? false)}
                        disabled={isToggling || isRemoving}
                        title={item.purchased ? 'Mark as not purchased' : 'Mark as purchased'}
                        aria-label={item.purchased ? 'Mark as not purchased' : 'Mark as purchased'}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition disabled:opacity-40 ${
                          item.purchased
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : item.purchased ? (
                          <Check className="w-3 h-3" />
                        ) : null}
                      </button>

                      {/* Item info */}
                      <div className="flex-1 min-w-0">
                        <span
                          className={`font-medium ${item.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}
                        >
                          {item.name}
                        </span>
                        {(item.quantity != null || item.unit) && (
                          <span className="ml-2 text-sm text-gray-500">
                            {[item.quantity, item.unit].filter(Boolean).join('\u202f')}
                          </span>
                        )}
                      </div>

                      {/* Remove item */}
                      <IconBtn
                        onClick={() => void handleRemoveItem(item._id)}
                        disabled={isRemoving || isToggling}
                        title="Remove item from list"
                        variant="danger"
                      >
                        {isRemoving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </IconBtn>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
