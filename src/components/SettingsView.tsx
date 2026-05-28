import React, { useState } from 'react';
import { User, Bell, Coins, Lock, Download, Trash2, ChevronRight, Edit3, Check, Sun, Moon } from 'lucide-react';
import { AppSettings, UserProfile, Transaction, TransactionType } from '../types';
import { BudgetEditModal } from './BudgetEditModal';

interface SettingsViewProps {
  userProfile: UserProfile;
  budgetLimit: number;
  settings: AppSettings;
  transactions: Transaction[];
  onUpdateLimit: (limit: number) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onClearTransactions: () => void;
  onLogout: () => void;
  currencySymbol: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  budgetLimit,
  settings,
  transactions,
  onUpdateLimit,
  onUpdateProfile,
  onUpdateSettings,
  onClearTransactions,
  onLogout,
  currencySymbol
}) => {
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(userProfile.name);
  const [profileEmail, setProfileEmail] = useState<string>(userProfile.email);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);

  // Calculate本月已花費
  const totalSpent = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const spentPercent = Math.min(100, Math.round((totalSpent / budgetLimit) * 100));

  // Toggle helpers
  const handleToggleNotification = () => {
    onUpdateSettings({
      ...settings,
      notifications: !settings.notifications
    });
  };

  const handleToggleBioLock = () => {
    onUpdateSettings({
      ...settings,
      bioLock: !settings.bioLock
    });
  };

  const handleToggleTheme = () => {
    onUpdateSettings({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark'
    });
  };

  const handleCycleCurrency = () => {
    const currences: ('USD' | 'TWD' | 'HKD' | 'JPY' | 'EUR')[] = ['USD', 'TWD', 'HKD', 'JPY', 'EUR'];
    const currentIndex = currences.indexOf(settings.currency);
    const nextIndex = (currentIndex + 1) % currences.length;
    onUpdateSettings({
      ...settings,
      currency: currences[nextIndex]
    });
  };

  const currencyLabelMap = {
    USD: 'USD ($) - 美元',
    TWD: 'TWD ($) - 新台幣',
    HKD: 'HKD ($) - 港幣',
    JPY: 'JPY (¥) - 日圓',
    EUR: 'EUR (€) - 歐元'
  };

  // Profile save helper
  const handleSaveProfile = () => {
    onUpdateProfile({
      ...userProfile,
      name: profileName,
      email: profileEmail
    });
    setIsEditingProfile(false);
  };

  // CSV Generator downloader
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('無交易紀錄可供匯出');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // Add BOM for Excel Chinese reading
    csvContent += '編號,名稱,金額,類型,類別,日期,時間\r\n';

    transactions.forEach(t => {
      const typeLabel = t.type === TransactionType.EXPENSE ? '支出' : '收入';
      csvContent += `${t.id},"${t.title.replace(/"/g, '""')}",${t.amount},${typeLabel},${t.category},${t.date},${t.time || '12:00 PM'}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'quick_expense_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-grow flex flex-col gap-6 pb-8">
      
      {/* SECTION 1: 個人帳戶 */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
          個人帳戶
        </h2>

        {isEditingProfile ? (
          <div className="bg-white dark:bg-[#1a1c1e] rounded-2xl p-5 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1">編輯姓名</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1">編輯電子郵件</label>
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold text-zinc-800 dark:text-zinc-200 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold transition-all"
                type="button"
              >
                取消
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-2 bg-[#a43c12] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                type="button"
              >
                <Check className="w-3.5 h-3.5" /> 儲存修改
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditingProfile(true)}
            className="bg-white dark:bg-[#1a1c1e] rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 hover:border-zinc-200 cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 flex items-center justify-center border border-[#ffdbcf]/50">
              <img 
                alt="Profile" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvvn2embSo4Az_mnIzQI9mXW0cjU0C6THpN9dj3cR5S-eIO3kRhfayjcYgCKOdv2qX0aVpS8GXziAbSO-DCZqx3YsN2O8HCOcj_CimMgGFghDmhHwJFohKkFKJHVrlOI6e9rbTk01RGuOR5R7wbBhBrk0ULB00q8CW_OMT9MxCVjw5b16KDWlRPSBL_lzCjmznUHrZUBZHEXmYFiHdqAYgMGobJDNfezO5D2FEokTvVZgl72-a-jndenVh82pslYHbpP4HapEZcHMp"
              />
            </div>
            <div className="flex-grow">
              <p className="font-extrabold text-lg text-zinc-800 dark:text-white flex items-center gap-1.5">
                {userProfile.name}
                <Edit3 className="w-3.5 h-3.5 text-[#a43c12] cursor-pointer hover:scale-110 transition-transform" />
              </p>
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                {userProfile.email}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </div>
        )}
      </section>

      {/* SECTION 2: 每月預算目標 */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
          每月預算目標
        </h2>
        
        <div className="bg-white dark:bg-[#1a1c1e] rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-zinc-400 font-semibold mb-1">當前預算目標限額</p>
              <p className="text-3xl font-black text-[#a43c12] dark:text-[#ffb59c]">
                {currencySymbol}{budgetLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button 
              onClick={() => setIsEditBudgetOpen(true)}
              className="bg-[#ffdbcf] dark:bg-rose-950/40 text-[#822800] dark:text-[#ffb59c] px-4 py-2 rounded-full text-xs font-black transition-all hover:bg-[#ffcdc0] active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
              type="button"
            >
              <Edit3 className="w-3.5 h-3.5" /> 編輯目標
            </button>
          </div>

          <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-400">本月已支出金額</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-black">
                {currencySymbol}{totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  spentPercent > 85 ? 'bg-red-500' : 'bg-teal-500'
                }`}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
            <p className="text-[11px] font-bold text-[#006a65] dark:text-teal-400 flex items-center gap-1">
              <span>已累計使用額度的 {spentPercent}% • 距離結帳尚餘 12 天</span>
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: 偏好設定 */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
          偏好設定
        </h2>

        <div className="bg-white dark:bg-[#1a1c1e] rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
          
          {/* Item 1: 通知提醒 */}
          <div 
            onClick={handleToggleNotification} 
            className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Bell className="w-5 h-5 text-zinc-650" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-150">通知提醒</p>
                <p className="text-xs text-zinc-400 font-medium">每日早晚記帳定時提示</p>
              </div>
            </div>
            {/* Custom Toggle switch */}
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
              settings.notifications ? 'bg-[#ff7f50]' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                settings.notifications ? 'right-1' : 'left-1'
              }`} />
            </div>
          </div>

          {/* Item 2: 主要貨幣 */}
          <div 
            onClick={handleCycleCurrency} 
            className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Coins className="w-5 h-5 text-zinc-650" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-150">主要貨幣</p>
                <p className="text-xs text-zinc-400 font-medium">{currencyLabelMap[settings.currency]}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#a43c12] flex items-center gap-0.5">
              切換 <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          {/* Item 3: 隱私與安全 */}
          <div 
            onClick={handleToggleBioLock} 
            className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Lock className="w-5 h-5 text-zinc-650" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-150">安全鎖定保護</p>
                <p className="text-xs text-zinc-400 font-medium">
                  {settings.bioLock ? '生物識別解鎖 (FaceID/指紋) 已啟用' : '已關閉解鎖保護'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
              settings.bioLock ? 'bg-[#ff7f50]' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                settings.bioLock ? 'right-1' : 'left-1'
              }`} />
            </div>
          </div>

          {/* Item 4: 深色與淺色色調 */}
          <div 
            onClick={handleToggleTheme} 
            className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {settings.theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-indigo-400" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-150">深淺色調切換</p>
                <p className="text-xs text-zinc-400 font-medium">
                  {settings.theme === 'dark' ? '已啟用深色極簡主題' : '已啟用明亮粉白主題'}
                </p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
              settings.theme === 'dark' ? 'bg-[#ff7f50]' : 'bg-zinc-200 dark:bg-zinc-700'
            }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                settings.theme === 'dark' ? 'right-1' : 'left-1'
              }`} />
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4: 數據管理 */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">
          數據管理
        </h2>

        <div className="bg-white dark:bg-[#1a1c1e] rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
          
          {/* Export action */}
          <div 
            onClick={handleExportCSV} 
            className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-emerald-950/20 flex items-center justify-center text-teal-600">
                <Download className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-zinc-800 dark:text-zinc-150">匯出所有大宗數據</p>
            </div>
            <span className="text-xs font-bold text-teal-600">CSV 試算表</span>
          </div>

          {/* Delete action */}
          <div className="p-4 bg-white dark:bg-[#1a1c1e]">
            {confirmClearOpen ? (
              <div className="space-y-3 bg-red-50/50 dark:bg-red-950/10 p-3.5 rounded-xl border border-red-100 dark:border-red-950/30">
                <p className="text-xs font-bold text-[#ba1a1a]">
                  警告：此動作將永遠清除您所有記帳歷史記錄，確定繼續？
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setConfirmClearOpen(false)}
                    className="flex-1 py-1.5 bg-zinc-100 text-zinc-650 rounded-lg text-xs font-bold"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => {
                      onClearTransactions();
                      setConfirmClearOpen(false);
                      alert('已成功清除所有交易檔案！');
                    }}
                    className="flex-1 py-1.5 bg-[#ba1a1a] text-white rounded-lg text-xs font-bold"
                  >
                    確定完全清除
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setConfirmClearOpen(true)}
                className="flex items-center justify-between hover:opacity-80 cursor-pointer transition-opacity"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-rose-950/30 flex items-center justify-center text-[#ba1a1a]">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-[#ba1a1a]">清除全體交易記錄</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Account Demount Logout Action */}
      <section className="pt-2">
        <button
          onClick={onLogout}
          className="w-full h-12 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-sm font-bold rounded-2xl transition-all cursor-pointer"
          type="button"
        >
          登出登錄帳號 (瀏覽首頁登入)
        </button>
      </section>

      {/* Info bottom text signature */}
      <footer className="text-center py-6 space-y-1">
        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
          QUICK EXPENSE V2.4.1
        </p>
        <p className="text-xs text-zinc-400 leading-none opacity-60">
          為財務清晰而生 • Designed in Taiwan
        </p>
      </footer>

      {/* Budget Limit settings popup */}
      <BudgetEditModal
        isOpen={isEditBudgetOpen}
        onClose={() => setIsEditBudgetOpen(false)}
        currentLimit={budgetLimit}
        onSaveLimit={onUpdateLimit}
      />

    </div>
  );
};
