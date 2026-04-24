'use client';

import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Copy, Eye, Loader2, LogOut, Plus, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { ProtectedRoute } from '@/src/components/protected-route';
import { CreateListModal } from '@/src/components/create-list-modal';
import { DuplicateModal } from '@/src/components/duplicate-modal';
import { PeekModal } from '@/src/components/peek-modal';
import { SharingButton } from '@/src/components/sharing-button';
import { useAuth } from '@/src/lib/auth-context';
import {
  getListPermissions,
  getListRole,
  getRoleLabel,
} from '@/src/lib/list-permissions';
import { ShoppingListsService } from '@/src/api/generated';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';

interface GroceryItem {
  _id: string;
  name: string;
  quantity?: number;
  unit?: string;
  purchased?: boolean;
}

interface SharedUser {
  _id: string;
  email: string;
}

interface ShoppingList {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  createdBy?: string;
  isTemplate?: boolean;
  items?: GroceryItem[];
  owners?: SharedUser[];
  participants?: SharedUser[];
}

export default function DashboardPage() {
  const { token } = useAuth();
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<ShoppingList | null>(null);
  const [peekTarget, setPeekTarget] = useState<ShoppingList | null>(null);
  const [error, setError] = useState('');

  // Fetch lists from backend
  const fetchLists = async () => {
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
  };

  useEffect(() => {
    fetchLists();
  }, [token]);

  // Preferences menu state
  const [showPrefs, setShowPrefs] = useState(false);
  const prefsRef = useRef<HTMLDivElement>(null);
  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (prefsRef.current && !prefsRef.current.contains(e.target as Node)) {
        setShowPrefs(false);
      }
    }
    if (showPrefs) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPrefs]);

  // Theme state for icon
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    }
    const handler = () => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const toggleTheme = () => {
    if (typeof window !== 'undefined') {
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', next);
      setTheme(next);
    }
  };


  // Generate list name utility
  const generateListName = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}.${ms}u`;
  };

  const handleCreateList = async (opts: { isTemplate: boolean; fromTemplateIds?: string[]; name?: string }) => {
    if (!token) return;
    setIsCreating(true);
    setError('');
    try {
      const created = (await ShoppingListsService.shoppingListsControllerCreate({
        requestBody: {
          name: opts.isTemplate && opts.name ? opts.name : generateListName(),
          items: [],
          isTemplate: opts.isTemplate,
          fromTemplateId: opts.fromTemplateIds && opts.fromTemplateIds.length > 0 ? opts.fromTemplateIds[0] : undefined,
        },
      })) as ShoppingList;
      setShowCreateModal(false);
      router.push(`/shopping-lists/${created._id}`);
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

  const openDuplicateModal = (e: React.MouseEvent, list: ShoppingList) => {
    e.preventDefault();
    setDuplicateTarget(list);
  };

  const handleConfirmDuplicate = async (itemIds: string[], itemOverrides: { id: string; quantity?: number; unit?: string }[]) => {
    if (!token || !duplicateTarget) return;
    setIsDuplicating(true);
    setError('');
    try {
      const result = (await ShoppingListsService.shoppingListActionsControllerDuplicate({
        id: duplicateTarget._id,
        requestBody: { itemIds, itemOverrides: itemOverrides as any },
      })) as ShoppingList;
      router.push(`/shopping-lists/${result._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate list');
      setIsDuplicating(false);
    }
  };

  const handleAccessRemoved = () => {
    void fetchLists();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col xs:flex-row gap-2 xs:gap-0 xs:flex-nowrap justify-between items-center">
            <div className="flex items-center gap-4 flex-1 w-full xs:w-auto justify-start">
              {user?.email && (
                <span className="text-sm text-gray-700 font-medium">Welcome, {user.email}</span>
              )}
            </div>
            <div className="flex items-center gap-1 w-full xs:w-auto justify-end flex-wrap">
              <button
                onClick={() => {
                  // Find the theme toggle button in the DOM and click it
                  const btn = document.querySelector('[aria-label="Toggle dark mode"]');
                  if (btn) (btn as HTMLButtonElement).click();
                }}
                className="rounded-lg p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                aria-label="Toggle dark mode"
                type="button"
              >
                {typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '🌙' : '☀️'}
              </button>
              <div className="relative group">
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={isCreating}
                  aria-label="Create new shopping list"
                  className="rounded-lg p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>
                <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity no-underline">
                  New list
                </span>
              </div>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <LogoutLink
                postLogoutRedirectURL="/"
                title="Log out"
                aria-label="Log out"
                className="rounded-lg p-2 text-red-600 hover:text-red-800 hover:bg-red-50 transition"
              >
                <LogOut className="w-5 h-5" />
              </LogoutLink>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
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
            <>
              {/* Normal Shopping Lists */}
              <div className="mb-10">
                <h2 className="text-lg font-bold text-gray-700 mb-3">My Shopping Lists</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lists.filter((list) => !list.isTemplate).length === 0 ? (
                    <div className="col-span-full text-gray-500 text-center py-8 bg-white rounded-xl shadow-md">No shopping lists found</div>
                  ) : (
                    lists.filter((list) => !list.isTemplate).map((list) => {
                      const role = getListRole(list, { userId: user?.id, email: user?.email });
                      const permissions = getListPermissions(role);
                      const roleLabel = getRoleLabel(role);
                      const showRoleBadge = role === 'co-owner' || role === 'participant';
                      return (
                        <div
                          key={list._id}
                          className={`rounded-xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col ${list.items && list.items.length > 0 && list.items.every((i) => i.purchased) ? 'bg-gray-100 opacity-60 hover:opacity-100' : 'bg-white'}`}
                        >
                          {/* ...existing code for list card... */}
                          <Link
                            href={`/shopping-lists/${list._id}`}
                            className="flex-1 p-6 hover:bg-blue-50 transition group block"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {list.items && list.items.length > 0 && list.items.every((i) => i.purchased) && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 shrink-0">
                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                  </span>
                                )}
                                {list.createdAt && (
                                  <p className="text-xs text-gray-400">
                                    {moment(list.createdAt).fromNow()}
                                  </p>
                                )}
                                {showRoleBadge && roleLabel && (
                                  <span
                                    className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${
                                      role === 'co-owner'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-amber-100 text-amber-700'
                                    }`}
                                  >
                                    {roleLabel}
                                  </span>
                                )}
                              </div>
                              {list.items && list.items.length > 0 && (
                                <span className="text-xs text-gray-400 shrink-0">
                                  {list.items.filter((i) => i.purchased).length}/{list.items.length}
                                </span>
                              )}
                            </div>
                          </Link>
                          <div className="px-4 py-2 bg-gray-50 flex items-center gap-1">
                            <Link
                              href={`/shopping-lists/${list._id}`}
                              className="flex-1 font-semibold text-blue-900 dark:text-blue-200 hover:text-blue-700 dark:hover:text-blue-300 transition text-sm"
                            >
                              View Items →
                            </Link>
                            {list.items && list.items.some((i) => i.quantity != null || i.unit) && (
                              <button
                                onClick={(e) => { e.preventDefault(); setPeekTarget(list); }}
                                title="Peek at quantities"
                                aria-label="Peek at quantities"
                                className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {permissions.canShare && user?.id && (
                              <SharingButton
                                listId={list._id}
                                owners={list.owners || []}
                                participants={list.participants || []}
                                isCreator={true}
                                onAccessRemoved={handleAccessRemoved}
                              />
                            )}
                            {permissions.canDuplicate && (
                              <button
                                onClick={(e) => openDuplicateModal(e, list)}
                                disabled={deletingIds.has(list._id)}
                                title="Duplicate this list"
                                aria-label="Duplicate this list"
                                className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                            {permissions.canDelete && (
                              <button
                                onClick={(e) => void handleDeleteList(e, list._id)}
                                disabled={deletingIds.has(list._id)}
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
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Template Lists */}
              <div>
                <h2 className="text-lg font-bold text-gray-700 mb-3">Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lists.filter((list) => list.isTemplate).length === 0 ? (
                    <div className="col-span-full text-gray-500 text-center py-8 bg-white rounded-xl shadow-md">No templates found</div>
                  ) : (
                    lists.filter((list) => list.isTemplate).map((list) => {
                      const role = getListRole(list, { userId: user?.id, email: user?.email });
                      const permissions = getListPermissions(role);
                      const roleLabel = getRoleLabel(role);
                      const showRoleBadge = role === 'co-owner' || role === 'participant';
                      return (
                        <div
                          key={list._id}
                          className={
                            `rounded-xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col bg-blue-50 dark:bg-gray-800`
                          }
                        >
                          {/* ...existing code for list card... */}
                          <Link
                            href={`/shopping-lists/${list._id}`}
                            className="flex-1 p-6 hover:bg-blue-100 dark:hover:bg-gray-700 transition group block"
                          >
                            <div className="flex flex-col gap-2">
                              <div className="font-semibold text-blue-900 dark:text-blue-200 text-base truncate mb-1">
                                {list.name || 'Untitled template'}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {list.items && list.items.length > 0 && list.items.every((i) => i.purchased) && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 shrink-0">
                                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </span>
                                  )}
                                  {list.createdAt && (
                                    <p className="text-xs text-gray-400">
                                      {moment(list.createdAt).fromNow()}
                                    </p>
                                  )}
                                  <span className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-gray-700 text-blue-700 dark:text-blue-200">
                                    Template
                                  </span>
                                  {showRoleBadge && roleLabel && (
                                    <span
                                      className={`text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded ${
                                        role === 'co-owner'
                                          ? 'bg-purple-100 text-purple-700'
                                          : 'bg-amber-100 text-amber-700'
                                      }`}
                                    >
                                      {roleLabel}
                                    </span>
                                  )}
                                </div>
                                {list.items && list.items.length > 0 && (
                                  <span className="text-xs text-gray-400 dark:text-gray-300 shrink-0">
                                    {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 flex items-center gap-1">
                            <Link
                              href={`/shopping-lists/${list._id}`}
                              className="flex-1 font-semibold text-blue-900 dark:text-blue-200 hover:text-blue-700 dark:hover:text-blue-300 transition text-sm"
                            >
                              View Items →
                            </Link>
                            {list.items && list.items.some((i) => i.quantity != null || i.unit) && (
                              <button
                                onClick={(e) => { e.preventDefault(); setPeekTarget(list); }}
                                title="Peek at quantities"
                                aria-label="Peek at quantities"
                                className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            {permissions.canShare && user?.id && (
                              <SharingButton
                                listId={list._id}
                                owners={list.owners || []}
                                participants={list.participants || []}
                                isCreator={true}
                                onAccessRemoved={handleAccessRemoved}
                              />
                            )}
                            {permissions.canDuplicate && (
                              <button
                                onClick={(e) => openDuplicateModal(e, list)}
                                disabled={deletingIds.has(list._id)}
                                title="Duplicate this template"
                                aria-label="Duplicate this template"
                                className="rounded-lg p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                            {permissions.canDelete && (
                              <button
                                onClick={(e) => void handleDeleteList(e, list._id)}
                                disabled={deletingIds.has(list._id)}
                                title="Delete this template permanently"
                                aria-label="Delete this template permanently"
                                className="rounded-lg p-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {deletingIds.has(list._id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {showCreateModal && (
        <CreateListModal
          templates={lists.filter((l) => l.isTemplate)}
          isCreating={isCreating}
          onConfirm={(opts) => void handleCreateList(opts)}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {peekTarget && (
        <PeekModal
          items={peekTarget.items ?? []}
          onClose={() => setPeekTarget(null)}
        />
      )}

      {duplicateTarget && (
        <DuplicateModal
          items={duplicateTarget.items ?? []}
          isDuplicating={isDuplicating}
          onConfirm={(itemIds, overrides) => void handleConfirmDuplicate(itemIds, overrides)}
          onClose={() => setDuplicateTarget(null)}
        />
      )}
    </ProtectedRoute>
  );
}
