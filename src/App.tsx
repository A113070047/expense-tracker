import { useState, useEffect } from 'react';
import { User, History, Wallet } from 'lucide-react';
import { AppTab, Transaction, UserProfile, Budget, AppSettings, TransactionType } from './types';
import { INITIAL_TRANSACTIONS } from './data';
import { BottomNavBar } from './components/BottomNavBar';
import { EntryView } from './components/EntryView';
import { TimelineView } from './components/TimelineView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { AccountDatabase } from './services/db';

export default function App() {
  // 1. Core Profile Session state
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(() => {
    // If a current user exists in session records, use that
    const sessionEmail = AccountDatabase.getCurrentUserEmail();
    if (sessionEmail) {
      const dbUser = AccountDatabase.getUserByEmail(sessionEmail);
      if (dbUser) {
        return {
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar
        };
      }
    }
    const saved = localStorage.getItem('qe_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          // Sync with DB
          const dbUser = AccountDatabase.getUserByEmail(parsed.email);
          if (dbUser) {
            return { name: dbUser.name, email: dbUser.email, avatar: dbUser.avatar };
          }
          return parsed;
        }
      } catch (e) { return null; }
    }
    // Start with default profile of Alex Thompson so app is fully ready
    return {
      name: 'Alex Thompson',
      email: 'alex.t@clarity.finance',
      avatar: ''
    };
  });

  // 2. Active View Tab routing state
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TIMELINE);

  // 3. Transactions dataset state
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // 4. Monthly budget target limits
  const [budgetLimit, setBudgetLimit] = useState<number>(10000);

  // 5. Shared preferences configurations
  const [settings, setSettings] = useState<AppSettings>({
    notifications: true,
    currency: 'USD',
    bioLock: true,
    theme: 'light'
  });

  // --- Synchronization Side-effects ---
  
  // A. Change document class based on theme preferences
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // B. Switch loaded data whenever a user logs in / changes session
  useEffect(() => {
    if (authProfile) {
      localStorage.setItem('qe_profile', JSON.stringify(authProfile));
      AccountDatabase.setCurrentUserEmail(authProfile.email);
      // Fetch details from multiuser database system if user account exists
      const dbUser = AccountDatabase.getUserByEmail(authProfile.email);
      if (dbUser) {
        setTransactions(dbUser.transactions || []);
        setBudgetLimit(dbUser.budgetLimit ?? 10000);
        setSettings(dbUser.settings || {
          notifications: true,
          currency: 'USD',
          bioLock: true,
          theme: 'light'
        });
      }
    } else {
      localStorage.removeItem('qe_profile');
      AccountDatabase.setCurrentUserEmail(null);
    }
  }, [authProfile]);

  // C. Save custom budget limit, transactions, and settings updates back to the multiuser database automatically
  useEffect(() => {
    if (authProfile) {
      AccountDatabase.saveUserData(authProfile.email, {
        transactions,
        budgetLimit,
        settings,
        name: authProfile.name,
        avatar: authProfile.avatar
      });
    }
  }, [authProfile, transactions, budgetLimit, settings]);

  // Dynamic currency symbol evaluation
  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'JPY': return '¥';
      case 'EUR': return '€';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol();

  // --- Transaction State Mutators ---
  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'time'>) => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // first hour is 12
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const created: Transaction = {
      ...newTx,
      id: `t-${Date.now()}`,
      time: formattedTime
    };

    setTransactions(prev => [created, ...prev]);
    // Automatically redirect to Timeline overview so users can inspect records
    setActiveTab(AppTab.TIMELINE);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleClearTransactions = () => {
    setTransactions([]);
  };

  const handleLogout = () => {
    setAuthProfile(null);
  };

  // Switch tabs programmatically
  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
  };

  // If user is logged out, render Auth layout
  if (!authProfile) {
    return (
      <AuthView 
        onLoginSuccess={(profile) => setAuthProfile(profile)} 
      />
    );
  }

  // Header Title dynamic mapping
  const getHeaderTitle = () => {
    switch (activeTab) {
      case AppTab.ENTRY: return '快速記帳';
      case AppTab.TIMELINE: return '交易明細';
      case AppTab.ANALYTICS: return '數據分析';
      case AppTab.SETTINGS: return '設定';
      default: return '快速記帳';
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] dark:bg-zinc-950 text-[#191c1e] dark:text-[#f7f9fb] flex flex-col font-sans transition-colors duration-200">
      
      {/* Centered Device shell context block to present pristine visual balance on desktop */}
      <div className="w-full max-w-md mx-auto bg-[#f7f9fb] dark:bg-[#191c1e] min-h-screen flex flex-col relative pb-32 border-x border-zinc-200/20 dark:border-zinc-800/25 shadow-xl shadow-zinc-100 dark:shadow-none animate-fade-in">
        
        {/* Top Header Bar component */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md w-full h-14 border-b border-zinc-150/40 dark:border-zinc-800/10 flex justify-between items-center px-5">
          {/* Top Left Avatar action block (Navigates straight to settings) */}
          <button 
            onClick={() => setActiveTab(AppTab.SETTINGS)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer border ${
              activeTab === AppTab.SETTINGS 
                ? 'border-[#ff7f50] bg-[#ffdbcf]/55' 
                : 'border-transparent bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-[#a43c12] dark:text-[#ffb59c]'
            }`}
            title="查看帳號設定"
            type="button"
          >
            <User className="w-5 h-5" />
          </button>

          {/* Centralized dynamic title */}
          <h1 className="text-xl font-extrabold text-[#a43c12] dark:text-[#ffb59c] tracking-tight">
            {getHeaderTitle()}
          </h1>

          {/* Top Right History action block (Navigates straight to Timeline) */}
          <button 
            onClick={() => setActiveTab(AppTab.TIMELINE)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              activeTab === AppTab.TIMELINE 
                ? 'bg-[#ffdbcf] text-[#822800]' 
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 text-zinc-650'
            }`}
            title="查看明細"
            type="button"
          >
            <History className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </header>

        {/* Primary Main View Container content */}
        <main className="flex-1 px-5 pt-5 flex flex-col select-none">
          {activeTab === AppTab.ENTRY && (
            <EntryView 
              onAddTransaction={handleAddTransaction} 
              currencySymbol={currencySymbol} 
            />
          )}

          {activeTab === AppTab.TIMELINE && (
            <TimelineView
              transactions={transactions}
              budgetLimit={budgetLimit}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigateToTab={handleTabChange}
              currencySymbol={currencySymbol}
            />
          )}

          {activeTab === AppTab.ANALYTICS && (
            <AnalyticsView 
              transactions={transactions} 
              budgetLimit={budgetLimit}
              currencySymbol={currencySymbol}
            />
          )}

          {activeTab === AppTab.SETTINGS && (
            <SettingsView
              userProfile={authProfile}
              budgetLimit={budgetLimit}
              settings={settings}
              transactions={transactions}
              onUpdateLimit={(limit) => setBudgetLimit(limit)}
              onUpdateProfile={(prof) => setAuthProfile(prof)}
              onUpdateSettings={(sets) => setSettings(sets)}
              onClearTransactions={handleClearTransactions}
              onLogout={handleLogout}
              currencySymbol={currencySymbol}
            />
          )}
        </main>

        {/* Universal Bottom Navigation */}
        <BottomNavBar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />

      </div>
    </div>
  );
}
