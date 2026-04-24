'use client';

import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Check, Copy, Eye, Loader2, LogOut, Plus, Trash2, Sparkles } from 'lucide-react';
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
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .animate-in-down {
          animation: fadeInDown 0.6s ease-out;
        }
        .animate-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        .animate-in-left {
          animation: slideInLeft 0.6s ease-out;
        }
        .card-hover {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .card-hover:hover {
          transform: translateY(-8px);
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
        <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/30 dark:border-gray-800/30 shadow-sm animate-in-down">
          <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col xs:flex-row gap-3 xs:gap-0 xs:flex-nowrap justify-between items-center">
            <div className="flex items-center gap-4 flex-1 w-full xs:w-auto justify-start">
              {user?.email && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">Welcome back!</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">{user.email}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 w-full xs:w-auto justify-end flex-wrap">
              <button
                onClick={toggleTheme}
                className={`rounded-lg p-2.5 backdrop-blur-sm transition-all duration-300 ${theme === 'dark' ? 'bg-yellow-400/10 text-yellow-500 hover:bg-yellow-400/20 hover:scale-110' : 'bg-blue-400/10 text-blue-600 hover:bg-blue-400/20 hover:scale-110'}`}
                aria-label="Toggle dark mode"
                type="button"
              >
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
              <div className="relative group">
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={isCreating}
                  aria-label="Create new shopping list"
                  className="rounded-xl p-2.5 bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-blue-400/50 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span className="hidden sm:inline text-sm font-medium">New List</span>
                    </>
                  )}
                </button>
                <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-gray-800 px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity no-underline shadow-lg">
                  Create a new shopping list
                </span>
              </div>
              <LogoutLink
                postLogoutRedirectURL="/"
                title="Log out"
                aria-label="Log out"
                className="rounded-lg p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:scale-110 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
              </LogoutLink>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-12">
          {error && (
            <div className="mb-6 p-5 bg-gradient-to-r from-red-50/80 to-red-100/40 dark:from-red-950/40 dark:to-red-900/20 border border-red-300/50 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-xl shadow-sm animate-in-down font-medium">
              ⚠️ {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="text-center space-y-6 animate-in-up">
                <div className="flex justify-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full opacity-20 animate-pulse"></div>
                    <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin absolute inset-0" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">Loading your lists…</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This usually takes just a moment</p>
                </div>
              </div>
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-white/80 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm animate-in-up space-y-6">
              <div className="text-7xl animate-bounce" style={{ animationDuration: '2s' }}>📭</div>
              <div>
                <p className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent mb-2">No shopping lists yet</p>
                <p className="text-gray-600 dark:text-gray-400">Create one above to get started and organize your shopping!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Normal Shopping Lists */}
              <div className="mb-14 animate-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">My Shopping Lists</h2>
                  <div className="h-1 flex-1 bg-gradient-to-r from-blue-400 to-transparent rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lists.filter((list) => !list.isTemplate).length === 0 ? (
                    <div className="col-span-full text-gray-500 dark:text-gray-400 text-center py-12 bg-gradient-to-br from-white/50 to-blue-50/50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">No shopping lists found</div>
                  ) : (
                    lists.filter((list) => !list.isTemplate).map((list, idx) => {
                      const role = getListRole(list, { userId: user?.id, email: user?.email });
                      const permissions = getListPermissions(role);
                      const roleLabel = getRoleLabel(role);
                      const showRoleBadge = role === 'co-owner' || role === 'participant';
                      const isCompleted = list.items && list.items.length > 0 && list.items.every((i) => i.purchased);
                      return (
                        <div
                          key={list._id}
                          className={`group rounded-2xl overflow-hidden flex flex-col card-hover transition-all duration-300 ${ isCompleted
                            ? 'bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800/50 dark:to-gray-900/30 opacity-60 hover:opacity-100'
                            : 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/5'
                          } border border-gray-200/50 dark:border-gray-700/50 shadow-md hover:shadow-xl`}
                          style={{ animation: `fadeInUp 0.6s ease-out ${0.05 * idx}s both` }}
                        >
                          {isCompleted && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-2 z-10 shadow-lg">
                              <Check className="w-4 h-4 text-white" strokeWidth={3} />
                            </div>
                          )}
                          <Link
                            href={`/shopping-lists/${list._id}`}
                            className="flex-1 p-6 group block hover:bg-white/50 dark:hover:bg-gray-700/30 transition-colors duration-300"
                          >
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {list.name || 'Untitled List'}
                                  </p>
                                  {list.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                      {list.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {list.createdAt && (
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 px-2.5 py-1 rounded-full">
                                    {moment(list.createdAt).fromNow()}
                                  </span>
                                )}
                                {showRoleBadge && roleLabel && (
                                  <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ role === 'co-owner'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    }`}
                                  >
                                    {roleLabel}
                                  </span>
                                )}
                              </div>
                              {list.items && list.items.length > 0 && (
                                <div className="pt-2">
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Progress</span>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{Math.round((list.items.filter((i) => i.purchased).length / list.items.length) * 100)}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-400 dark:to-blue-300 transition-all duration-500 rounded-full"
                                      style={{ width: `${(list.items.filter((i) => i.purchased).length / list.items.length) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="px-5 py-4 bg-gradient-to-r from-white/80 to-blue-50/50 dark:from-gray-900/50 dark:to-gray-800/30 border-t border-gray-100/50 dark:border-gray-700/30 flex items-center gap-2 group/buttons">
                            <Link
                              href={`/shopping-lists/${list._id}`}
                              className="flex-1 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group/link transition text-sm flex items-center gap-1"
                            >
                              View Items
                              <span className="inline-block group-hover/link:translate-x-1 transition-transform duration-300">→</span>
                            </Link>
                            <div className="flex items-center gap-1">
                              {list.items && list.items.some((i) => i.quantity != null || i.unit) && (
                                <button
                                  onClick={(e) => { e.preventDefault(); setPeekTarget(list); }}
                                  title="Peek at quantities"
                                  aria-label="Peek at quantities"
                                  className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all duration-300 hover:scale-110"
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
                                  className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all duration-300 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
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
                                  className="rounded-lg p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-all duration-300 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
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
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Template Lists */}
              {lists.filter((list) => list.isTemplate).length > 0 && (
                <div className="animate-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">Templates</h2>
                    <div className="h-1 flex-1 bg-gradient-to-r from-amber-400 to-transparent rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lists.filter((list) => list.isTemplate).map((list, idx) => {
                      const role = getListRole(list, { userId: user?.id, email: user?.email });
                      const permissions = getListPermissions(role);
                      const roleLabel = getRoleLabel(role);
                      const showRoleBadge = role === 'co-owner' || role === 'participant';
                      return (
                        <div
                          key={list._id}
                          className="group rounded-2xl overflow-hidden flex flex-col card-hover transition-all duration-300 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/20 dark:to-orange-900/10 hover:shadow-2xl hover:shadow-amber-400/10 dark:hover:shadow-amber-400/5 border border-amber-200/50 dark:border-amber-800/30 shadow-md hover:shadow-xl"
                          style={{ animation: `fadeInUp 0.6s ease-out ${0.05 * idx}s both` }}
                        >
                          <Link
                            href={`/shopping-lists/${list._id}`}
                            className="flex-1 p-6 group block hover:bg-white/30 dark:hover:bg-amber-900/20 transition-colors duration-300"
                          >
                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                                    {list.name || 'Untitled template'}
                                  </p>
                                  {list.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                                      {list.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-200/50 to-orange-200/50 dark:from-amber-900/40 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 border border-amber-300/30 dark:border-amber-700/30">
                                  ✨ Template
                                </span>
                                {list.createdAt && (
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 px-2.5 py-1 rounded-full">
                                    {moment(list.createdAt).fromNow()}
                                  </span>
                                )}
                                {showRoleBadge && roleLabel && (
                                  <span
                                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                      role === 'co-owner'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    }`}
                                  >
                                    {roleLabel}
                                  </span>
                                )}
                              </div>
                              {list.items && list.items.length > 0 && (
                                <div className="flex items-center gap-2 pt-2">
                                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full">
                                    {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="px-5 py-4 bg-gradient-to-r from-white/50 to-amber-50/30 dark:from-gray-900/30 dark:to-amber-900/10 border-t border-amber-100/50 dark:border-amber-800/30 flex items-center gap-2 group/buttons">
                            <Link
                              href={`/shopping-lists/${list._id}`}
                              className="flex-1 font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 group/link transition text-sm flex items-center gap-1"
                            >
                              View Items
                              <span className="inline-block group-hover/link:translate-x-1 transition-transform duration-300">→</span>
                            </Link>
                            <div className="flex items-center gap-1">
                              {list.items && list.items.some((i) => i.quantity != null || i.unit) && (
                                <button
                                  onClick={(e) => { e.preventDefault(); setPeekTarget(list); }}
                                  title="Peek at quantities"
                                  aria-label="Peek at quantities"
                                  className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all duration-300 hover:scale-110"
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
                                  className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-all duration-300 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
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
                                  className="rounded-lg p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-all duration-300 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed"
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
