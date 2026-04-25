'use client';

import { Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from '@/src/lib/use-translations';

interface Template {
  _id: string;
  name?: string;
  items?: Array<{ _id: string; name: string; quantity?: number; unit?: string }>;
}

interface Props {
  templates: Template[];
  isCreating: boolean;
  onConfirm: (opts: { isTemplate: boolean; fromTemplateIds?: string[] }) => void;
  onClose: () => void;
}


export function CreateListModal({ templates, isCreating, onConfirm, onClose }: Props) {
  const { t } = useTranslations();
  const [isTemplate, setIsTemplate] = useState(false);
  const [fromTemplateIds, setFromTemplateIds] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTemplate && !templateName.trim()) {
      setNameError(t('listName'));
      return;
    }
    setNameError('');
    onConfirm({
      isTemplate,
      fromTemplateIds: fromTemplateIds.length > 0 ? fromTemplateIds : undefined,
      ...(isTemplate ? { name: templateName.trim() } : {})
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-white/80 to-blue-50/50 dark:from-gray-800/80 dark:to-blue-900/20">
          <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">{t('createNewList')}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                {t('useTemplates')} <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((t) => {
                  const selected = fromTemplateIds.includes(t._id);
                  const itemCount = t.items?.length ?? 0;
                  return (
                    <button
                      type="button"
                      key={t._id}
                      onClick={() => {
                        setFromTemplateIds((prev) =>
                          prev.includes(t._id)
                            ? prev.filter((id) => id !== t._id)
                            : [...prev, t._id]
                        );
                      }}
                      className={`relative w-full text-left rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 p-4 ${
                        selected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md dark:hover:shadow-blue-900/20'
                      }`}
                      disabled={isCreating}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{t.name ?? 'Untitled template'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                        </div>
                        {selected && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                      </div>
                      {itemCount > 0 ? (
                        <ul className="space-y-1.5">
                          {t.items!.slice(0, 3).map((item) => (
                            <li key={item._id} className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                              <span className="truncate">{item.name}</span>
                              {(item.quantity || item.unit) && (
                                <span className="text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0 text-right">
                                  {[item.quantity, item.unit].filter(Boolean).join(' ')}
                                </span>
                              )}
                            </li>
                          ))}
                          {itemCount > 3 && (
                            <li className="text-xs text-blue-600 dark:text-blue-400 font-medium pt-1">
                              +{itemCount - 3} more
                            </li>
                          )}
                        </ul>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500 italic">No items</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <button
                type="button"
                role="switch"
                aria-checked={isTemplate}
                onClick={() => setIsTemplate((v) => !v)}
                disabled={isCreating}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                  isTemplate ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    isTemplate ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('saveAsTemplate')}</span>
            </label>

            {isTemplate && (
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {t('listName')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="template-name"
                  type="text"
                  className="w-full rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-sm px-3 py-2.5 transition-all"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="e.g., Grocery Run, Weekly Shop"
                  disabled={isCreating}
                  maxLength={64}
                  autoFocus
                  required
                />
                {nameError && <div className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium">{nameError}</div>}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
{t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 dark:hover:shadow-blue-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
{t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
