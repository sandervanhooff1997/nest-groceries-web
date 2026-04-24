'use client';

import { Loader2, X, Trash2, Plus } from 'lucide-react';
import { useState } from 'react';

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
  const [removingEmails, setRemovingEmails] = useState<Set<string>>(new Set());
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'co-owner' | 'participant'>('participant');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Share list</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <X className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Current Shared Users */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Shared with</h3>
            {users.length === 0 ? (
              <p className="text-gray-500 text-sm">This list hasn't been shared yet.</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {user.role === 'co-owner' ? 'Co-owner' : 'Participant'}
                      </div>
                    </div>
                    <button
                      onClick={() => void handleRemove(user.email)}
                      disabled={removingEmails.has(user.email) || isLoading}
                      title="Remove access"
                      aria-label="Remove access"
                      className="rounded-lg p-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add someone
            </h3>
            <form onSubmit={(e) => void handleShare(e)} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                disabled={isSharing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                required
              />
              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value as 'co-owner' | 'participant')}
                disabled={isSharing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-white"
              >
                <option value="participant">Participant (manage items only)</option>
                <option value="co-owner">Co-owner (can update/delete list)</option>
              </select>
              <button
                type="submit"
                disabled={isSharing || !shareEmail.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Share
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
