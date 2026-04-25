'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { useTranslations } from '@/src/lib/use-translations';

export interface DuplicateItem {
  _id: string;
  name: string;
  quantity?: number;
  unit?: string;
}

export interface ItemOverride {
  id: string;
  quantity?: number;
  unit?: string;
}

const UNIT_OPTIONS = [
  { value: '', label: '—' },
  { value: 'Piece(s)', label: 'Piece(s)' },
  { value: 'Gram', label: 'Gram' },
  { value: 'Kilogram', label: 'Kilogram' },
  { value: 'Liter', label: 'Liter' },
  { value: 'Milliliter', label: 'Milliliter' },
];

interface ItemState {
  checked: boolean;
  quantity: string;
  unit: string;
}

interface Props {
  items: DuplicateItem[];
  isDuplicating: boolean;
  onConfirm: (itemIds: string[], itemOverrides: ItemOverride[]) => void;
  onClose: () => void;
}

export function DuplicateModal({ items, isDuplicating, onConfirm, onClose }: Props) {
  const { t } = useTranslations();
  const [state, setState] = useState<Record<string, ItemState>>(() =>
    Object.fromEntries(
      items.map((i) => [
        i._id,
        { checked: true, quantity: String(i.quantity ?? ''), unit: i.unit ?? '' },
      ]),
    ),
  );

  const toggle = (id: string) =>
    setState((prev) => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }));

  const setField = (id: string, field: 'quantity' | 'unit', value: string) =>
    setState((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  const checkedIds = items.filter((i) => state[i._id]?.checked).map((i) => i._id);
  const allChecked = checkedIds.length === items.length;

  const toggleAll = () => {
    const next = !allChecked;
    setState((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, checked: next }])),
    );
  };

  const handleConfirm = () => {
    const overrides: ItemOverride[] = checkedIds.flatMap((id) => {
      const s = state[id];
      const original = items.find((i) => i._id === id);
      const qty = s.quantity !== '' ? Number(s.quantity) : undefined;
      const unit = s.unit !== '' ? s.unit : undefined;
      const quantityChanged = qty !== original?.quantity;
      const unitChanged = unit !== (original?.unit ?? undefined);
      if (!quantityChanged && !unitChanged) return [];
      return [{ id, ...(quantityChanged && { quantity: qty }), ...(unitChanged && { unit }) }];
    });
    onConfirm(checkedIds, overrides);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t('duplicateThisList')}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item list */}
        <div className="overflow-y-auto flex-1 px-6 py-3">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">{t('noItemsYet')}</p>
          ) : (
            <>
              {/* Select all */}
              <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                <Checkbox checked={allChecked} onChange={toggleAll} />
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 select-none flex-1 text-left transition"
                >
                  {allChecked ? t('deselectAll') : t('selectAll')}
                </button>
              </div>

              {items.map((item) => {
                const s = state[item._id];
                return (
                  <div key={item._id} className="flex items-center gap-3 py-2.5">
                    <Checkbox checked={s.checked} onChange={() => toggle(item._id)} />

                    <span
                      className={`flex-1 min-w-0 truncate ${s.checked ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      {item.name}
                    </span>

                    {/* Quantity */}
                    <input
                      type="number"
                      min={1}
                      value={s.quantity}
                      onChange={(e) => setField(item._id, 'quantity', e.target.value)}
                      disabled={!s.checked}
                      aria-label="Quantity"
                      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    />

                    {/* Unit */}
                    <select
                      value={s.unit}
                      onChange={(e) => setField(item._id, 'unit', e.target.value)}
                      disabled={!s.checked}
                      aria-label="Unit"
                      className="w-28 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {UNIT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isDuplicating}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-40"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDuplicating || checkedIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
          >
            {isDuplicating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {t('duplicating')} {checkedIds.length > 0 && `(${checkedIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-label={checked ? 'Uncheck' : 'Check'}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer transition ${
        checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
      }`}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </button>
  );
}
