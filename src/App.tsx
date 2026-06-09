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
import { 
  auth, 
  db, 
  isFirebaseEnabled, 
  handleFirestoreError, 
  OperationType 
} from './services/firebase';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import { doc, collection, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export default function App() {
  const firebaseActive = isFirebaseEnabled();

  // A helper function to get correct initial user data from local database
  const getInitialUserData = () => {
    if (isFirebaseEnabled()) {
      return {
        profile: null,
        transactions: INITIAL_TRANSACTIONS,
        budgetLimit: 10000,
        settings: {
          notifications: true,
          currency: 'USD' as const,
          bioLock: true,
          theme: 'light' as const
        }
      };
    }
    const sessionEmail = AccountDatabase.getCurrentUserEmail();
    const emailToUse = sessionEmail || 'alex.t@clarity.finance';
    const dbUser = AccountDatabase.getUserByEmail(emailToUse);
    if (dbUser) {
      return {
        profile: {
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar
        },
        transactions: dbUser.transactions || [],
        budgetLimit: dbUser.budgetLimit ?? 10000,
        settings: dbUser.settings || {
          notifications: true,
          currency: 'USD' as const,
          bioLock: true,
          theme: 'light' as const
        }
      };
    }
    return {
      profile: {
        name: 'Alex Thompson',
        email: 'alex.t@clarity.finance',
        avatar: ''
      },
      transactions: INITIAL_TRANSACTIONS,
      budgetLimit: 10000,
      settings: {
        notifications: true,
        currency: 'USD' as const,
        bioLock: true,
        theme: 'light' as const
      }
    };
  };

  const initialData = getInitialUserData();

  // 1. Core Profile Session state
  const [authProfile, setAuthProfile] = useState<UserProfile | null>(initialData.profile);

  // 2. Active View Tab routing state
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TIMELINE);

  // 3. Transactions dataset state
  const [transactions, setTransactions] = useState<Transaction[]>(initialData.transactions);

  // 4. Monthly budget target limits
  const [budgetLimit, setBudgetLimit] = useState<number>(initialData.budgetLimit);

  // 5. Shared preferences configurations
  const [settings, setSettings] = useState<AppSettings>(initialData.settings);

  // --- Synchronization Side-effects ---
  
  // A. Change document class based on theme preferences
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // B. Firebase Auth state listener subscription
  useEffect(() => {
    if (!firebaseActive) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthProfile({
          name: user.displayName || '使用者',
          email: user.email || '',
          avatar: user.photoURL || ''
        });
      } else {
        setAuthProfile(null);
      }
    });

    return () => unsubscribe();
  }, [firebaseActive]);

  // C. Firebase Firestore collections real-time listener subscription
  useEffect(() => {
    if (!firebaseActive || !authProfile || !auth?.currentUser) return;

    const uid = auth.currentUser.uid;
    const userDocRef = doc(db, "users", uid);
    const txColRef = collection(db, "users", uid, "transactions");

    // Profile & settings changes observer
    const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.budgetLimit !== undefined) {
          setBudgetLimit(data.budgetLimit);
        }
        if (data.settings) {
          setSettings(data.settings);
        }
        // Real-time synchronization of Profile attributes (Name & Avatar) from DB
        if (data.name || data.avatar !== undefined) {
          setAuthProfile((prev) => {
            if (!prev) return null;
            if (prev.name === data.name && prev.avatar === data.avatar) return prev;
            return {
              ...prev,
              name: data.name || prev.name,
              avatar: data.avatar || prev.avatar || ''
            };
          });
        }
      } else {
        // Automatic setup for first time users
        const nameToUse = auth.currentUser?.displayName || authProfile.name || '使用者';
        setDoc(userDocRef, {
          name: nameToUse,
          email: authProfile.email,
          avatar: authProfile.avatar,
          budgetLimit: 10000,
          settings: {
            notifications: true,
            currency: 'USD',
            bioLock: true,
            theme: 'light'
          }
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${uid}`));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    });

    // Transactions changes observer
    const unsubTx = onSnapshot(txColRef, (querySnap) => {
      const txs: Transaction[] = [];
      querySnap.forEach((doc) => {
        txs.push(doc.data() as Transaction);
      });
      // Order descending like local database storage
      txs.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      });
      setTransactions(txs);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${uid}/transactions`);
    });

    return () => {
      unsubProfile();
      unsubTx();
    };
  }, [authProfile, firebaseActive]);

  // Dynamic currency symbol evaluation
  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'JPY': return '¥';
      case 'EUR': return '€';
      case 'TWD': return 'NT$';
      default: return '$';
    }
  };

  const currencySymbol = getCurrencySymbol();

  // --- Transaction State Mutators ---
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'time'>) => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // first hour is 12
    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const txId = `t-${Date.now()}`;
    const created: Transaction = {
      ...newTx,
      id: txId,
      time: formattedTime
    };

    if (firebaseActive && auth?.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        await setDoc(doc(db, "users", uid, "transactions", txId), created);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}/transactions/${txId}`);
      }
    } else {
      setTransactions(prev => {
        const next = [created, ...prev];
        if (authProfile) {
          AccountDatabase.saveUserData(authProfile.email, { transactions: next });
        }
        return next;
      });
    }
    // Automatically redirect to Timeline overview so users can inspect records
    setActiveTab(AppTab.TIMELINE);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (firebaseActive && auth?.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        await deleteDoc(doc(db, "users", uid, "transactions", id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/transactions/${id}`);
      }
    } else {
      setTransactions(prev => {
        const next = prev.filter(t => t.id !== id);
        if (authProfile) {
          AccountDatabase.saveUserData(authProfile.email, { transactions: next });
        }
        return next;
      });
    }
  };

  const handleClearTransactions = async () => {
    if (firebaseActive && auth?.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        for (const tx of transactions) {
          await deleteDoc(doc(db, "users", uid, "transactions", tx.id));
        }
        setTransactions([]);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${auth.currentUser.uid}/transactions`);
      }
    } else {
      setTransactions([]);
      if (authProfile) {
        AccountDatabase.saveUserData(authProfile.email, { transactions: [] });
      }
    }
  };

  const handleLogout = async () => {
    if (firebaseActive) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Sign out failed:", error);
      }
    } else {
      AccountDatabase.setCurrentUserEmail(null);
      setTransactions([]);
      setBudgetLimit(10000);
      setSettings({
        notifications: true,
        currency: 'USD',
        bioLock: true,
        theme: 'light'
      });
    }
    setAuthProfile(null);
  };

  const handleUpdateLimit = async (limit: number) => {
    setBudgetLimit(limit);
    if (firebaseActive && auth?.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        await updateDoc(doc(db, "users", uid), { budgetLimit: limit });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    } else {
      if (authProfile) {
        AccountDatabase.saveUserData(authProfile.email, { budgetLimit: limit });
      }
    }
  };

  const handleUpdateProfile = async (prof: UserProfile) => {
    setAuthProfile(prof);
    if (firebaseActive && auth?.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        await updateProfile(auth.currentUser, { displayName: prof.name });
        await updateDoc(doc(db, "users", uid), {
          name: prof.name,
          avatar: prof.avatar
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    } else {
      if (authProfile) {
        AccountDatabase.saveUserData(authProfile.email, {
          name: prof.name,
          avatar: prof.avatar
        });
      }
    }
  };

  const handleUpdateSettings = async (sets: AppSettings) => {
    setSettings(sets);
    if (firebaseActive && auth?.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        await updateDoc(doc(db, "users", uid), { settings: sets });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    } else {
      if (authProfile) {
        AccountDatabase.saveUserData(authProfile.email, { settings: sets });
      }
    }
  };

  // Switch tabs programmatically
  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
  };

  // If user is logged out, render Auth layout
  if (!authProfile) {
    return (
      <AuthView 
        onLoginSuccess={(profile) => {
          setAuthProfile(profile);
          if (!firebaseActive) {
            AccountDatabase.setCurrentUserEmail(profile.email);
            const dbUser = AccountDatabase.getUserByEmail(profile.email);
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
          }
        }} 
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
      <div className="w-full max-w-md mx-auto bg-[#f7f9fb] dark:bg-[#191c1e] h-screen h-[100dvh] flex flex-col relative border-x border-zinc-200/20 dark:border-zinc-800/25 shadow-xl shadow-zinc-100 dark:shadow-none animate-fade-in overflow-hidden">
        
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
        <main className="flex-1 px-5 pt-4 pb-[76px] flex flex-col overflow-y-auto scrollbar-none select-none">
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
              onUpdateLimit={handleUpdateLimit}
              onUpdateProfile={handleUpdateProfile}
              onUpdateSettings={handleUpdateSettings}
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
