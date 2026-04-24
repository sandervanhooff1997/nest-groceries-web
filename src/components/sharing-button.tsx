'use client';

import { Users } from 'lucide-react';
import { useState } from 'react';
import { SharingModal, SharedUser } from './sharing-modal';
import { ShoppingListsService } from '@/src/api/generated';

interface Props {
  listId: string;
  owners: Array<{ _id: string; email: string }>;
  participants: Array<{ _id: string; email: string }>;
  isCreator: boolean;
  onAccessRemoved?: () => void;
}

export function SharingButton({
  listId,
  owners,
  participants,
  isCreator,
  onAccessRemoved,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  if (!isCreator) {
    return null;
  }

  const sharedUsers: SharedUser[] = [
    ...owners.map((o) => ({
      _id: o._id,
      email: o.email,
      role: 'co-owner' as const,
    })),
    ...participants.map((p) => ({
      _id: p._id,
      email: p.email,
      role: 'participant' as const,
    })),
  ];

  const isShared = sharedUsers.length > 0;
  const tooltipText = isShared
    ? `Shared with ${sharedUsers.map((u) => u.email).join(', ')}`
    : 'Share list';

  const handleRemoveAccess = async (userEmail: string) => {
    setIsRemoving(true);
    try {
      await ShoppingListsService.shoppingListActionsControllerRemoveAccess({
        id: listId,
        requestBody: { userEmail },
      });
      onAccessRemoved?.();
    } finally {
      setIsRemoving(false);
    }
  };

  const handleShare = async (userEmail: string, role: 'co-owner' | 'participant') => {
    setIsRemoving(true);
    try {
      await ShoppingListsService.shoppingListActionsControllerShare({
        id: listId,
        requestBody: { userEmail, role },
      });
      onAccessRemoved?.();
    } finally {
      setIsRemoving(false);
    }
  };

  const buttonLabel = isShared ? 'Manage shared access' : 'Share list';

  return (
    <div className="relative group shrink-0">
      <button
        onClick={() => setShowModal(true)}
        title={buttonLabel}
        aria-label={buttonLabel}
        className={`relative rounded-lg p-2 transition ${
          isShared
            ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
        }`}
      >
        <Users className="w-5 h-5" />
        {isShared && (
          <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center font-semibold">
            {sharedUsers.length}
          </span>
        )}
      </button>
      <span className="pointer-events-none absolute right-0 top-full mt-1 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 no-underline">
        {tooltipText}
      </span>

      {showModal && (
        <SharingModal
          users={sharedUsers}
          isLoading={isRemoving}
          onRemoveAccess={handleRemoveAccess}
          onShare={handleShare}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
