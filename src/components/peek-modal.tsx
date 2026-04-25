'use client';

import { X } from 'lucide-react';
import { useTranslations } from '@/src/lib/use-translations';

interface GroceryItem {
  _id: string;
  name: string;
  quantity?: number;
  unit?: string;
  purchased?: boolean;
}

interface Props {
  items: GroceryItem[];
  onClose: () => void;
}

export function PeekModal({ items, onClose }: Props) {
  const { t } = useTranslations();
  const itemsWithDetails = items.filter((i) => i.quantity != null || i.unit);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{t('items_list')}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {itemsWithDetails.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">{t('noItemsYet')}</p>
          ) : (
            <ul className="space-y-2">
              {itemsWithDetails.map((item) => (
                <li key={item._id} className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${item.purchased ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.name}
                  </span>
                  <span className="text-sm text-gray-500 shrink-0">
                    {[item.quantity, item.unit].filter(Boolean).join(' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
