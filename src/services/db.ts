import { Transaction, AppSettings, UserProfile } from '../types';
import { INITIAL_TRANSACTIONS } from '../data';

export interface UserAccount {
  email: string;
  name: string;
  passwordHash: string; // Stored securely
  avatar: string;
  transactions: Transaction[];
  budgetLimit: number;
  settings: AppSettings;
  isGoogleUser?: boolean;
}

const DB_KEY = 'qe_multiuser_database';
const CURRENT_USER_KEY = 'qe_current_user_email';

// In-memory fallback cache for restricted storage environments (incognito, standalone WebViews, private tabs)
let memoryDB: Record<string, UserAccount> | null = null;
let memoryCurrentUser: string | null = null;

// Base helper for standard string hashing to simulate secure password storage
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `hash-${hash}`;
}

export class AccountDatabase {
  private static loadDB(): Record<string, UserAccount> {
    const defaultUser: UserAccount = {
      email: 'alex.t@clarity.finance',
      name: 'Alex Thompson',
      passwordHash: hashPassword('12345678'), // Default demo password
      avatar: '',
      transactions: INITIAL_TRANSACTIONS,
      budgetLimit: 10000,
      settings: {
        notifications: true,
        currency: 'USD',
        bioLock: true,
        theme: 'light'
      }
    };

    try {
      const data = localStorage.getItem(DB_KEY);
      if (!data) {
        const initialDB = { [defaultUser.email.toLowerCase()]: defaultUser };
        try {
          localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
        } catch (e) {
          console.warn("Storage writing restricted, initializing memory cache instead:", e);
        }
        return initialDB;
      }

      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    } catch (e) {
      console.warn("Failed to read from localStorage. Supporting in-memory database container fallback:", e);
      if (!memoryDB) {
        memoryDB = { [defaultUser.email.toLowerCase()]: defaultUser };
      }
      return memoryDB;
    }
  }

  private static saveDB(db: Record<string, UserAccount>) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.warn("Failed to write updates to localStorage. Storing inside memory space:", e);
      memoryDB = db;
    }
  }

  // Find user details dynamically
  static getUserByEmail(email: string): UserAccount | null {
    const db = this.loadDB();
    return db[email.toLowerCase()] || null;
  }

  // Local accounts signup mechanism
  static register(email: string, password: string, name: string): { success: boolean; message: string; user?: UserProfile } {
    const db = this.loadDB();
    const normalizedEmail = email.toLowerCase().trim();

    if (db[normalizedEmail]) {
      return { success: false, message: '此電子郵件已被註冊過！' };
    }

    const newUser: UserAccount = {
      email: normalizedEmail,
      name: name.trim() || '新使用者',
      passwordHash: hashPassword(password),
      avatar: '',
      transactions: [], // Fresh new budget record
      budgetLimit: 10000,
      settings: {
        notifications: true,
        currency: 'USD',
        bioLock: true,
        theme: 'light'
      }
    };

    db[normalizedEmail] = newUser;
    this.saveDB(db);

    return {
      success: true,
      message: '註冊成功！',
      user: {
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar
      }
    };
  }

  // Google account registration/sign-in integration
  static registerOrLoginGoogle(email: string, name: string, picture: string): UserProfile {
    const db = this.loadDB();
    const normalizedEmail = email.toLowerCase().trim();

    if (!db[normalizedEmail]) {
      db[normalizedEmail] = {
        email: normalizedEmail,
        name: name || 'Google 使用者',
        passwordHash: 'google-sso-bypass',
        avatar: picture || '',
        transactions: [],
        budgetLimit: 10000,
        settings: {
          notifications: true,
          currency: 'USD',
          bioLock: true,
          theme: 'light'
        },
        isGoogleUser: true
      };
      this.saveDB(db);
    } else {
      // Just update avatar dynamically if different
      if (picture && db[normalizedEmail].avatar !== picture) {
        db[normalizedEmail].avatar = picture;
        this.saveDB(db);
      }
    }

    return {
      email: normalizedEmail,
      name: db[normalizedEmail].name,
      avatar: db[normalizedEmail].avatar
    };
  }

  // Local authentication check
  static login(email: string, password: string): { success: boolean; message: string; user?: UserProfile } {
    const db = this.loadDB();
    const normalizedEmail = email.toLowerCase().trim();
    const user = db[normalizedEmail];

    if (!user) {
      return { success: false, message: '帳號不存在，請先註冊。' };
    }

    if (user.passwordHash !== hashPassword(password)) {
      return { success: false, message: '密碼輸入不正確，請重新確認。' };
    }

    return {
      success: true,
      message: '登入成功',
      user: {
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    };
  }

  // Save changes back to database for full synchronization of multi-user states
  static saveUserData(email: string, payload: Partial<Omit<UserAccount, 'email' | 'passwordHash'>>) {
    const db = this.loadDB();
    const normalized = email.toLowerCase().trim();
    if (db[normalized]) {
      db[normalized] = {
        ...db[normalized],
        ...payload
      };
      this.saveDB(db);
    }
  }

  // Get current session email
  static getCurrentUserEmail(): string | null {
    try {
      return localStorage.getItem(CURRENT_USER_KEY);
    } catch (e) {
      console.warn("Storage security limits block access to session records. Using standard fallback cache:", e);
      return memoryCurrentUser;
    }
  }

  // Set current user session
  static setCurrentUserEmail(email: string | null) {
    try {
      if (email) {
        localStorage.setItem(CURRENT_USER_KEY, email);
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.warn("Storage write restriction in setting current user. Pinning in memory:", e);
      memoryCurrentUser = email;
    }
  }
}
