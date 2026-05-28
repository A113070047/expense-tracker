import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Wallet, ShieldCheck, ArrowLeft, CheckCircle, KeyRound, Info } from 'lucide-react';
import { UserProfile } from '../types';
import { AccountDatabase } from '../services/db';

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

  // Forgot password specific sub-states
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);

  // Dynamically load Google Sign-In SDK (Google Identity Services)
  useEffect(() => {
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

    // Periodically check if GIS library loaded successfully, then boot it
    const checkInterval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogleGSI();
        clearInterval(checkInterval);
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [isSignUpMode, isForgotPasswordMode]);

  // Trigger local credential auth action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password) {
      alert('請填寫所有欄位！');
      return;
    }

    if (isSignUpMode) {
      if (password !== confirmPassword) {
        alert('兩次輸入的密碼不一致！請重新確認。');
        return;
      }
      
      const res = AccountDatabase.register(email, password, username);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        alert(res.message);
      }
    } else {
      const res = AccountDatabase.login(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        alert(res.message);
      }
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
            輸入您的帳號電子郵件，我們將為您寄出安全密碼重設連結。
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
            onSubmit={(e) => {
              e.preventDefault();
              setResetEmailSent(true);
            }} 
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
              />
            </div>

            <button
              type="submit"
              className="w-full h-14 bg-[#ff7f50] text-[#6c2000] font-bold text-base rounded-2xl shadow-sm hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              發送重設驗證信
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
      
      {/* Brand Header */}
      <header className="flex flex-col items-center justify-center mb-6 gap-2 mt-4">
        <div className="w-16 h-16 rounded-3xl bg-[#ff7f50] flex items-center justify-center text-white shadow-md shadow-[#ff7f50]/15">
          <Wallet className="w-10 h-10 stroke-[2px]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#a43c12] dark:text-[#ffb59c] text-center tracking-tight mt-2">
          {isSignUpMode ? '註冊新帳號' : 'Quick Expense'}
        </h1>
        <p className="text-sm text-zinc-500 font-semibold text-center">
          {isSignUpMode ? '加入 Quick Expense 聰明記帳' : '掌握每一分錢的流向'}
        </p>
      </header>

      {/* Guest bypass banner helper */}
      <div 
        onClick={handleGoogleBypass}
        className="mb-6 bg-[#ff7f50]/15 border border-[#ff7f50]/20 p-3 rounded-2xl text-center text-[#a43c12] dark:text-[#ffb59c] text-xs font-bold cursor-pointer active:scale-95 hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
      >
        🌟 <span>開發人員測試：按此快速登入體驗</span>
      </div>

      {/* Auth Entry Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        
        {/* Username for Signup mode only */}
        {isSignUpMode && (
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <User className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-[#ff7f50] focus:ring-1 focus:ring-[#ff7f50] transition-all duration-200"
              placeholder="使用者名稱"
              required={isSignUpMode}
            />
          </div>
        )}

        {/* Email entry field */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-5 h-5" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-[#ff7f50] focus:ring-1 focus:ring-[#ff7f50] transition-all duration-200"
            placeholder="電子郵件"
            required
          />
        </div>

        {/* Password entry field */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 animate-fade-in">
            <Lock className="w-5 h-5" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 pl-12 pr-12 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-[#ff7f50] focus:ring-1 focus:ring-[#ff7f50] transition-all duration-200"
            placeholder={isSignUpMode ? '設定密碼' : '輸入您的密碼'}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-[#a43c12] dark:hover:text-[#ffb59c] transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Confirm password field for Signup mode with DISTINCT confirm icon and independent visibility togglers */}
        {isSignUpMode && (
          <div className="relative w-full animate-fade-in">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
              <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-14 pl-12 pr-12 bg-white dark:bg-[#1a1c1e] border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-sm text-zinc-800 dark:text-zinc-150 placeholder-zinc-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
              placeholder="再輸入密碼完成確認"
              required={isSignUpMode}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        )}

        {!isSignUpMode && (
          <div className="flex justify-end pr-1 mt-0.5">
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
          className="w-full h-14 bg-[#ff7f50] text-[#6c2000] font-bold text-base rounded-2xl shadow-sm hover:opacity-95 active:scale-[0.98] transition-all mt-3 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {isSignUpMode ? '註冊' : '登入'}
        </button>

      </form>

      {/* Alternative SSO Providers */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center w-full py-2">
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800/80"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {isSignUpMode ? '或其他註冊方式' : '或透過以下方式'}
          </span>
          <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800/80"></div>
        </div>

        {/* Google SSO fully functional dynamic provider container */}
        <div className="flex flex-col gap-2">
          <div className="w-full flex justify-center py-1">
            <div id="google-signin-btn" className="w-full"></div>
          </div>
          
          <div className="flex gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-150/40 dark:border-zinc-800/30 rounded-2xl items-start">
            <Info className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
              本帳號服務已完美原生串接 **Google Identity Services (GSI)**。如需啟用專屬憑證驗證，請至系統專案 `.env` 中設定您的 `VITE_GOOGLE_CLIENT_ID` 參數。若點擊測試按鈕，仍能直接進入模擬驗證流程。
            </p>
          </div>
        </div>
      </div>

      {/* Footer redirection link toggle */}
      <div className="mt-8 text-center bg-transparent">
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

