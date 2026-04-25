'use client';

import { Loader2, X, Trash2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from '@/src/lib/use-translations';

export interface SharedUser {
  _id: string;
  email: string;
  role: 'co-owner' | 'participant';
}

interface Props {
  users: SharedUser[];
  isLoading?: boolean;
  onRemoveAccess: (userEmail: string) => Promise<void>;
  onShare: (userEmail: string, role: 'co-owner' | 'participant') => Promise<void>;
  onClose: () => void;
}

export function SharingModal({ users, isLoading = false, onRemoveAccess, onShare, onClose }: Props) {
  const { t } = useTranslations();
  const [removingEmails, setRemovingEmails] = useState<Set<string>>(new Set());
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'co-owner' | 'participant'>('participant');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRemove = async (userEmail: string) => {
    if (!confirm(`Remove access for ${userEmail}?`)) return;

    setRemovingEmails((prev) => new Set(prev).add(userEmail));
    setError('');
    try {
      await onRemoveAccess(userEmail);
      setRemovingEmails((prev) => {
        const next = new Set(prev);
        next.delete(userEmail);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove access');
      setRemovingEmails((prev) => {
        const next = new Set(prev);
        next.delete(userEmail);
        return next;
      });
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;

    setIsSharing(true);
    setError('');
    try {
      await onShare(shareEmail, shareRole);
      setShareEmail('');
      setShareRole('participant');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share list');
    } finally {
      setIsSharing(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('shareList')}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-start gap-2">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Current Shared Users */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('sharedWith')}</h3>
            {users.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Deze lijst is nog niet gedeeld.</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 dark:text-gray-100 text-sm truncate">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {user.role === 'co-owner' ? t('coOwnerRole') : t('participantRole')}
                      </div>
                    </div>
                    <button
                      onClick={() => void handleRemove(user.email)}
                      disabled={removingEmails.has(user.email) || isLoading}
                      title={t('removeAccess')}
                      aria-label={t('removeAccess')}
                      className="rounded-lg p-2 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {removingEmails.has(user.email) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Share Form */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('addUser')}
            </h3>
            <form onSubmit={(e) => void handleShare(e)} className="space-y-3">
              <input
                type="email"
                placeholder={t('enterEmail')}
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                disabled={isSharing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                required
              />
              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value as 'co-owner' | 'participant')}
                disabled={isSharing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-white"
              >
                <option value="participant">{t('participantRole')} (beheer alleen items)</option>
                <option value="co-owner">{t('coOwnerRole')} (kan lijst bijwerken/verwijderen)</option>
              </select>
              <button
                type="submit"
                disabled={isSharing || !shareEmail.trim()}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t('confirmEmail')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-sm font-medium"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
