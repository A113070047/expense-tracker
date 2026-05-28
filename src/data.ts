import { Transaction, TransactionType, Category } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't-1',
    title: '晨間咖啡廳',
    amount: 12.50,
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    date: '2026-05-21',
    time: '09:15 AM'
  },
  {
    id: 't-2',
    title: '接案收入',
    amount: 850.00,
    type: TransactionType.INCOME,
    category: Category.OTHERS,
    date: '2026-05-21',
    time: '02:45 PM'
  },
  {
    id: 't-3',
    title: '雜貨超市',
    amount: 64.22,
    type: TransactionType.EXPENSE,
    category: Category.SHOPPING,
    date: '2026-05-20',
    time: '06:20 PM'
  },
  {
    id: 't-4',
    title: 'Uber 搭乘',
    amount: 18.40,
    type: TransactionType.EXPENSE,
    category: Category.TRANSPORT,
    date: '2026-05-20',
    time: '11:30 AM'
  },
  // Retrofitted transactions in the current month to sum up exactly to the chart values!
  // Housing: 45% of 8500 = 3825
  {
    id: 't-hist-1',
    title: '本月房租與管理費',
    amount: 3825.00,
    type: TransactionType.EXPENSE,
    category: Category.HOUSING,
    date: '2026-05-01',
    time: '10:00 AM'
  },
  // Food core: 2550 - 12.50 = 2537.50
  {
    id: 't-hist-2',
    title: '高級家庭餐敘',
    amount: 1850.00,
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    date: '2026-05-15',
    time: '07:30 PM'
  },
  {
    id: 't-hist-3',
    title: '平常日外食累計',
    amount: 687.50,
    type: TransactionType.EXPENSE,
    category: Category.FOOD,
    date: '2026-05-18',
    time: '12:30 PM'
  },
  // Transport core: 2125 - 18.40 = 2106.60
  {
    id: 't-hist-4',
    title: '商務商旅高鐵來回',
    amount: 1630.00,
    type: TransactionType.EXPENSE,
    category: Category.TRANSPORT,
    date: '2026-05-10',
    time: '08:00 AM'
  },
  {
    id: 't-hist-5',
    title: '加油與過路費',
    amount: 476.60,
    type: TransactionType.EXPENSE,
    category: Category.TRANSPORT,
    date: '2026-05-14',
    time: '04:15 PM'
  },
  // A substantial salary to back up savings
  {
    id: 't-salary',
    title: '主業薪資收入',
    amount: 12000.00,
    type: TransactionType.INCOME,
    category: Category.OTHERS,
    date: '2026-05-05',
    time: '09:00 AM'
  }
];
