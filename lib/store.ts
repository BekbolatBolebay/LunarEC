'use client';

import { useState, useEffect } from 'react';
export { formatCurrency, formatDate } from './utils';

// --- Interfaces ---
export interface Lead {
  id: string;
  title: string;
  contactName: string;
  company?: string;
  phone: string;
  email?: string;
  expectedRevenue: number;
  probability: number; // percentage
  stage: 'new' | 'qualified' | 'proposal' | 'won' | 'lost';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  tags: string[];
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  tier: 'standard' | 'silver' | 'gold' | 'platinum';
  tags: string[];
  lastOrderAt: string;
  isBlocked: boolean;
}

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  category: 'raw' | 'beverage' | 'meat' | 'packaging' | 'semi';
  unit: 'кг' | 'литр' | 'дана' | 'қап';
  currentStock: number;
  minStock: number;
  costPrice: number;
  supplier: string;
  updatedAt: string;
}

export interface RecipeItem {
  id: string;
  name: string;
  category: 'Бургерлер' | 'Сусындар' | 'Ыстық тағамдар' | 'Десерттер';
  salePrice: number;
  costPrice: number;
  ingredients: { name: string; quantity: number; unit: string; cost: number }[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  status: 'draft' | 'sent' | 'received' | 'billed';
  itemsCount: number;
}

export interface Employee {
  id: string;
  name: string;
  role: 'Менеджер' | 'Бас аспаз' | 'Кассир' | 'Даяшы' | 'Бармен';
  phone: string;
  status: 'active' | 'on_break' | 'clocked_out';
  lastCheckIn?: string;
  workedHoursToday: number;
  hourlyRate: number;
  avatar: string;
}

export interface TableItem {
  id: string;
  number: number;
  capacity: number;
  section: 'Негізгі зал' | 'VIP зал' | 'Терраса';
  status: 'free' | 'occupied' | 'reserved';
  activeOrderTotal?: number;
  reservedFor?: string;
  reservedTime?: string;
}

export interface ChatterNote {
  id: string;
  recordId: string;
  author: string;
  content: string;
  type: 'note' | 'activity' | 'system';
  createdAt: string;
}

// --- Initial Demo Data ---
export const initialLeads: Lead[] = [
  {
    id: 'lead-1',
    title: 'Корпоративтік банкет (80 адам)',
    contactName: 'Нұрлан Бақытұлы',
    company: 'Kaspi Bank филиалы',
    phone: '+7 (777) 450-2211',
    email: 'nurlan@kaspi.kz',
    expectedRevenue: 650000,
    probability: 80,
    stage: 'proposal',
    priority: 'high',
    assignedTo: 'Арман Сериков',
    tags: ['Корпоратив', 'VIP'],
    createdAt: '2026-09-14',
  },
  {
    id: 'lead-2',
    title: 'Кейтеринг қызметі (IT Конференция)',
    contactName: 'Айгерім Дәулет',
    company: 'Astana Hub Startups',
    phone: '+7 (701) 990-1234',
    email: 'aigerim@hub.kz',
    expectedRevenue: 420000,
    probability: 60,
    stage: 'qualified',
    priority: 'medium',
    assignedTo: 'Меруерт Төлегенова',
    tags: ['Кейтеринг'],
    createdAt: '2026-09-15',
  },
  {
    id: 'lead-3',
    title: 'Тұрақты түскі ас келісім-шарты',
    contactName: 'Дархан Болат',
    company: 'BI Group Logistics',
    phone: '+7 (775) 332-9011',
    expectedRevenue: 1200000,
    probability: 95,
    stage: 'won',
    priority: 'high',
    assignedTo: 'Арман Сериков',
    tags: ['B2B', 'Келісім-шарт'],
    createdAt: '2026-09-10',
  },
  {
    id: 'lead-4',
    title: 'Туған күн мерейтойы (25 адам)',
    contactName: 'Гүлнар Әлиева',
    phone: '+7 (707) 112-4455',
    expectedRevenue: 280000,
    probability: 40,
    stage: 'new',
    priority: 'medium',
    assignedTo: 'Меруерт Төлегенова',
    tags: ['Мерейтой'],
    createdAt: '2026-09-16',
  },
  {
    id: 'lead-5',
    title: 'Кофе-брейк жеткізу (Сенбі)',
    contactName: 'Марат Омаров',
    company: 'KAZ Minerals',
    phone: '+7 (702) 887-3312',
    expectedRevenue: 150000,
    probability: 20,
    stage: 'new',
    priority: 'low',
    assignedTo: 'Арман Сериков',
    tags: ['Кофе-брейк'],
    createdAt: '2026-09-16',
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Асқар Қасымов',
    phone: '+7 (777) 123-4567',
    email: 'askar@gmail.com',
    totalOrders: 28,
    totalSpent: 385000,
    loyaltyPoints: 14500,
    tier: 'gold',
    tags: ['VIP', 'Тұрақты'],
    lastOrderAt: '2026-09-15',
    isBlocked: false,
  },
  {
    id: 'cust-2',
    name: 'Динара Сұлтанова',
    phone: '+7 (701) 555-8899',
    email: 'dinara.s@mail.ru',
    totalOrders: 14,
    totalSpent: 162000,
    loyaltyPoints: 6400,
    tier: 'silver',
    tags: ['Тұрақты'],
    lastOrderAt: '2026-09-14',
    isBlocked: false,
  },
  {
    id: 'cust-3',
    name: 'Бауыржан Ержанов',
    phone: '+7 (705) 777-1122',
    email: 'baur@yandex.kz',
    totalOrders: 42,
    totalSpent: 790000,
    loyaltyPoints: 32000,
    tier: 'platinum',
    tags: ['VIP', 'Инвестор'],
    lastOrderAt: '2026-09-16',
    isBlocked: false,
  },
  {
    id: 'cust-4',
    name: 'Мәдина Құрманғазы',
    phone: '+7 (747) 991-0033',
    email: 'madina@inbox.ru',
    totalOrders: 6,
    totalSpent: 54000,
    loyaltyPoints: 1200,
    tier: 'standard',
    tags: ['Жаңа қонақ'],
    lastOrderAt: '2026-09-11',
    isBlocked: false,
  }
];

export const initialStock: StockItem[] = [
  {
    id: 'stock-1',
    name: 'Сиыр еті (мәрмәр стейк / тартылған)',
    sku: 'RAW-MEAT-01',
    category: 'meat',
    unit: 'кг',
    currentStock: 18.5,
    minStock: 25.0, // Low stock warning!
    costPrice: 4200,
    supplier: 'KazBeef Trade ЖШС',
    updatedAt: '2026-09-16 10:30',
  },
  {
    id: 'stock-2',
    name: 'Бриошь бөлкелері (Burger Buns)',
    sku: 'BAKE-BUN-02',
    category: 'semi',
    unit: 'дана',
    currentStock: 120,
    minStock: 50,
    costPrice: 180,
    supplier: 'Пекарня №1 ЖШС',
    updatedAt: '2026-09-16 09:00',
  },
  {
    id: 'stock-3',
    name: 'Чеддер ірімшігі (Cheddar slices)',
    sku: 'DAIRY-CHE-03',
    category: 'raw',
    unit: 'кг',
    currentStock: 8.2,
    minStock: 10.0, // Low stock!
    costPrice: 3800,
    supplier: 'FoodMaster Distribution',
    updatedAt: '2026-09-15 17:40',
  },
  {
    id: 'stock-4',
    name: 'Кофе бұршақтары (Arabica Espresso 100%)',
    sku: 'BEV-COF-04',
    category: 'beverage',
    unit: 'кг',
    currentStock: 14.0,
    minStock: 8.0,
    costPrice: 7500,
    supplier: 'Coffee Roasters Almaty',
    updatedAt: '2026-09-16 11:15',
  },
  {
    id: 'stock-5',
    name: 'Картоп фри (Aviko 9mm)',
    sku: 'RAW-POT-05',
    category: 'raw',
    unit: 'кг',
    currentStock: 45.0,
    minStock: 30.0,
    costPrice: 1100,
    supplier: 'Metro Cash & Carry',
    updatedAt: '2026-09-14 15:00',
  },
  {
    id: 'stock-6',
    name: 'Крафтық қорапша (Burger Box)',
    sku: 'PACK-BOX-06',
    category: 'packaging',
    unit: 'дана',
    currentStock: 350,
    minStock: 200,
    costPrice: 75,
    supplier: 'EcoPack Казахстан',
    updatedAt: '2026-09-13 12:20',
  },
];

export const initialRecipes: RecipeItem[] = [
  {
    id: 'rec-1',
    name: 'Mazir Black Angus Бургері',
    category: 'Бургерлер',
    salePrice: 3600,
    costPrice: 1250,
    ingredients: [
      { name: 'Сиыр еті', quantity: 0.18, unit: 'кг', cost: 756 },
      { name: 'Бриошь бөлкесі', quantity: 1, unit: 'дана', cost: 180 },
      { name: 'Чеддер ірімшігі', quantity: 0.04, unit: 'кг', cost: 152 },
      { name: 'Соус және көкөністер', quantity: 1, unit: 'порция', cost: 162 },
    ],
  },
  {
    id: 'rec-2',
    name: 'Классикалық Чизбургер',
    category: 'Бургерлер',
    salePrice: 2800,
    costPrice: 920,
    ingredients: [
      { name: 'Сиыр еті', quantity: 0.14, unit: 'кг', cost: 588 },
      { name: 'Бриошь бөлкесі', quantity: 1, unit: 'дана', cost: 180 },
      { name: 'Чеддер ірімшігі', quantity: 0.03, unit: 'кг', cost: 114 },
      { name: 'Қызанақ/қияр', quantity: 1, unit: 'порция', cost: 38 },
    ],
  },
  {
    id: 'rec-3',
    name: 'Капучино Grand (350ml)',
    category: 'Сусындар',
    salePrice: 1400,
    costPrice: 320,
    ingredients: [
      { name: 'Кофе Arabica', quantity: 0.018, unit: 'кг', cost: 135 },
      { name: 'Сүт 3.2%', quantity: 0.22, unit: 'литр', cost: 125 },
      { name: 'Стақан және қақпақ', quantity: 1, unit: 'дана', cost: 60 },
    ],
  },
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-042',
    supplierName: 'KazBeef Trade ЖШС',
    date: '2026-09-16',
    totalAmount: 210000,
    status: 'draft',
    itemsCount: 2,
  },
  {
    id: 'po-2',
    poNumber: 'PO-2026-041',
    supplierName: 'FoodMaster Distribution',
    date: '2026-09-15',
    totalAmount: 145000,
    status: 'sent',
    itemsCount: 4,
  },
  {
    id: 'po-3',
    poNumber: 'PO-2026-040',
    supplierName: 'Coffee Roasters Almaty',
    date: '2026-09-12',
    totalAmount: 90000,
    status: 'received',
    itemsCount: 1,
  },
  {
    id: 'po-4',
    poNumber: 'PO-2026-039',
    supplierName: 'EcoPack Казахстан',
    date: '2026-09-10',
    totalAmount: 75000,
    status: 'billed',
    itemsCount: 3,
  },
];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Санжар Ибрагимов',
    role: 'Менеджер',
    phone: '+7 (777) 900-1122',
    status: 'active',
    lastCheckIn: '2026-09-16 08:45',
    workedHoursToday: 7.2,
    hourlyRate: 2500,
    avatar: '👨‍💼',
  },
  {
    id: 'emp-2',
    name: 'Ернар Қалиев',
    role: 'Бас аспаз',
    phone: '+7 (701) 345-6789',
    status: 'active',
    lastCheckIn: '2026-09-16 09:10',
    workedHoursToday: 6.8,
    hourlyRate: 3200,
    avatar: '👨‍🍳',
  },
  {
    id: 'emp-3',
    name: 'Әлия Нұржанова',
    role: 'Кассир',
    phone: '+7 (702) 888-4455',
    status: 'active',
    lastCheckIn: '2026-09-16 09:30',
    workedHoursToday: 6.5,
    hourlyRate: 1800,
    avatar: '👩‍💼',
  },
  {
    id: 'emp-4',
    name: 'Мұрат Тілеуов',
    role: 'Даяшы',
    phone: '+7 (775) 444-1234',
    status: 'on_break',
    lastCheckIn: '2026-09-16 11:00',
    workedHoursToday: 4.5,
    hourlyRate: 1500,
    avatar: '🤵',
  },
  {
    id: 'emp-5',
    name: 'Аружан Сейіт',
    role: 'Даяшы',
    phone: '+7 (708) 223-9988',
    status: 'clocked_out',
    workedHoursToday: 0,
    hourlyRate: 1500,
    avatar: '👩‍🍳',
  },
];

export const initialTables: TableItem[] = [
  { id: 'tbl-1', number: 1, capacity: 4, section: 'Негізгі зал', status: 'occupied', activeOrderTotal: 14500 },
  { id: 'tbl-2', number: 2, capacity: 2, section: 'Негізгі зал', status: 'free' },
  { id: 'tbl-3', number: 3, capacity: 6, section: 'Негізгі зал', status: 'occupied', activeOrderTotal: 32800 },
  { id: 'tbl-4', number: 4, capacity: 4, section: 'Негізгі зал', status: 'free' },
  { id: 'tbl-5', number: 5, capacity: 8, section: 'VIP зал', status: 'reserved', reservedFor: 'Нұрлан Бақытұлы', reservedTime: '19:00' },
  { id: 'tbl-6', number: 6, capacity: 10, section: 'VIP зал', status: 'free' },
  { id: 'tbl-7', number: 7, capacity: 4, section: 'Терраса', status: 'occupied', activeOrderTotal: 8400 },
  { id: 'tbl-8', number: 8, capacity: 2, section: 'Терраса', status: 'free' },
];

export const initialChatter: ChatterNote[] = [
  {
    id: 'chat-1',
    recordId: 'lead-1',
    author: 'Арман Сериков',
    content: 'Клиентпен телефон арқылы сөйлестік. Мәзір нұсқалары (сет 1 және сет 2) WhatsApp арқылы жіберілді.',
    type: 'note',
    createdAt: '2026-09-15 14:20',
  },
  {
    id: 'chat-2',
    recordId: 'lead-1',
    author: 'Жүйе (System)',
    content: 'Мәртебесі "Квалификация" кезеңінен "Ұсыныс" кезеңіне ауыстырылды.',
    type: 'system',
    createdAt: '2026-09-15 14:25',
  },
];
