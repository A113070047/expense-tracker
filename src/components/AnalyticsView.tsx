import React from 'react';
import { Home, Utensils, Car, ShoppingBag, Film, MoreHorizontal, ArrowDown, Sparkles } from 'lucide-react';
import { Transaction, TransactionType, Category } from '../types';

interface AnalyticsViewProps {
  transactions: Transaction[];
  budgetLimit: number;
  currencySymbol: string;
}

const CATEGORY_META: Record<Category, { name: string; icon: any; color: string; bg: string; border: string }> = {
  [Category.HOUSING]: { name: '居住', icon: Home, color: '#ca8a04', bg: 'bg-yellow-500/10', border: 'border-l-4 border-yellow-600' },
  [Category.FOOD]: { name: '餐飲美食', icon: Utensils, color: '#2563eb', bg: 'bg-blue-550/10', border: 'border-l-4 border-blue-600' },
  [Category.TRANSPORT]: { name: '交通運輸', icon: Car, color: '#0d9488', bg: 'bg-teal-500/10', border: 'border-l-4 border-teal-600' },
  [Category.SHOPPING]: { name: '生活購物', icon: ShoppingBag, color: '#16a34a', bg: 'bg-emerald-500/10', border: 'border-l-4 border-emerald-600' },
  [Category.ENTERTAINMENT]: { name: '休閒娛樂', icon: Film, color: '#9333ea', bg: 'bg-purple-500/10', border: 'border-l-4 border-purple-600' },
  [Category.OTHERS]: { name: '其他雜項', icon: MoreHorizontal, color: '#db2777', bg: 'bg-rose-500/10', border: 'border-l-4 border-rose-600' }
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  budgetLimit,
  currencySymbol
}) => {
  // Filter for expenses
  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const expenseByCategory: Record<Category, number> = {
    [Category.HOUSING]: 0,
    [Category.FOOD]: 0,
    [Category.TRANSPORT]: 0,
    [Category.SHOPPING]: 0,
    [Category.ENTERTAINMENT]: 0,
    [Category.OTHERS]: 0
  };

  expenses.forEach(t => {
    expenseByCategory[t.category] += t.amount;
  });

  // Sort categories by expenditure size
  const sortedCategories = (Object.keys(expenseByCategory) as Category[])
    .map(cat => ({
      category: cat,
      amount: expenseByCategory[cat],
      percent: totalExpense > 0 ? Math.round((expenseByCategory[cat] / totalExpense) * 100) : 0
    }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Calculate daily average (assuming current day is May 21st, 2026, so 21 days have passed)
  const daysPassed = 21;
  const dailyAverage = totalExpense > 0 ? Math.round(totalExpense / daysPassed) : 0;

  // Calculate budget statistics
  const budgetSpentPercent = Math.min(100, Math.round((totalExpense / budgetLimit) * 100));
  const budgetRemaining = Math.max(0, budgetLimit - totalExpense);

  // Let's build the Donut Chart sectors matching the SVG structure!
  // To keep it high-fidelity, our circle matches radius r = 15.91549430918954 (circumference = 100)
  // This guarantees sector widths correspond directly with our percentage totals.
  let cumulativeOffset = 0;
  const donutSectors = sortedCategories.map(item => {
    const strokeDasharray = `${item.percent} ${100 - item.percent}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += item.percent;

    return {
      category: item.category,
      color: CATEGORY_META[item.category]?.color || '#9ca3af',
      strokeDasharray,
      strokeDashoffset,
      percent: item.percent,
      name: CATEGORY_META[item.category]?.name || '其他'
    };
  });

  return (
    <div className="flex-grow flex flex-col gap-6 pb-8">
      
      {/* 1. Month Hero Statistics area */}
      <section className="bg-white dark:bg-[#1a1c1e] rounded-2xl p-5 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center">
        <div className="w-full flex justify-between items-end mb-4">
          <div>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              本月支出
            </span>
            <p className="text-3xl font-extrabold text-zinc-800 dark:text-white mt-1">
              {currencySymbol}{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-zinc-400 mt-1 font-bold">
              上月總支出: {currencySymbol}9,650.00
            </p>
          </div>

          <div className="bg-teal-50 dark:bg-emerald-950/20 text-teal-600 px-3 py-1 rounded-full flex items-center gap-1">
            <ArrowDown className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold text-teal-600">較上月減少 12%</span>
          </div>
        </div>

        {/* 2. Custom Responsive SVG Donut Chart */}
        <div className="relative w-60 h-60 flex items-center justify-center my-4">
          {totalExpense === 0 ? (
            // Default placeholder when no expenses exist
            <svg className="w-full h-full -rotate-90 animate-fade-in" viewBox="0 0 42 42">
              <circle
                cx="21"
                cy="21"
                fill="transparent"
                r="15.91549430918954"
                stroke="#eceef0"
                strokeWidth="5"
              />
            </svg>
          ) : (
            <svg className="w-full h-full -rotate-90 animate-fade-in" viewBox="0 0 42 42">
              <circle
                cx="21"
                cy="21"
                fill="transparent"
                r="15.91549430918954"
                stroke="#eceef0"
                strokeWidth="5.2"
              />
              {donutSectors.map((sector) => (
                <circle
                  key={sector.category}
                  className="transition-all duration-500"
                  cx="21"
                  cy="21"
                  fill="transparent"
                  r="15.91549430918954"
                  stroke={sector.color}
                  strokeWidth="5.2"
                  strokeDasharray={sector.strokeDasharray}
                  strokeDashoffset={sector.strokeDashoffset}
                />
              ))}
            </svg>
          )}

          {/* Centered label */}
          <div className="absolute flex flex-col items-center text-center">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              日均支出
            </span>
            <span className="text-2xl font-extrabold text-zinc-800 dark:text-white">
              {currencySymbol}{dailyAverage}
            </span>
          </div>

          {/* Dynamic Category Labels Overlaid on visual corners as shown in user's mockup */}
          {donutSectors.slice(0, 3).map((sec, idx) => {
            // Placement coordinates based on sector indices to distribute nicely
            const placements = [
              '-right-2 top-10', // index 0 top-right
              '-left-3 bottom-12',  // index 1 bottom-left
              '-left-2 top-10'       // index 2 top-left
            ];

            return (
              <div 
                key={sec.category} 
                className={`absolute bg-white/90 dark:bg-zinc-950/90 backdrop-blur-sm p-1.5 px-2 rounded-xl border shadow-sm flex flex-col ${placements[idx] || 'hidden'}`}
                style={{ borderColor: sec.color }}
              >
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 leading-none">
                  {sec.name}
                </span>
                <span className="text-xs font-black text-zinc-800 dark:text-white leading-none mt-0.5">
                  {sec.percent}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Budget limits slider progression panel */}
      <section className="bg-white dark:bg-[#1a1c1e] rounded-2xl p-5 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-250">
            每月預算
          </h3>
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
            已使用 {budgetSpentPercent}%
          </span>
        </div>

        {/* Custom Progress Bar */}
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden mb-3">
          <div 
            className={`h-full rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] transition-all ${
              budgetSpentPercent > 85 ? 'bg-[#ff7f50]' : 'bg-teal-500'
            }`}
            style={{ width: `${budgetSpentPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <p className="text-zinc-700 dark:text-zinc-300 font-semibold">
            已支出 {currencySymbol}{Math.round(totalExpense).toLocaleString()} 
            <span className="text-zinc-400 font-normal"> / 總額 {currencySymbol}{budgetLimit.toLocaleString()}</span>
          </p>
          <p className="text-xs font-bold text-[#a43c12] dark:text-[#ffb59c]">
            剩餘 {currencySymbol}{Math.max(0, budgetRemaining).toLocaleString()}
          </p>
        </div>
      </section>

      {/* 4. Categorized spending bar graph list */}
      <section className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-150">
            熱門類別
          </h3>
          <span className="text-xs font-bold text-teal-600 hover:underline cursor-pointer">
            查看全部
          </span>
        </div>

        <div className="space-y-3">
          {sortedCategories.slice(0, 3).map((item) => {
            const style = CATEGORY_META[item.category] || {
              name: '其他',
              icon: MoreHorizontal,
              color: '#9ca3af',
              bg: 'bg-zinc-100',
              border: 'border-l-4 border-zinc-400'
            };

            const IconComp = style.icon;

            return (
              <div 
                key={item.category} 
                className={`bg-white dark:bg-[#1a1c1e] h-[72px] px-4 rounded-2xl flex items-center justify-between shadow-sm ${style.border}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full ${style.bg} flex items-center justify-center`} style={{ color: style.color }}>
                    <IconComp className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{style.name}</p>
                    <p className="text-xs text-zinc-400">佔總支出的 {item.percent}%</p>
                  </div>
                </div>
                <p className="font-extrabold text-base text-zinc-800 dark:text-zinc-150">
                  {currencySymbol}{item.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Expert Advisory Banner */}
      <div className="relative w-full h-32 rounded-2xl overflow-hidden group border border-zinc-100/50 dark:border-zinc-800/10 shadow-sm">
        {/* Background Decorative Image matched with visual gradient overlay in mockup */}
        <img 
          alt="財務規劃背景" 
          className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-500" 
          referrerPolicy="no-referrer"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2eCbEZ8XeV7GkI8DFlwuZGJoA2qeo2HbEixCVxDDwahXfkpkSrUarmYNHdcK2cjhHTn3F1KVOb4z_b0ysQ-BrHOGKVvVzc74Z1iEVP7uXk5gKUEp3Bpn9S9jJSJf7yWDOhouPTh0JhW9-nS0D7bBHTSBCqc9Q01b0JT53q359gFSOWfHwPccXU4pvXii7zQtseULnuErhWuM5WQPtfF1xzJXklfxmsKkDeGIkhR3-l23ysX_svjbSYCPbMmBOGHnlOkQuu2WfRAH0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent flex flex-col justify-center px-5 py-4">
          <div className="flex items-center gap-1.5 text-amber-400 mb-1">
            <Sparkles className="w-4 h-4 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              專家建議
            </span>
          </div>
          <h4 className="font-bold text-base text-white tracking-tight leading-tight">
            下個月可多省下 {currencySymbol}450
          </h4>
          <p className="text-xs text-[#76f3ea] mt-0.5 font-medium opacity-90">
            只需減少「餐飲美食」支出 15% 即可達成此理財目標
          </p>
        </div>
      </div>

    </div>
  );
};
