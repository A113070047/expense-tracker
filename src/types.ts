export enum AppTab {
  ENTRY = 'entry',
  TIMELINE = 'timeline',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings'
}

export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income'
}

export enum Category {
  FOOD = 'food',
  TRANSPORT = 'transport',
  SHOPPING = 'shopping',
  ENTERTAINMENT = 'entertainment',
  HOUSING = 'housing',
  OTHERS = 'others'
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export interface Budget {
  limit: number;
  spent: number;
}

export interface AppSettings {
  notifications: boolean;
  currency: 'USD' | 'TWD' | 'HKD' | 'JPY' | 'EUR';
  bioLock: boolean;
  theme: 'light' | 'dark';
}
