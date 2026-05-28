import React from 'react';
import { Utensils, Car, ShoppingBag, Film, MoreHorizontal, Home, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { Transaction, TransactionType, Category, AppTab } from '../types';

interface TimelineViewProps {
  transactions: Transaction[];
  budgetLimit: number;
  onDeleteTransaction: (id: string) => void;
  onNavigateToTab: (tab: AppTab) => void;
  currencySymbol: string;
}

const CATEGORY_STYLE_MAP: Record<Category, { name: string; icon: any; bg: string; text: string }> = {
  [Category.FOOD]: { name: '餐飲美食', icon: Utensils, bg: 'bg-[#ff7f50]/10', text: 'text-[#a43c12]' },
  [Category.TRANSPORT]: { name: '交通運輸', icon: Car, bg: 'bg-indigo-500/10', text: 'text-indigo-600' },
  [Category.SHOPPING]: { name: '購物百貨', icon: ShoppingBag, bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  [Category.ENTERTAINMENT]: { name: '娛樂休閒', icon: Film, bg: 'bg-purple-500/10', text: 'text-purple-600' },
  [Category.HOUSING]: { name: '居家居住', icon: Home, bg: 'bg-amber-100 dark:bg-amber-950/20', text: 'text-amber-700' },
  [Category.OTHERS]: { name: '其他支出', icon: MoreHorizontal, bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600' }
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  transactions,
  budgetLimit,
  onDeleteTransaction,
  onNavigateToTab,
  currencySymbol
}) => {
  // 1. Calculate active statistics
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const activeBalance = budgetLimit - totalExpense;

  // Percentage of budget limit spent
  const spentPercent = Math.min(100, Math.round((totalExpense / budgetLimit) * 100));

  // Find top spending Category
  const categoryExpenses: Record<Category, number> = {
    [Category.FOOD]: 0,
    [Category.TRANSPORT]: 0,
    [Category.SHOPPING]: 0,
    [Category.ENTERTAINMENT]: 0,
    [Category.HOUSING]: 0,
    [Category.OTHERS]: 0
  };

  transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .forEach(t => {
      categoryExpenses[t.category] += t.amount;
    });

  let topCategory: Category = Category.FOOD;
  let maxExpense = 0;
  Object.keys(categoryExpenses).forEach((key) => {
    const cat = key as Category;
    if (categoryExpenses[cat] > maxExpense) {
      maxExpense = categoryExpenses[cat];
      topCategory = cat;
    }
  });

  const topCategoryName = CATEGORY_STYLE_MAP[topCategory]?.name || '餐飲';
  const topCategoryPercent = totalExpense > 0 ? Math.round((maxExpense / totalExpense) * 100) : 0;

  // Group transactions by date
  // Sort transactions by date descending, then ID descending
  const sortedTransactions = [...transactions].sort((a, b) => {
    return b.date.localeCompare(a.date);
  });

  const grouped: Record<string, Transaction[]> = {};
  sortedTransactions.forEach(t => {
    if (!grouped[t.date]) {
      grouped[t.date] = [];
    }
    grouped[t.date].push(t);
  });

  const getDayLabel = (dateStr: string) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const pad = (num: number) => String(num).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

    if (dateStr === todayStr || dateStr === '2026-05-21') {
      return '今天';
    } else if (dateStr === yesterdayStr || dateStr === '2026-05-20') {
      return '昨天';
    } else {
      const parts = dateStr.split('-');
      return parts.length === 3 ? `${parts[0]}年${parts[1]}月${parts[2]}日` : dateStr;
    }
  };

  return (
    <div className="flex-grow flex flex-col pb-8">
      
      {/* 1. Dashboard core Summary Card */}
      <section className="mb-6">
        <div className="bg-white dark:bg-[#1a1c1e] rounded-2xl p-5 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              本月餘額
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              totalExpense <= budgetLimit 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                : 'bg-red-50 dark:bg-red-950/20 text-red-500'
            }`}>
              {totalExpense <= budgetLimit ? '安全預算內' : '超過限額爆表！'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-extrabold text-zinc-800 dark:text-white">
              {currencySymbol}{activeBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-xs font-bold flex items-center ${activeBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {activeBalance >= 0 ? '+穩定' : '-赤字'}
            </span>
          </div>

          {/* Minimal slider progression bar */}
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                spentPercent > 85 ? 'bg-red-500' : 'bg-teal-500'
              }`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-bold">
            <span>使用率 {spentPercent}%</span>
            <span>預算總額 {currencySymbol}{budgetLimit}</span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Transaction List grouped by date */}
      <section className="flex-grow space-y-6">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <ShieldAlert className="w-10 h-10 mb-3 text-zinc-300" />
            <p className="text-sm font-medium">尚無任何交易明細</p>
            <button 
              onClick={() => onNavigateToTab(AppTab.ENTRY)}
              className="mt-3 text-xs font-bold text-[#a43c12] hover:underline"
              type="button"
            >
              立即手動新增第一筆
            </button>
          </div>
        ) : (
          Object.keys(grouped).map(dateStr => (
            <div key={dateStr} className="space-y-3">
              {/* Date Group Header Divider */}
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-sm text-zinc-400 dark:text-zinc-500 tracking-wider">
                  {getDayLabel(dateStr)}
                </h3>
                <div className="h-px bg-zinc-200/60 dark:bg-zinc-800/60 flex-grow" />
              </div>

              {/* Transactions in Date Group */}
              <div className="space-y-3">
                {grouped[dateStr].map(item => {
                  const style = CATEGORY_STYLE_MAP[item.category] || {
                    name: '其他',
                    icon: MoreHorizontal,
                    bg: 'bg-zinc-100 dark:bg-zinc-800',
                    text: 'text-zinc-650'
                  };

                  const IconComp = style.icon;
                  const isExpense = item.type === TransactionType.EXPENSE;

                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between h-[72px] bg-white dark:bg-[#1a1c1e] px-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/30 shadow-[0_4px_15px_0_rgba(0,0,0,0.015)] hover:border-zinc-200/80 dark:hover:border-zinc-800/80 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        {/* Circle logo */}
                        <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center ${style.text}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        {/* Description content */}
                        <div>
                          <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100 tracking-tight">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-medium">
                            {style.name} • {item.time || '12:00 PM'}
                          </p>
                        </div>
                      </div>

                      {/* Right side interactive columns */}
                      <div className="flex items-center gap-3">
                        <span className={`font-bold font-mono text-base ${
                          isExpense ? 'text-[#a43c12]' : 'text-teal-600'
                        }`}>
                          {isExpense ? '-' : '+'}{currencySymbol}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        
                        {/* Quick deletion trigger on hover or direct click action */}
                        <button
                          onClick={() => onDeleteTransaction(item.id)}
                          className="p-1 text-zinc-300 hover:text-red-500 hover:bg-rose-50 dark:hover:bg-red-950/20 rounded-full transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                          title="刪除此紀錄"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* 3. Double Bento Cards row */}
      <section className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-[#ffdbcf]/60 dark:bg-amber-950/20 p-4 rounded-2xl flex flex-col justify-between h-36 border border-zinc-100/30 dark:border-zinc-800/10">
          <span className="text-[11px] font-bold text-[#822800] dark:text-[#ffb59c] tracking-widest uppercase">
            主要支出類別
          </span>
          <div>
            <p className="font-black text-2xl text-[#380c00] dark:text-[#ffdbcf] leading-none mb-1">
              {topCategoryPercent > 0 ? topCategoryName : '尚無支出'}
            </p>
            <p className="text-xs font-bold text-[#822800] dark:text-[#ffb59c]/80">
              {topCategoryPercent > 0 ? `佔總支出 ${topCategoryPercent}%` : '本月無交易'}
            </p>
          </div>
        </div>

        <div className="bg-[#79f6ed]/10 dark:bg-emerald-950/10 p-4 rounded-2xl flex flex-col justify-between h-36 border border-zinc-100/30 dark:border-zinc-800/10">
          <span className="text-[11px] font-bold text-[#00504c] dark:text-teal-300 tracking-widest uppercase">
            本月盈餘
          </span>
          <div>
            <p className="font-black text-2xl text-[#00201e] dark:text-teal-100 leading-none mb-1 font-mono">
              {currencySymbol}{Math.max(0, activeBalance).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs font-bold text-[#00504c]/80 dark:text-teal-300/80">
              {activeBalance >= 0 ? '理財績效理想' : '支出高於所得'}
            </p>
          </div>
        </div>
      </section>

      {/* Floating Entry Context FAB Action */}
      <button 
        onClick={() => onNavigateToTab(AppTab.ENTRY)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-[#ff7f50] hover:bg-[#ff6d37] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#ff7f50]/40 transition-all transform active:scale-95 duration-100 z-30 cursor-pointer"
        title="記帳"
        type="button"
      >
        <Plus className="w-8 h-8 text-[#6c2000]" />
      </button>

    </div>
  );
};
