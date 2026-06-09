import React, { useState } from 'react';
import { Calendar, Utensils, Car, ShoppingBag, Film, MoreHorizontal, Delete, Home } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';
import { DatePickerModal } from './DatePickerModal';

interface EntryViewProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'time'>) => void;
  currencySymbol: string;
}

const CATEGORY_MAP = [
  { key: Category.FOOD, label: '餐飲', icon: Utensils, activeColor: 'bg-[#ff7f50] text-[#6c2000]' },
  { key: Category.TRANSPORT, label: '交通', icon: Car, activeColor: 'bg-indigo-500 text-white' },
  { key: Category.SHOPPING, label: '購物', icon: ShoppingBag, activeColor: 'bg-emerald-500 text-white' },
  { key: Category.ENTERTAINMENT, label: '娛樂', icon: Film, activeColor: 'bg-purple-500 text-white' },
  { key: Category.HOUSING, label: '居住', icon: Home, activeColor: 'bg-amber-500 text-white' },
  { key: Category.OTHERS, label: '其他', icon: MoreHorizontal, activeColor: 'bg-zinc-500 text-white' }
];

export const EntryView: React.FC<EntryViewProps> = ({ onAddTransaction, currencySymbol }) => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.FOOD);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // Handle number dial keys
  const handleKeyClick = (key: string) => {
    setSaveStatus('');
    
    // Prevent extremely long inputs to avoid UI distortion
    if (amountStr.replace('.', '').length >= 9) return;

    if (key === '.') {
      if (amountStr.includes('.')) return;
      setAmountStr(prev => prev + '.');
    } else {
      // Avoid raw leading zeros double digits
      if (amountStr === '0') {
        setAmountStr(key);
        return;
      }
      
      // Enforce max 2 decimal places
      if (amountStr.includes('.')) {
        const parts = amountStr.split('.');
        if (parts[1] && parts[1].length >= 2) return;
      }

      setAmountStr(prev => prev + key);
    }
  };

  // Handle backspace delete
  const handleDeleteClick = () => {
    setSaveStatus('');
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr(prev => prev.slice(0, -1));
    }
  };

  // Trigger Save
  const handleSave = () => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) {
      setSaveStatus('請輸入有效金額！');
      return;
    }

    // Assign automatic descriptive titles based on category
    let title = '';
    switch (selectedCategory) {
      case Category.FOOD:
        title = '休閒餐點 / 飲料消費';
        break;
      case Category.TRANSPORT:
        title = '交通乘車費用';
        break;
      case Category.SHOPPING:
        title = '日常百貨與購物';
        break;
      case Category.ENTERTAINMENT:
        title = '影音娛樂休閒支出';
        break;
      case Category.HOUSING:
        title = '居家居住與房租費用';
        break;
      default:
        title = '其他雜項支出';
    }

    onAddTransaction({
      title,
      amount: val,
      type: TransactionType.EXPENSE,
      category: selectedCategory,
      date: selectedDate
    });

    setSaveStatus('儲存成功！');
    // Reset amount
    setAmountStr('0');
    
    // Quick timeout reset
    setTimeout(() => {
      setSaveStatus('');
    }, 1500);
  };

  return (
    <div className="flex-grow flex flex-col justify-between pb-1.5">
      {/* Upper Input Display Card */}
      <section className="mb-3 text-center py-4 bg-white dark:bg-[#1a1c1e] rounded-[18px] shadow-sm border border-zinc-200/50 dark:border-[#2d3133]/50 relative">
        
        {/* Clickable Date Picker trigger */}
        <button 
          onClick={() => setIsDatePickerOpen(true)}
          className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800/85 rounded-lg text-[#57423b] dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          type="button"
        >
          <Calendar className="w-3.5 h-3.5 text-[#a43c12]" />
          <span className="text-[11px] font-bold">{selectedDate}</span>
        </button>

        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mb-0.5">
          支出金額
        </p>

        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="text-3xl font-extrabold text-[#a43c12]">{currencySymbol}</span>
          <span className="text-3xl font-black text-zinc-805 dark:text-zinc-100 font-mono tracking-tight">
            {amountStr}
          </span>
          {/* Pulsating Cursor */}
          <span className="w-1 h-6.5 bg-[#ff7f50] rounded-full animate-pulse transition-opacity" />
        </div>
      </section>

      {/* Category selection - Clean 6-column grid layout */}
      <section className="mb-3.5">
        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 px-1 mb-2 uppercase tracking-wider">
          選擇類別
        </p>
        <div className="grid grid-cols-6 gap-1 py-0.5">
          {CATEGORY_MAP.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const IconComponent = cat.icon;

            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className="flex flex-col items-center gap-1 w-full cursor-pointer group"
                type="button"
              >
                <div className={`w-[40px] h-[40px] min-[360px]:w-[46px] min-[360px]:h-[46px] rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all ${
                  isSelected
                    ? cat.activeColor + ' ring-2 ring-offset-1 ring-zinc-300 dark:ring-zinc-700'
                    : 'bg-[#eceef0]/90 dark:bg-zinc-800 text-[#57423b] dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}>
                  <IconComponent className="w-[18px] h-[18px] min-[360px]:w-[20px] min-[360px]:h-[20px]" />
                </div>
                <span className={`text-[10px] min-[360px]:text-[11px] font-bold tracking-wide transition-colors ${
                  isSelected ? 'text-[#a43c12] dark:text-[#ffb59c]' : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Custom key-dial panel */}
      <section className="grid grid-cols-3 gap-2 mb-3.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeyClick(digit)}
            className="h-[40px] min-[360px]:h-[46px] rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 font-semibold text-lg text-zinc-850 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer font-sans"
            type="button"
          >
            {digit}
          </button>
        ))}
        {/* Backspace Button */}
        <button
          onClick={handleDeleteClick}
          className="h-[40px] min-[360px]:h-[46px] rounded-xl bg-red-50 dark:bg-rose-950/20 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-950/40 active:scale-95 transition-all cursor-pointer text-red-500"
          type="button"
        >
          <Delete className="w-[18px] h-[18px]" />
        </button>
      </section>

      {/* Interactive Save action */}
      <div className="relative">
        {saveStatus && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-800 text-white rounded-full px-4 py-1 text-xs font-semibold animate-bounce shadow-md">
            {saveStatus}
          </div>
        )}
        <button
          onClick={handleSave}
          className="w-full h-[42px] min-[360px]:h-[48px] bg-[#a43c12] hover:bg-[#8b2b06] text-white font-bold text-[15px] min-[360px]:text-base rounded-xl shadow-md active:scale-[0.98] transition-all cursor-pointer"
          type="button"
        >
          儲存支出
        </button>
      </div>

      {/* Modals */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={setSelectedDate}
        initialDate={selectedDate}
      />
    </div>
  );
};
