'use client';

import { Loader2, X } from 'lucide-react';
import { useState } from 'react';

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
  const [isTemplate, setIsTemplate] = useState(false);
  const [fromTemplateIds, setFromTemplateIds] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [nameError, setNameError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTemplate && !templateName.trim()) {
      setNameError('Template name is required');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">New shopping list</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-6">
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start from templates
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((t) => {
                  const selected = fromTemplateIds.includes(t._id);
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
                      className={`relative w-full text-left rounded-xl border-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md ${
                        selected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200'
                      }`}
                      disabled={isCreating}
                      style={{ padding: 0 }}
                    >
                      <div className="flex flex-col min-h-[64px] relative p-4 pb-0">
                        <div className="flex items-center mb-2">
                          <span className="font-semibold text-gray-800 truncate flex-1">{t.name ?? 'Untitled template'}</span>
                          {selected && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white ml-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </span>
                          )}
                        </div>
                        {t.items && t.items.length > 0 ? (
                          <ul className="space-y-1 z-10 mb-10">
                            {t.items.slice(0, 4).map((item) => (
                              <li key={item._id} className="flex justify-between items-center text-xs text-gray-700">
                                <span className="truncate text-left">{item.name}</span>
                                <span className="text-gray-400 ml-2 min-w-[60px] text-right">
                                  {[item.quantity, item.unit].filter(Boolean).join(' ')}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-gray-400 italic mb-10">No items</div>
                        )}
                      </div>
                      {/* Faded overlay always at the bottom, full width */}
                      {t.items && t.items.length > 4 && (
                        <div className="absolute left-0 right-0 bottom-0 h-10 bg-gradient-to-t from-gray-100/90 to-transparent pointer-events-none rounded-b-xl flex items-end justify-center px-2 pb-2 z-20">
                          <span className="text-xs text-gray-400">+{t.items.length - 4} more…</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={isTemplate}
              onClick={() => setIsTemplate((v) => !v)}
              disabled={isCreating}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                isTemplate ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  isTemplate ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Use as template</span>
          </label>


          {isTemplate && (
            <>
              <div className="mb-2">
                <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">Template name <span className="text-red-500">*</span></label>
                <input
                  id="template-name"
                  type="text"
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  disabled={isCreating}
                  maxLength={64}
                  autoFocus
                  required
                />
                {nameError && <div className="text-xs text-red-500 mt-1">{nameError}</div>}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
