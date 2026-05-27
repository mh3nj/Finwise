export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  category: string;
  accountId: string;
  notes?: string;
  receiptImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  balance: number;
  parentId?: string;
  isActive: boolean;
}

export interface Company {
  id: string;
  name: string;
  currency: string;
  fiscalYearStart: Date;
  createdAt: Date;
}

export interface Settings {
  language: "en" | "fa" | "de" | "tr" | "hy";
  currency: string;
  theme: "light" | "dark" | "system";
  autoBackupInterval: number;
  calendarSystem: "gregorian" | "jalali" | "hijri";
}
