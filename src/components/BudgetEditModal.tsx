import React, { useState } from 'react';
import { DollarSign, X } from 'lucide-react';

interface BudgetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
  onSaveLimit: (limit: number) => void;
}

export const BudgetEditModal: React.FC<BudgetEditModalProps> = ({
  isOpen,
  onClose,
  currentLimit,
  onSaveLimit
}) => {
  const [limitInput, setLimitInput] = useState<string>(currentLimit.toFixed(2));
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(limitInput);
    if (isNaN(val) || val <= 0) {
      setError('請輸入大於 0 的有效金額');
      return;
    }
    onSaveLimit(val);
    onClose();
  };

  return (
    <div id="budget-edit-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-neutral-900/40 backdrop-blur-[12px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 dark:border-zinc-800 z-10">
        <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">修改每月預算額度</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
              本月預算目標限額 (USD)
            </label>
            <div className="relative rounded-xl shadow-inner border border-zinc-200 dark:border-zinc-700 focus-within:border-[#ff7f50] focus-within:ring-1 focus-within:ring-[#ff7f50] transition-colors">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-zinc-400 text-lg font-semibold">$</span>
              </div>
              <input
                type="number"
                step="50"
                min="100"
                value={limitInput}
                onChange={(e) => {
                  setError('');
                  setLimitInput(e.target.value);
                }}
                className="w-full h-12 pl-8 pr-4 bg-transparent border-none rounded-xl text-lg font-bold text-zinc-800 dark:text-zinc-150 focus:ring-0 outline-none"
                placeholder="0.00"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-[#ff7f50] text-white shadow-md hover:bg-[#ff6d37] transition-all"
            >
              確認儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
