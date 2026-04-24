'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Copy,
  GripVertical,
  Loader2,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/src/lib/auth-context';
import {
  getListPermissions,
  getListRole,
  getRoleLabel,
} from '@/src/lib/list-permissions';
import { ShoppingListsService } from '@/src/api/generated';
import { GroceryItemDto } from '@/src/api/generated/models/GroceryItemDto';
import { ProtectedRoute } from '@/src/components/protected-route';
import { DuplicateModal } from '@/src/components/duplicate-modal';
import { SharingButton } from '@/src/components/sharing-button';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

interface GroceryItem {
  _id: string;
  name: string;
  quantity?: number;
  unit?: string;
  purchased?: boolean;
  order: number;
}

interface SharedUser {
  _id: string;
  email: string;
}

interface ShoppingList {
  _id: string;
  name?: string;
  createdBy?: string;
  isTemplate?: boolean;
  items?: GroceryItem[];
  owners?: SharedUser[];
  participants?: SharedUser[];
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

const UNIT_OPTIONS_WITH_NONE = [
  { value: '', label: '—' },
  { value: 'Piece(s)', label: 'Piece(s)' },
  { value: 'Gram', label: 'Gram' },
  { value: 'Kilogram', label: 'Kilogram' },
  { value: 'Liter', label: 'Liter' },
  { value: 'Milliliter', label: 'Milliliter' },
];

function SortableItem({
  item,
  isToggling,
  isRemoving,
  isDragging,
  onToggle,
  onRemove,
  onSave,
}: {
  item: GroceryItem;
  isToggling: boolean;
  isRemoving: boolean;
  isDragging: boolean;
  onToggle?: () => void;
  onRemove: () => void;
  onSave: (patch: { name?: string; quantity?: number; unit?: string }) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item._id });

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQty, setEditQty] = useState(String(item.quantity ?? ''));
  const [editUnit, setEditUnit] = useState(item.unit ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = () => {
    setEditName(item.name);
    setEditQty(String(item.quantity ?? ''));
    setEditUnit(item.unit ?? '');
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const commitEdit = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    const qty = editQty !== '' ? Math.max(1, Number(editQty)) : undefined;
    await onSave({
      name: editName.trim(),
      quantity: qty,
      unit: editUnit !== '' ? editUnit : undefined,
    });
    setIsSaving(false);
    setEditing(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-6 py-4 transition ${item.purchased ? 'bg-gray-50' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        aria-label="Drag to reorder"
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Toggle purchased — hidden on template lists */}
      {onToggle !== undefined ? (
        <button
          onClick={onToggle}
          disabled={isToggling || isRemoving || editing}
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
      ) : (
        <div className="w-6 h-6 shrink-0" />
      )}

      {/* Item info / edit fields */}
      {editing ? (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void commitEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            min={1}
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void commitEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            aria-label="Quantity"
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={editUnit}
            onChange={(e) => setEditUnit(e.target.value)}
            aria-label="Unit"
            className="w-28 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {UNIT_OPTIONS_WITH_NONE.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => void commitEdit()}
            disabled={isSaving || !editName.trim()}
            aria-label="Save"
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={cancelEdit}
            aria-label="Cancel"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={startEdit}
          title="Click to edit"
        >
          <span className={`font-medium ${item.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.name}
          </span>
          {(item.quantity != null || item.unit) && (
            <span className="ml-2 text-sm text-gray-500">
              {[item.quantity, item.unit].filter(Boolean).join('\u202f')}
            </span>
          )}
        </div>
      )}

      {/* Remove item */}
      {!editing && (
        <IconBtn
          onClick={onRemove}
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
      )}
    </li>
  );
}

function DragOverlayItem({ item }: { item: GroceryItem }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-xl shadow-lg border border-blue-200">
      <GripVertical className="w-4 h-4 text-gray-400" />
      <div
        className={`w-6 h-6 rounded-full border-2 shrink-0 ${
          item.purchased ? 'bg-green-500 border-green-500' : 'border-gray-300'
        }`}
      />
      <div className="flex-1 min-w-0">
        <span className={`font-medium ${item.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.name}
        </span>
        {(item.quantity != null || item.unit) && (
          <span className="ml-2 text-sm text-gray-500">
            {[item.quantity, item.unit].filter(Boolean).join('\u202f')}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ShoppingListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listId } = use(params);
  const { token } = useAuth();
  const { user } = useKindeBrowserClient();
  const router = useRouter();

  const [list, setList] = useState<ShoppingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [newItemUnit, setNewItemUnit] = useState<GroceryItemDto.unit>(GroceryItemDto.unit.PIECE_S_);
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Delete / duplicate list
  const [isDeletingList, setIsDeletingList] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  // Per-item loading states
  const [togglingItems, setTogglingItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  // Drag state
  const [activeId, setActiveId] = useState<string | null>(null);
  const reorderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const handleDuplicate = async (itemIds: string[], itemOverrides: { id: string; quantity?: number; unit?: string }[]) => {
    if (!token) return;
    setIsDuplicating(true);
    setError('');
    try {
      const duplicated = (await ShoppingListsService.shoppingListActionsControllerDuplicate({
        id: listId,
        requestBody: { itemIds, itemOverrides: itemOverrides as any },
      })) as ShoppingList;
      router.push(`/shopping-lists/${duplicated._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate list');
      setIsDuplicating(false);
    }
  };

  const handleAccessRemoved = () => {
    void loadList();
  };

  const handleUpdateItem = async (
    itemId: string,
    patch: { name?: string; quantity?: number; unit?: string },
  ) => {
    const updated = (await ShoppingListsService.groceryItemActionsControllerUpdateItem({
      id: listId,
      itemId,
      requestBody: patch as any,
    })) as ShoppingList;
    setList(updated);
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setList((prev) => {
      if (!prev?.items) return prev;
      const oldIndex = prev.items.findIndex((i) => i._id === active.id);
      const newIndex = prev.items.findIndex((i) => i._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const reordered = [...prev.items];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      const withOrder = reordered.map((item, idx) => ({ ...item, order: idx }));

      // Debounce the API call so rapid drags don't flood the server
      if (reorderTimerRef.current) clearTimeout(reorderTimerRef.current);
      reorderTimerRef.current = setTimeout(() => {
        void ShoppingListsService.groceryItemsControllerReorderItems({
          id: listId,
          requestBody: { itemIds: withOrder.map((i) => i._id) },
        }).catch(() => {
          setError('Failed to save new order');
          void loadList();
        });
      }, 400);

      return { ...prev, items: withOrder };
    });
  };

  const sortedItems = [...(list?.items ?? [])].sort((a, b) => a.order - b.order);
  const purchasedCount = sortedItems.filter((i) => i.purchased).length;
  const activeItem = activeId ? sortedItems.find((i) => i._id === activeId) : null;

  const role = list
    ? getListRole(list, { userId: user?.id, email: user?.email })
    : 'none';
  const permissions = getListPermissions(role);
  const roleLabel = getRoleLabel(role);
  const showRoleBadge = role === 'co-owner' || role === 'participant';

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

            <div className="flex-1 flex items-center gap-2 justify-end pr-2">
              {list?.isTemplate && (
                <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  Template
                </span>
              )}
              {showRoleBadge && roleLabel && (
                <span
                  className={`text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded ${
                    role === 'co-owner'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {roleLabel}
                </span>
              )}
            </div>

            <div className="flex items-center shrink-0">
              {permissions.canShare && user?.id && list && (
                <SharingButton
                  listId={list._id}
                  owners={list.owners || []}
                  participants={list.participants || []}
                  isCreator={true}
                  onAccessRemoved={handleAccessRemoved}
                />
              )}
              {permissions.canDuplicate && (
                <IconBtn
                  onClick={() => setShowDuplicateModal(true)}
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
              )}
              {permissions.canDelete && (
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
              )}
            </div>
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
              {sortedItems.length > 0 && (
                <span className="text-sm text-gray-500">
                  {purchasedCount}/{sortedItems.length} purchased
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="py-10 text-center text-gray-500">No items yet. Add one above!</div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedItems.map((i) => i._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="divide-y divide-gray-100">
                    {sortedItems.map((item) => (
                      <SortableItem
                        key={item._id}
                        item={item}
                        isToggling={togglingItems.has(item._id)}
                        isRemoving={removingItems.has(item._id)}
                        isDragging={activeId === item._id}
                        onToggle={list?.isTemplate ? undefined : () => void handleToggleItem(item._id, item.purchased ?? false)}
                        onRemove={() => void handleRemoveItem(item._id)}
                        onSave={(patch) => handleUpdateItem(item._id, patch)}
                      />
                    ))}
                  </ul>
                </SortableContext>
                <DragOverlay>
                  {activeItem ? <DragOverlayItem item={activeItem} /> : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </main>
      </div>

      {showDuplicateModal && (
        <DuplicateModal
          items={sortedItems}
          isDuplicating={isDuplicating}
          onConfirm={(itemIds, overrides) => void handleDuplicate(itemIds, overrides)}
          onClose={() => setShowDuplicateModal(false)}
        />
      )}
    </ProtectedRoute>
  );
}
