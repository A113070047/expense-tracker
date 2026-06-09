import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Wallet, ShieldCheck, ArrowLeft, CheckCircle, KeyRound, Info, Database, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';
import { AccountDatabase } from '../services/db';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth, isFirebaseEnabled, googleProvider, firebaseConfig } from '../services/firebase';

interface AuthViewProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

// Helper to decode third-party Google GSI JWT tokens on client-side
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT Token:', error);
    return null;
  }
};

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Forgot password specific sub-states
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);
  const [firebaseError, setFirebaseError] = useState<{ type: 'email' | 'google' | 'general'; message: string; code?: string } | null>(null);

  const firebaseActive = isFirebaseEnabled();

  // Dynamically load Google GSI only if Firebase is not active (or as side fallback)
  useEffect(() => {
    if (firebaseActive) return; // For Firebase, we prefer signInWithPopup directly!

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const initGoogleGSI = () => {
      const google = (window as any).google;
      if (google?.accounts?.id && !isForgotPasswordMode) {
        google.accounts.id.initialize({
          client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '1043254924183-dummy.apps.googleusercontent.com',
          callback: (response: any) => {
            const decoded = decodeJwt(response.credential);
            if (decoded && decoded.email) {
              const googleProfile = AccountDatabase.registerOrLoginGoogle(
                decoded.email,
                decoded.name || 'Google 使用者',
                decoded.picture || ''
              );
              onLoginSuccess(googleProfile);
            }
          }
        });

        const btnElement = document.getElementById('google-signin-btn');
        if (btnElement) {
          google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: isSignUpMode ? 'signup_with' : 'signin_with',
          });
        }
      }
    };

    const checkInterval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogleGSI();
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [isSignUpMode, isForgotPasswordMode, firebaseActive]);

  // Trigger Auth Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirebaseError(null);
    
    if (!email.trim() || !password) {
      alert('請填寫所有欄位！');
      return;
    }

    setIsLoading(true);

    if (isSignUpMode) {
      if (password !== confirmPassword) {
        alert('兩次輸入的密碼不一致！請重新確認。');
        setIsLoading(false);
        return;
      }
      
      if (firebaseActive) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          await updateProfile(user, { displayName: username });
          
          // Seed initial profile document in firestore
          await setDoc(doc(db, "users", user.uid), {
            name: username || '新使用者',
            email: email,
            avatar: '',
            budgetLimit: 10000,
            settings: {
              notifications: true,
              currency: 'USD',
              bioLock: true,
              theme: 'light'
            }
          });

          onLoginSuccess({
            email: user.email || '',
            name: username || '新使用者',
            avatar: ''
          });
        } catch (error: any) {
          console.error(error);
          if (error.code === 'auth/operation-not-allowed' || error.message?.includes('operation-not-allowed')) {
            setFirebaseError({
              type: 'email',
              code: 'auth/operation-not-allowed',
              message: '這個 Firebase 專案的「電子郵件/密碼 (Email/Password)」登入提供者尚未啟用。'
            });
          } else {
            setFirebaseError({
              type: 'general',
              message: 'Firebase 註冊失敗: ' + (error.message || error)
            });
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        const res = AccountDatabase.register(email, password, username);
        setIsLoading(false);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          alert(res.message);
        }
      }
    } else {
      if (firebaseActive) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          onLoginSuccess({
            email: user.email || '',
            name: user.displayName || '使用者',
            avatar: user.photoURL || ''
          });
        } catch (error: any) {
          console.error(error);
          if (error.code === 'auth/operation-not-allowed' || error.message?.includes('operation-not-allowed')) {
            setFirebaseError({
              type: 'email',
              code: 'auth/operation-not-allowed',
              message: '這個 Firebase 專案的「電子郵件/密碼 (Email/Password)」登入提供者尚未啟用。'
            });
          } else {
            setFirebaseError({
              type: 'general',
              message: 'Firebase 登入失敗: ' + (error.message || error)
            });
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        const res = AccountDatabase.login(email, password);
        setIsLoading(false);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          alert(res.message);
        }
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      alert('請填寫電子郵件！');
      return;
    }

    setIsLoading(true);
    if (firebaseActive) {
      try {
        await sendPasswordResetEmail(auth, forgotEmail.trim());
        setResetEmailSent(true);
      } catch (error: any) {
        alert('密碼重設郵件發送失敗: ' + (error.message || error));
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setResetEmailSent(true);
        setIsLoading(false);
      }, 700);
    }
  };

  const handleFirebaseGoogleClick = async () => {
    if (!firebaseActive) return;
    setIsLoading(true);
    setFirebaseError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Upsert / merging profile on Google Sign-In
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || 'Google 使用者',
        email: user.email || '',
        avatar: user.photoURL || '',
        budgetLimit: 10000,
        settings: {
          notifications: true,
          currency: 'USD',
          bioLock: true,
          theme: 'light'
        }
      }, { merge: true });

      onLoginSuccess({
        email: user.email || '',
        name: user.displayName || 'Google 使用者',
        avatar: user.photoURL || ''
      });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/operation-not-allowed' || error.message?.includes('operation-not-allowed')) {
        setFirebaseError({
          type: 'google',
          code: 'auth/operation-not-allowed',
          message: '這個 Firebase 專案的「Google」登入服務尚未啟用。'
        });
      } else {
        setFirebaseError({
          type: 'general',
          message: 'Google 登入失敗: ' + (error.message || error)
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleBypass = () => {
    const googleProfile = AccountDatabase.registerOrLoginGoogle(
      'alex.t@clarity.finance',
      'Alex Thompson',
      'https://lh3.googleusercontent.com/a/ACg8ocLk_WByr2YVIdf-8_7-2GZ='
    );
    onLoginSuccess(googleProfile);
  };

  // If user is in forgot password view, render sub-layout
  if (isForgotPasswordMode) {
    return (
      <div className="min-h-[100dvh] flex flex-col justify-center max-w-md mx-auto relative px-5 py-8 bg-[#f7f9fb] dark:bg-[#191c1e] text-[#191c1e] dark:text-white transition-colors animate-fade-in select-none">
        
        {/* Top Back Action */}
        <button 
          type="button"
          onClick={() => {
            setIsForgotPasswordMode(false);
            setResetEmailSent(false);
          }}
          className="absolute top-6 left-5 flex items-center gap-1.5 text-xs font-bold text-zinc-550 dark:text-zinc-400 hover:text-[#a43c12] dark:hover:text-[#ffb59c] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 返回登入
        </button>

        <header className="flex flex-col items-center justify-center mb-8 gap-2 mt-8">
          <div className="w-16 h-16 rounded-3xl bg-[#ff7f50]/15 dark:bg-[#ff7f50]/10 flex items-center justify-center text-[#a43c12] dark:text-[#ffb59c] border border-[#ff7f50]/20 shadow-md">
            <KeyRound className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#a43c12] dark:text-[#ffb59c] text-center tracking-tight mt-2">
            重設密碼
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold text-center leading-relaxed">
            {firebaseActive 
              ? '輸入您的電子郵件，我們將為您寄出安全密碼重設連結。'
              : '【模擬模式】輸入任何電子郵件，系統將直接完成密碼重設模擬。'}
          </p>
        </header>

        {resetEmailSent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-center mb-6 animate-fade-in flex flex-col items-center gap-3">
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">重設郵件已發送！</h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
              指令信件已寄至 <span className="underline font-bold text-[#a43c12] dark:text-[#ffb59c]">{forgotEmail}</span>，請前往您的電子信箱收信並更改密碼。
            </p>
            <button
              onClick={() => {
                setIsForgotPasswordMode(false);
                setResetEmailSent(false);
              }}
              className="mt-2 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              返回登入畫面
            </button>
          </div>
        ) : (
          <form 
            onSubmit={handleResetPassword} 
            className="flex flex-col gap-4 mb-6"
          >
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-[#ff7f50] focus:ring-1 focus:ring-[#ff7f50] transition-all duration-200"
                placeholder="請輸入電子郵件"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#ff7f50] text-[#6c2000] font-bold text-base rounded-2xl shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isLoading ? '處理中...' : '發送重設驗證信'}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsForgotPasswordMode(false);
              setResetEmailSent(false);
            }}
            className="text-xs font-bold text-zinc-550 dark:text-zinc-400 hover:text-[#a43c12] dark:hover:text-[#ffb59c] transition-colors underline"
          >
            想起來了？立即登入
          </button>
        </div>

        {/* Ambient backgrounds */}
        <div className="fixed top-[-10%] right-[-15%] w-72 h-72 bg-[#ff7f50]/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="fixed bottom-[-5%] left-[-10%] w-60 h-60 bg-[#76f3ea]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center max-w-md mx-auto relative px-5 py-8 bg-[#f7f9fb] dark:bg-[#191c1e] text-[#191c1e] dark:text-white transition-colors select-none animate-fade-in">
      
      {/* Top Database Status Indicator Badge */}
      <div className={`p-2.5 rounded-2xl mb-4 flex items-center gap-2 border text-[11px] font-bold leading-normal transition-all ${
        firebaseActive 
          ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-750 dark:text-emerald-400' 
          : 'bg-amber-500/10 border-amber-500/15 text-[#8f5a00] dark:text-amber-400'
      }`}>
        <Database className="w-4 h-4 flex-shrink-0 animate-pulse" />
        <div>
          {firebaseActive 
            ? '🚀 雲端雲端連線：已成功對接 Firebase 雲端資料庫系統！' 
            : '⚠️ 正在使用本地快速預覽儲存（未於 firebase-applet-config.json 設定金鑰）'}
        </div>
      </div>

      {/* Brand Header */}
      <header className="flex flex-col items-center justify-center mb-5 gap-2 mt-2">
        <div className="w-16 h-16 rounded-3xl bg-[#ff7f50] flex items-center justify-center text-white shadow-md shadow-[#ff7f50]/15">
          <Wallet className="w-10 h-10 stroke-[2px]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#a43c12] dark:text-[#ffb59c] text-center tracking-tight mt-1">
          {isSignUpMode ? '註冊新帳號' : 'Quick Expense'}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold text-center">
          {isSignUpMode ? '加入 Quick Expense 聰明記帳' : '掌握每一分錢的流向'}
        </p>
      </header>

      {/* Guest bypass banner helper */}
      <div 
        onClick={handleGoogleBypass}
        className="mb-5 bg-[#ff7f50]/15 border border-[#ff7f50]/20 p-2.5 rounded-2xl text-center text-[#a43c12] dark:text-[#ffb59c] text-xs font-bold cursor-pointer active:scale-95 hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
      >
        🌟 <span>開發人員測試：按此快速登入體驗</span>
      </div>

      {/* Detailed Diagnostic Warning Banner for operation-not-allowed */}
      {firebaseError && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/15 text-[#8f5a00] dark:text-amber-400 text-xs font-semibold leading-relaxed animate-fade-in flex flex-col gap-2.5">
          <div className="flex items-center gap-2 font-bold text-[13px] text-[#a43c12] dark:text-amber-300">
            <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
            <span>
              {firebaseError.code === 'auth/operation-not-allowed' 
                ? '⚠️ 登入功能尚未在 Firebase 啟用' 
                : '✕ 發生驗證錯誤'}
            </span>
          </div>
          <p className="text-zinc-650 dark:text-zinc-300 leading-normal font-medium">
            {firebaseError.message}
          </p>
          
          {firebaseError.code === 'auth/operation-not-allowed' && (
            <div className="mt-1 p-3 bg-white/60 dark:bg-black/30 rounded-xl text-[11px] leading-relaxed flex flex-col gap-1.5 border border-amber-500/10">
              <span className="font-extrabold text-[#a43c12] dark:text-amber-200">
                🛠️ 解決步驟：
              </span>
              <ol className="list-decimal pl-4.5 space-y-1 text-zinc-650 dark:text-zinc-300 font-medium">
                <li>
                  前往{' '}
                  <a 
                    href={
                      firebaseConfig.projectId 
                        ? `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers` 
                        : 'https://console.firebase.google.com/'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-orange-650 dark:text-orange-400 font-extrabold hover:opacity-85 text-[#a43c12]"
                  >
                    Firebase Console 設定頁面 ↗
                  </a>
                </li>
                <li>點選 <strong>Sign-in method</strong> (登入方法) 分頁</li>
                <li>點擊 <strong>Add new provider</strong> (新增提供者)</li>
                <li>
                  將 <strong>{firebaseError.type === 'email' ? '電子郵件/密碼 (Email/Password)' : 'Google'}</strong> 提供者設為「啟用」並儲存。
                </li>
              </ol>
              <div className="mt-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal border-t border-zinc-250 dark:border-zinc-700/30 pt-1.5">
                💡 <strong>提示：</strong> 您也可以直接點擊上方的 <strong>「開發人員體驗：按此快速登入體驗」</strong> 按鈕，即可快速略過雲端驗證，直接在本地模擬模式體驗完整功能。
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auth Entry Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mb-5">
        
        {/* Username for Signup mode only */}
        {isSignUpMode && (
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <User className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12.5 pl-11 pr-4 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-805/70 rounded-xl font-bold text-xs text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-[#ff7f50] focus:ring-1 focus:ring-[#ff7f50] transition-all duration-200"
              placeholder="使用者名稱"
              required={isSignUpMode}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Email entry field */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-4.5 h-4.5" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12.5 pl-11 pr-4 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-805/70 rounded-xl font-bold text-xs text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-[#ff7f50] focus:ring-1 focus:ring-[#ff7f50] transition-all duration-200"
            placeholder="電子郵件"
            required
            disabled={isLoading}
          />
        </div>

        {/* Password entry field */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 animate-fade-in">
            <Lock className="w-4.5 h-4.5" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12.5 pl-11 pr-11 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-805/70 rounded-xl font-bold text-xs text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-[#ff7f50] focus:ring-1 focus:ring-[#ff7f50] transition-all duration-200"
            placeholder={isSignUpMode ? '設定密碼' : '輸入您的密碼'}
            required
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-[#a43c12] dark:hover:text-[#ffb59c] transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* Confirm password field for Signup mode */}
        {isSignUpMode && (
          <div className="relative w-full animate-fade-in">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-12.5 pl-11 pr-11 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-805/70 rounded-xl font-bold text-xs text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
              placeholder="再輸入密碼完成確認"
              required={isSignUpMode}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        )}

        {!isSignUpMode && (
          <div className="flex justify-end pr-1">
            <button 
              type="button" 
              onClick={() => setIsForgotPasswordMode(true)} 
              className="text-xs font-bold text-[#a43c12] dark:text-[#ffb59c] hover:underline cursor-pointer"
            >
              忘記密碼？
            </button>
          </div>
        )}

        {/* Submit button layout */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12.5 bg-[#ff7f50] text-[#6c2000] font-bold text-sm rounded-xl shadow-sm hover:opacity-95 active:scale-[0.98] transition-all mt-2 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {isLoading ? '請稍候...' : (isSignUpMode ? '建立帳號' : '登入')}
        </button>

      </form>

      {/* Alternative SSO Providers */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center w-full py-1">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800/80"></div>
          <span className="flex-shrink-0 mx-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {isSignUpMode ? '或其他註冊方式' : '或透過以下方式'}
          </span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800/80"></div>
        </div>

        {/* Google SSO fully functional dynamic provider container */}
        <div className="flex flex-col gap-2">
          {firebaseActive ? (
            <button
              type="button"
              onClick={handleFirebaseGoogleClick}
              disabled={isLoading}
              className="w-full h-12.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 rounded-xl font-bold text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887C18.2 16.56 15.645 18 12.24 18c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.65 0 3.125.66 4.215 1.74l3.12-3.12C17.51 2.58 15.02 1.5 12.24 1.5c-5.79 0-10.5 4.71-10.5 10.5s4.71 10.5 10.5 10.5c5.783 0 10.5-4.717 10.5-10.5 0-.75-.075-1.462-.218-2.13H12.24z"/>
              </svg>
              <span>透過 Google 登入</span>
            </button>
          ) : (
            <div className="w-full flex justify-center">
              <div id="google-signin-btn" className="w-full"></div>
            </div>
          )}
          
          <div className="flex gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-150/40 dark:border-zinc-800/30 rounded-xl items-start">
            <Info className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
              本服務已支援實體 **Firebase Auth**! 請在 `firebase-applet-config.json` 貼上您的 Web SDK 配置，登入與帳號系統即可隨即自適應轉換為高強度的
              Google 雲端託管架構。
            </p>
          </div>
        </div>
      </div>

      {/* Footer redirection link toggle */}
      <div className="mt-6 text-center bg-transparent">
        <button
          type="button"
          onClick={() => {
            setIsSignUpMode(!isSignUpMode);
            setShowPassword(false);
            setShowConfirmPassword(false);
          }}
          className="text-xs font-bold text-zinc-550 dark:text-zinc-400 hover:text-[#a43c12] dark:hover:text-[#ffb59c] transition-colors cursor-pointer"
        >
          {isSignUpMode ? '已有帳號？立即登入' : '還沒有帳號嗎？ 註冊新帳號'}
        </button>
      </div>

      {/* Ambient backgrounds */}
      <div className="fixed top-[-10%] right-[-15%] w-72 h-72 bg-[#ff7f50]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-[-5%] left-[-10%] w-60 h-60 bg-[#76f3ea]/5 rounded-full blur-3xl pointer-events-none -z-10" />

    </div>
  );
};


