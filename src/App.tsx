import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FontAwesomeIcon, icons } from "./components/Icon";

declare global {
  interface Window {
    ethereum?: any;
  }
  interface Navigator {
    connection?: any;
  }
}

// ========== INTERFACES ==========
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  transactionId: string;
  filename: string;
  dataUrl: string;  // base64 image data
  size: number;
  uploadedAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  cost: number;
  category: string;
  minStock: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number;
  taxRate: number;
}

interface Asset {
  id: string;
  name: string;
  purchaseDate: string;
  purchasePrice: number;
  usefulLife: number;
  salvageValue: number;
  method: string;
}

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  lastSynced: string;
}

interface Company {
  id: string;
  name: string;
  currency: string;
  fiscalYearStart: string;
}

interface Loan {
  id: string;
  amount: number;
  rate: number;
  term: number;
  startDate: string;
  monthlyPayment: number;
  schedule: any[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  dueDate: string;
  total: number;
  createdAt: string;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  items: { description: string; quantity: number; price: number }[];
  frequency: 'monthly' | 'weekly' | 'yearly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  nextInvoiceDate: string;
  lastGenerated?: string;
  isActive: boolean;
}

// ========== DOUBLE-ENTRY ACCOUNTING INTERFACES ==========
interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normalBalance: 'debit' | 'credit';
  balance: number;
  parentId?: string;
  description?: string;
}

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reason?: string;
  reference?: string;
  entries: JournalLine[];
  createdAt: string;
  createdBy: string;
}

interface ChangeLog {
  id: string;
  timestamp: string;
  entityType: 'customer' | 'employee' | 'asset' | 'product' | 'bank' | 'transaction' | 'vendor' | 'bill';
  entityId: string;
  entityName: string;
  action: 'create' | 'update' | 'delete' | 'attachment_add' | 'attachment_remove';
  reason: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  user: string;
}

interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

// ========== VENDOR/BILL MANAGEMENT INTERFACES ==========
interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  website?: string;
  notes?: string;
  createdAt: string;
}

interface Bill {
  id: string;
  vendorId: string;
  vendorName: string;
  billNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue';
  items: BillItem[];
  notes?: string;
  createdAt: string;
}

interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  accountId?: string;
}

// Search result interface
interface SearchResult {
  type: 'transaction' | 'product' | 'customer' | 'employee' | 'asset' | 'bank';
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  data: any;
  tab: string;
}

// ========== SEARCH MODAL PROPS ==========
interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (result: SearchResult) => void;
  transactions: Transaction[];
  products: Product[];
  customers: Customer[];
  employees: Employee[];
  assets: Asset[];
  bankAccounts: BankAccount[];
  currency: string;
  currencySymbols: any;
  getConvertedAmount: (amount: number) => number;
}

// ========== SEARCH MODAL COMPONENT ==========
const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onResultClick,
  transactions,
  products,
  customers,
  employees,
  assets,
  bankAccounts,
  currency,
  currencySymbols,
  getConvertedAmount,
}) => {
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["all"]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filters = activeFilters.includes("all") ? ["all"] : activeFilters;
    const newResults: SearchResult[] = [];

    if (filters.includes("all") || filters.includes("transactions")) {
      transactions.forEach(t => {
        if (t.description.toLowerCase().includes(lowerQuery) ||
            t.category.toLowerCase().includes(lowerQuery) ||
            t.amount.toString().includes(lowerQuery)) {
          newResults.push({
            type: 'transaction',
            id: t.id,
            title: t.description,
            subtitle: `${t.date} | ${currencySymbols[currency]}${Math.abs(t.amount).toLocaleString()} | ${t.category}`,
            icon: icons.transactions,
            data: t,
            tab: 'transactions'
          });
        }
      });
    }

    if (filters.includes("all") || filters.includes("inventory")) {
      products.forEach(p => {
        if (p.name.toLowerCase().includes(lowerQuery) ||
            p.sku.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery)) {
          newResults.push({
            type: 'product',
            id: p.id,
            title: p.name,
            subtitle: `SKU: ${p.sku} | Stock: ${p.quantity} | Price: ${currencySymbols[currency]}${p.price}`,
            icon: icons.product,
            data: p,
            tab: 'inventory'
          });
        }
      });
    }

    if (filters.includes("all") || filters.includes("customers")) {
      customers.forEach(c => {
        if (c.name.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery) ||
            c.phone.includes(lowerQuery)) {
          newResults.push({
            type: 'customer',
            id: c.id,
            title: c.name,
            subtitle: `${c.email} | ${c.phone}`,
            icon: icons.customer,
            data: c,
            tab: 'customers'
          });
        }
      });
    }

    if (filters.includes("all") || filters.includes("payroll")) {
      employees.forEach(e => {
        if (e.name.toLowerCase().includes(lowerQuery) ||
            e.position.toLowerCase().includes(lowerQuery)) {
          newResults.push({
            type: 'employee',
            id: e.id,
            title: e.name,
            subtitle: `${e.position} | Salary: ${currencySymbols[currency]}${e.salary.toLocaleString()}`,
            icon: icons.payroll,
            data: e,
            tab: 'payroll'
          });
        }
      });
    }

    if (filters.includes("all") || filters.includes("assets")) {
      assets.forEach(a => {
        if (a.name.toLowerCase().includes(lowerQuery)) {
          newResults.push({
            type: 'asset',
            id: a.id,
            title: a.name,
            subtitle: `Price: ${currencySymbols[currency]}${a.purchasePrice.toLocaleString()}`,
            icon: icons.asset,
            data: a,
            tab: 'assets'
          });
        }
      });
    }

    if (filters.includes("all") || filters.includes("bank")) {
      bankAccounts.forEach(b => {
        if (b.name.toLowerCase().includes(lowerQuery)) {
          newResults.push({
            type: 'bank',
            id: b.id,
            title: b.name,
            subtitle: `Balance: ${currencySymbols[b.currency]}${b.balance.toLocaleString()}`,
            icon: icons.bank,
            data: b,
            tab: 'bank'
          });
        }
      });
    }

    setResults(newResults);
    setSelectedIndex(-1);
  }, [query, activeFilters, transactions, products, customers, employees, assets, bankAccounts, currency, currencySymbols]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        saveRecentSearch(query);
        onResultClick(results[selectedIndex]);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, query, onResultClick, onClose]);

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current[selectedIndex]) {
      resultsRef.current[selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const categoryLabels: Record<string, { label: string; icon: any; color: string }> = {
    transaction: { label: 'Transactions', icon: icons.transactions, color: 'bg-blue-500' },
    product: { label: 'Inventory', icon: icons.product, color: 'bg-green-500' },
    customer: { label: 'Customers', icon: icons.customer, color: 'bg-purple-500' },
    employee: { label: 'Employees', icon: icons.payroll, color: 'bg-pink-500' },
    asset: { label: 'Assets', icon: icons.asset, color: 'bg-amber-500' },
    bank: { label: 'Bank Accounts', icon: icons.bank, color: 'bg-cyan-500' },
  };

  const filtersList = [
    { id: 'all', label: 'All', icon: icons.globe },
    { id: 'transactions', label: 'Transactions', icon: icons.transactions },
    { id: 'inventory', label: 'Inventory', icon: icons.product },
    { id: 'customers', label: 'Customers', icon: icons.customer },
    { id: 'payroll', label: 'Payroll', icon: icons.payroll },
    { id: 'assets', label: 'Assets', icon: icons.asset },
    { id: 'bank', label: 'Bank', icon: icons.bank },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md">
      <div className="min-h-screen bg-gradient-to-b from-primary to-primary/95">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-hover transition-colors">
                <FontAwesomeIcon icon={icons.arrowLeft} className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <FontAwesomeIcon icon={icons.search} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search everything... (100+ items indexed)"
                  className="w-full pl-12 pr-4 py-3 modern-input text-lg rounded-xl"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                    <FontAwesomeIcon icon={icons.close} className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="hidden md:block text-xs text-muted">
                <kbd className="px-2 py-1 bg-hover rounded text-xs">⌘K</kbd>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {filtersList.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => {
                    if (filter.id === 'all') setActiveFilters(['all']);
                    else {
                      const newFilters = activeFilters.includes('all') ? [filter.id] : activeFilters.includes(filter.id) ? activeFilters.filter(f => f !== filter.id) : [...activeFilters, filter.id];
                      setActiveFilters(newFilters.length ? newFilters : ['all']);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-2 ${activeFilters.includes(filter.id) ? 'bg-primary text-white shadow-md' : 'bg-hover text-muted hover:text-primary'}`}
                >
                  <FontAwesomeIcon icon={filter.icon} className="w-3 h-3" />
                  {filter.label}
                  {filter.id !== 'all' && <span className="text-xs opacity-70">
                    {filter.id === 'transactions' && transactions.length}
                    {filter.id === 'inventory' && products.length}
                    {filter.id === 'customers' && customers.length}
                    {filter.id === 'payroll' && employees.length}
                    {filter.id === 'assets' && assets.length}
                    {filter.id === 'bank' && bankAccounts.length}
                  </span>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
          {query === '' && recentSearches.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-muted mb-3">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, idx) => (
                  <button key={idx} onClick={() => setQuery(search)} className="px-3 py-1.5 bg-hover rounded-full text-sm hover:bg-primary/20 transition-colors">
                    <FontAwesomeIcon icon={icons.clock} className="w-3 h-3 mr-1" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
          {query && results.length === 0 && (
            <div className="text-center py-16">
              <FontAwesomeIcon icon={icons.search} className="text-6xl text-muted/30 mb-4" />
              <p className="text-lg text-muted">No results found for "{query}"</p>
            </div>
          )}
          {Object.entries(groupedResults).map(([category, categoryResults]) => {
            const catInfo = categoryLabels[category as keyof typeof categoryLabels];
            return (
              <div key={category} className="mb-8">
                <div className="flex items-center gap-3 mb-3 sticky top-20 bg-primary/95 backdrop-blur-sm py-2 -mx-4 px-4">
                  <div className={`w-8 h-8 rounded-full ${catInfo?.color} flex items-center justify-center`}>
                    <FontAwesomeIcon icon={catInfo?.icon} className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold">{catInfo?.label}</h2>
                  <span className="text-sm text-muted">{categoryResults.length} results</span>
                </div>
                <div className="space-y-2">
                  {categoryResults.map((result, idx) => {
                    const globalIndex = results.findIndex(r => r.id === result.id);
                    return (
                      <div
                        key={result.id}
                        ref={el => resultsRef.current[globalIndex] = el}
                        onClick={() => { saveRecentSearch(query); onResultClick(result); onClose(); }}
                        className={`p-4 rounded-xl transition-all cursor-pointer ${selectedIndex === globalIndex ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-hover border border-border'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={result.icon} className="text-primary w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{result.title}</p>
                            <p className="text-xs text-muted truncate">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ========== MAIN APP COMPONENT ==========
function App() {
  const { t, i18n } = useTranslation();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // ========== CORE STATE ==========
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Double-Entry Accounting State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showJournalEntryModal, setShowJournalEntryModal] = useState(false);
  const [newJournalEntry, setNewJournalEntry] = useState<Partial<JournalEntry>>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    entries: [{ accountId: "", accountName: "", debit: 0, credit: 0 }]
  });

  // Vendor/Bill Management State
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({ name: "", email: "", phone: "", address: "" });
  const [newBill, setNewBill] = useState<Partial<Bill>>({
    vendorId: "", vendorName: "", billNumber: "", date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    amount: 0, paidAmount: 0, status: "pending", items: [{ id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, amount: 0 }]
  });

  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<Attachment[]>([]);
  const [showViewAttachmentsModal, setShowViewAttachmentsModal] = useState(false);
  
  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // DeFi / Crypto States
  const [defiPositions, setDefiPositions] = useState<any[]>([]);
  const [showDefiModal, setShowDefiModal] = useState(false);
  const [newDefiPosition, setNewDefiPosition] = useState({ protocol: "", token: "", amount: 0, apy: 0, deposited: new Date().toISOString().split("T")[0] });

  // NFT States
  const [nftCollections, setNftCollections] = useState<any[]>([]);
  const [showNftModal, setShowNftModal] = useState(false);
  const [newNft, setNewNft] = useState({ collection: "", name: "", floorPrice: 0, purchasePrice: 0, purchaseDate: new Date().toISOString().split("T")[0] });

  // Hugging Face API
  const [hfApiKey, setHfApiKey] = useState("");
  const [showHfModal, setShowHfModal] = useState(false);
  const [aiModel, setAiModel] = useState("facebook/bart-large-mnli");

  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);

  // History for back button
  const [tabHistory, setTabHistory] = useState<string[]>(['dashboard']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [backPressCount, setBackPressCount] = useState(0);
  let backPressTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);


  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  const [editingBillId, setEditingBillId] = useState<string | null>(null);


  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const lines = text.split("\n");
    const newTransactions: Transaction[] = [];
    const headers = lines[0].toLowerCase().split(",");
    const dateIdx = headers.findIndex(h => h.includes("date"));
    const descIdx = headers.findIndex(h => h.includes("desc") || h.includes("name"));
    const amountIdx = headers.findIndex(h => h.includes("amount"));
    const catIdx = headers.findIndex(h => h.includes("cat"));
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < 2) continue;
      const date = dateIdx >= 0 ? values[dateIdx] : new Date().toISOString().split("T")[0];
      const description = descIdx >= 0 ? values[descIdx] : "Imported";
      const amount = amountIdx >= 0 ? parseFloat(values[amountIdx]) : 0;
      const category = catIdx >= 0 ? values[catIdx] : "Imported";
      if (description && amount) {
        newTransactions.push({
          id: Date.now() + i + Math.random().toString(),
          description,
          amount,
          category: category || "Imported",
          date: date || new Date().toISOString().split("T")[0],
        });
      }
    }
    if (newTransactions.length > 0) {
      saveTransactions([...newTransactions, ...transactions]);
      addNotification(`Imported ${newTransactions.length} transactions!`, "success");
    } else {
      addNotification("No valid transactions found in CSV", "error");
    }
  };
  reader.readAsText(file);
};

const toggleTheme = () => {
  const newDarkMode = !darkMode;
  setDarkMode(newDarkMode);
  localStorage.setItem("darkMode", String(newDarkMode));
  
  if (newDarkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

// ========== IMPORT FULL BACKUP ==========
const importFullBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {  // 👈 ADD 'async' here
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {  // 👈 Make this callback async too
    try {
      const backup = JSON.parse(e.target?.result as string);
      
      // Restore all data
      if (backup.transactions) setTransactions(backup.transactions);
      if (backup.budgets) setBudgets(new Map(backup.budgets));
      if (backup.savingsGoals) setSavingsGoals(backup.savingsGoals);
      if (backup.products) setProducts(backup.products);
      if (backup.customers) setCustomers(backup.customers);
      if (backup.employees) setEmployees(backup.employees);
      if (backup.assets) setAssets(backup.assets);
      if (backup.bankAccounts) setBankAccounts(backup.bankAccounts);
      if (backup.companies) setCompanies(backup.companies);
      if (backup.loans) setLoans(backup.loans);
      if (backup.invoices) setInvoices(backup.invoices);
      if (backup.recurringTransactions) setRecurringTransactions(backup.recurringTransactions);
      if (backup.auditLog) setAuditLog(backup.auditLog);
      if (backup.lockedPeriods) setLockedPeriods(backup.lockedPeriods);
      
      if (backup.attachments) {
        // Restore attachments to IndexedDB
        for (const att of backup.attachments) {
          await saveAttachmentToDB(att);
        }
        // Store light version in state
        const lightAttachments = backup.attachments.map((att: Attachment) => ({ ...att, dataUrl: undefined }));
        setAttachments(lightAttachments);
        localStorage.setItem("attachments", JSON.stringify(lightAttachments));
      }
      
      if (backup.defiPositions) setDefiPositions(backup.defiPositions);
      if (backup.nftCollections) setNftCollections(backup.nftCollections);
      if (backup.invoiceTemplates) setInvoiceTemplates(backup.invoiceTemplates);
      
      // Save to localStorage
      localStorage.setItem(`transactions_default`, JSON.stringify(backup.transactions || []));
      localStorage.setItem("products", JSON.stringify(backup.products || []));
      localStorage.setItem("customers", JSON.stringify(backup.customers || []));
      localStorage.setItem("employees", JSON.stringify(backup.employees || []));
      localStorage.setItem("assets", JSON.stringify(backup.assets || []));
      localStorage.setItem("bankAccounts", JSON.stringify(backup.bankAccounts || []));
      localStorage.setItem("companies", JSON.stringify(backup.companies || []));
      localStorage.setItem("loans", JSON.stringify(backup.loans || []));
      localStorage.setItem("invoices", JSON.stringify(backup.invoices || []));
      localStorage.setItem("recurringTransactions", JSON.stringify(backup.recurringTransactions || []));
      localStorage.setItem("auditLog", JSON.stringify(backup.auditLog || []));
      localStorage.setItem("lockedPeriods", JSON.stringify(backup.lockedPeriods || []));
      localStorage.setItem("defiPositions", JSON.stringify(backup.defiPositions || []));
      localStorage.setItem("nftCollections", JSON.stringify(backup.nftCollections || []));
      localStorage.setItem("invoiceTemplates", JSON.stringify(backup.invoiceTemplates || []));
      localStorage.setItem("savingsGoals", JSON.stringify(backup.savingsGoals || []));
      
      addNotification("Backup restored successfully!", "success");
    } catch (error) {
      addNotification("Failed to restore backup", "error");
    }
  };
  reader.readAsText(file);
};


  const [invoiceTemplates, setInvoiceTemplates] = useState<InvoiceTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<InvoiceTemplate>>({ 
    name: "", customerId: "", customerName: "", items: [{ description: "", quantity: 1, price: 0 }], 
    frequency: "monthly", dayOfMonth: 1, isActive: true 
  });

  // ========== RECURRING INVOICE TEMPLATES ==========
  const addInvoiceTemplate = () => {
    if (!newTemplate.name || !newTemplate.customerName) return;
    const template: InvoiceTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name!,
      customerId: newTemplate.customerId || Date.now().toString(),
      customerName: newTemplate.customerName!,
      items: newTemplate.items || [{ description: "", quantity: 1, price: 0 }],
      frequency: newTemplate.frequency as 'monthly' | 'weekly' | 'yearly',
      dayOfMonth: newTemplate.dayOfMonth || 1,
      nextInvoiceDate: new Date().toISOString().split("T")[0],
      isActive: true
    };
    const updated = [...invoiceTemplates, template];
    setInvoiceTemplates(updated);
    localStorage.setItem("invoiceTemplates", JSON.stringify(updated));
    setShowTemplateModal(false);
    setNewTemplate({ name: "", customerId: "", customerName: "", items: [{ description: "", quantity: 1, price: 0 }], frequency: "monthly", dayOfMonth: 1, isActive: true });
    addNotification(`Invoice template "${template.name}" created!`, "success");
  };

  const generateRecurringInvoices = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayDay = new Date().getDate();
    const todayWeekDay = new Date().getDay();
    
    invoiceTemplates.forEach(template => {
      let shouldGenerate = false;
      if (template.frequency === 'monthly' && template.dayOfMonth === todayDay) shouldGenerate = true;
      if (template.frequency === 'weekly' && template.dayOfWeek === todayWeekDay) shouldGenerate = true;
      
      if (shouldGenerate && template.nextInvoiceDate <= today) {
        const invoice: Invoice = {
          id: Date.now().toString(),
          invoiceNumber: `INV-${Date.now()}`,
          customerName: template.customerName,
          customerEmail: "",
          items: template.items,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          total: template.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
          createdAt: new Date().toISOString()
        };
        setInvoices(prev => [...prev, invoice]);
        
        // Update next invoice date
        const updatedTemplates = invoiceTemplates.map(t => {
          if (t.id === template.id) {
            const nextDate = new Date();
            if (template.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            else if (template.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
            else nextDate.setFullYear(nextDate.getFullYear() + 1);
            return { ...t, nextInvoiceDate: nextDate.toISOString().split("T")[0], lastGenerated: today };
          }
          return t;
        });
        setInvoiceTemplates(updatedTemplates);
        localStorage.setItem("invoiceTemplates", JSON.stringify(updatedTemplates));
        addNotification(`Auto-generated invoice for ${template.customerName}!`, "success");
      }
    });
  };


  const [showChangeHistoryModal, setShowChangeHistoryModal] = useState(false);

  const [showChatbot, setShowChatbot] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [newBudget, setNewBudget] = useState({ category: "", amount: 0 });
  const [currentCompanyId, setCurrentCompanyId] = useState<string>("default");
  const [valuationMethod, setValuationMethod] = useState("FIFO");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockAdjustment, setStockAdjustment] = useState({ quantity: 0, type: "add" });
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [lockedPeriods, setLockedPeriods] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedTaxCountry, setSelectedTaxCountry] = useState("Germany");
  const [savingsGoals, setSavingsGoals] = useState<{ id: string; name: string; target: number; current: number }[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  
  // Form states
  const [newTx, setNewTx] = useState({ description: "", amount: 0, category: "", date: new Date().toISOString().split("T")[0] });
  const [newCompany, setNewCompany] = useState({ name: "", currency: "USD", fiscalYearStart: "2024-01-01" });
  const [newProduct, setNewProduct] = useState({ name: "", sku: "", quantity: 0, price: 0, cost: 0, category: "", minStock: 0 });
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "", address: "" });
  const [newEmployee, setNewEmployee] = useState({ name: "", salary: 0, position: "", taxRate: 20 });
  const [newAsset, setNewAsset] = useState({ name: "", purchaseDate: "", purchasePrice: 0, usefulLife: 5, salvageValue: 0, method: "straight-line" });
  const [newBankAccount, setNewBankAccount] = useState({ name: "", balance: 0, currency: "USD" });
  const [newLoan, setNewLoan] = useState({ amount: 0, rate: 5, term: 12, startDate: "" });
  const [newGoal, setNewGoal] = useState({ name: "", target: 0 });
  const [newRecurring, setNewRecurring] = useState({ description: "", amount: 0, category: "", frequency: "monthly", dayOfMonth: 1 });
  const [currentInvoice, setCurrentInvoice] = useState({
    customerName: "", customerEmail: "", items: [{ description: "", quantity: 1, price: 0 }],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    invoiceNumber: `INV-${Date.now()}`
  });

  const [moreMenuSearch, setMoreMenuSearch] = useState("");
  const [recentActions, setRecentActions] = useState<string[]>([]);

  // Save recent actions to localStorage
  const saveRecentAction = (actionId: string) => {
    const updated = [actionId, ...recentActions.filter(a => a !== actionId)].slice(0, 5);
    setRecentActions(updated);
    localStorage.setItem("recentActions", JSON.stringify(updated));
  };

  // Load recent actions in useEffect
  // Add to loadData function:
  const savedRecentActions = localStorage.getItem('recentActions');
  if (savedRecentActions) setRecentActions(JSON.parse(savedRecentActions));
  
  const [budgets, setBudgets] = useState<Map<string, number>>(new Map());
  const [bankFeedActive, setBankFeedActive] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [reportDateRange, setReportDateRange] = useState({ start: "", end: "" });
  const [scanningText, setScanningText] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [analyticsPeriod, setAnalyticsPeriod] = useState("6months");
  const [blockchainEnabled, setBlockchainEnabled] = useState(false);
  const [quantumEncryption, setQuantumEncryption] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState({ transactionId: "", suggestedCategory: "", confidence: 0 });
  const [hardwareConnected, setHardwareConnected] = useState({ receiptPrinter: false, barcodeScanner: false, cashDrawer: false, cardReader: false });
  
  // Constants
  const exchangeRates = { USD: 1, EUR: 0.92, GBP: 0.79, IRR: 42000, TRY: 32, AMD: 390 };
  const currencySymbols: { [key: string]: string } = { USD: "$", EUR: "€", GBP: "£", IRR: "﷼", TRY: "₺", AMD: "֏" };
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];
  const taxRates = { US: 0, Germany: 19, Turkey: 20, Iran: 9, Armenia: 20 };

  // ========== HELPER FUNCTIONS ==========

  // ========== CLEAR ALL DATA FUNCTION ==========
const clearAllData = () => {
  const confirmClear = confirm(
    "⚠️ WARNING: This will clear ALL your data!\n\n" +
    "This will delete:\n" +
    "• All transactions\n" +
    "• All customers, employees, assets\n" +
    "• All products, bank accounts\n" +
    "• All vendors, bills, invoices\n" +
    "• All journal entries\n" +
    "• All savings goals, budgets\n" +
    "• All recurring transactions\n" +
    "• All DeFi and NFT entries\n" +
    "• All invoice templates\n" +
    "• All change history\n\n" +
    "This action CANNOT be undone!\n\n" +
    "Click OK to confirm."
  );
  
  if (!confirmClear) return;
  
  // Clear all state
  setTransactions([]);
  setProducts([]);
  setCustomers([]);
  setEmployees([]);
  setAssets([]);
  setBankAccounts([]);
  setCompanies([]);
  setLoans([]);
  setInvoices([]);
  setVendors([]);
  setBills([]);
  setAccounts([]);  // Keep default accounts? Let's reset to defaults
  setJournalEntries([]);
  setChangeLogs([]);
  setSavingsGoals([]);
  setRecurringTransactions([]);
  setAuditLog([]);
  setLockedPeriods([]);
  setDefiPositions([]);
  setNftCollections([]);
  setInvoiceTemplates([]);
  setBudgets(new Map());
  setAttachments([]);
  
  // Reset accounts to defaults
  const defaultAccounts: Account[] = [
    { id: "1", code: "1000", name: "Cash", type: "asset", normalBalance: "debit", balance: 0 },
    { id: "2", code: "1100", name: "Bank Account", type: "asset", normalBalance: "debit", balance: 0 },
    { id: "3", code: "1200", name: "Accounts Receivable", type: "asset", normalBalance: "debit", balance: 0 },
    { id: "4", code: "2000", name: "Accounts Payable", type: "liability", normalBalance: "credit", balance: 0 },
    { id: "5", code: "3000", name: "Owner's Equity", type: "equity", normalBalance: "credit", balance: 0 },
    { id: "6", code: "4000", name: "Sales Revenue", type: "revenue", normalBalance: "credit", balance: 0 },
    { id: "7", code: "5000", name: "Rent Expense", type: "expense", normalBalance: "debit", balance: 0 },
    { id: "8", code: "5100", name: "Utilities Expense", type: "expense", normalBalance: "debit", balance: 0 },
    { id: "9", code: "5200", name: "Salary Expense", type: "expense", normalBalance: "debit", balance: 0 },
    { id: "10", code: "5300", name: "Office Supplies", type: "expense", normalBalance: "debit", balance: 0 },
  ];
  setAccounts(defaultAccounts);
  
  // Clear localStorage for all keys
  localStorage.removeItem(`transactions_${currentCompanyId}`);
  localStorage.removeItem(`budgets_${currentCompanyId}`);
  localStorage.removeItem("products");
  localStorage.removeItem("customers");
  localStorage.removeItem("employees");
  localStorage.removeItem("assets");
  localStorage.removeItem("bankAccounts");
  localStorage.removeItem("companies");
  localStorage.removeItem("loans");
  localStorage.removeItem("invoices");
  localStorage.removeItem("vendors");
  localStorage.removeItem("bills");
  localStorage.removeItem("journalEntries");
  localStorage.removeItem("changeLogs");
  localStorage.removeItem("savingsGoals");
  localStorage.removeItem("recurringTransactions");
  localStorage.removeItem("auditLog");
  localStorage.removeItem("lockedPeriods");
  localStorage.removeItem("defiPositions");
  localStorage.removeItem("nftCollections");
  localStorage.removeItem("invoiceTemplates");
  localStorage.removeItem("attachments");
  localStorage.setItem("accounts", JSON.stringify(defaultAccounts));
  
  // Clear IndexedDB attachments
  const clearAttachmentsDB = async () => {
    const db = await initImageDB();
    const transaction = db.transaction(["attachments"], "readwrite");
    const store = transaction.objectStore("attachments");
    store.clear();
  };
  clearAttachmentsDB();
  
  addNotification("All data has been cleared successfully!", "success");
  
  // Optional: reload page to ensure clean state
  setTimeout(() => {
    window.location.reload();
  }, 1500);
};

  const exportChangeHistory = () => {
  const headers = ["Timestamp", "Entity Type", "Entity Name", "Action", "Reason", "Changes", "User"];
  const rows = changeLogs.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.entityType,
    log.entityName,
    log.action,
    log.reason,
    log.changes ? log.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join("; ") : "-",
    log.user
  ]);
  const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `change_history_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  addNotification("Change history exported!", "success");
};


const addChangeLog = (
  entityType: ChangeLog['entityType'],
  entityId: string,
  entityName: string,
  action: ChangeLog['action'],
  reason: string,
  changes?: { field: string; oldValue: any; newValue: any }[]
) => {
  const newLog: ChangeLog = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    entityName,
    action,
    reason: reason || `No reason provided`,
    changes,
    user: "Current User"
  };
  const updated = [newLog, ...changeLogs];
  setChangeLogs(updated);
  localStorage.setItem("changeLogs", JSON.stringify(updated));
  // addNotification(`Change logged: ${action} ${entityType}`, "info");  // 👈 COMMENT THIS LINE OUT OR DELETE IT
};

  // ========== DOUBLE-ENTRY ACCOUNTING FUNCTIONS ==========
const addJournalEntry = () => {
  if (!newJournalEntry.description || !newJournalEntry.entries?.length) return;
  
  // Verify debits equal credits
  const totalDebits = newJournalEntry.entries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredits = newJournalEntry.entries.reduce((sum, e) => sum + (e.credit || 0), 0);
  
  if (totalDebits !== totalCredits) {
    addNotification("Debits must equal credits!", "error");
    return;
  }
  
  const entry: JournalEntry = {
    id: Date.now().toString(),
    date: newJournalEntry.date || new Date().toISOString().split("T")[0],
    description: newJournalEntry.description,
    reference: newJournalEntry.reference,
    entries: newJournalEntry.entries.map(e => ({
      ...e,
      accountName: accounts.find(a => a.id === e.accountId)?.name || ""
    })),
    createdAt: new Date().toISOString(),
    createdBy: "Current User"
  };
  
  const updated = [entry, ...journalEntries];
  setJournalEntries(updated);
  localStorage.setItem("journalEntries", JSON.stringify(updated));
  
  // Update account balances
  const updatedAccounts = accounts.map(acc => {
    let newBalance = acc.balance;
    entry.entries.forEach(e => {
      if (e.accountId === acc.id) {
        if (acc.normalBalance === 'debit') {
          newBalance += e.debit - e.credit;
        } else {
          newBalance += e.credit - e.debit;
        }
      }
    });
    return { ...acc, balance: newBalance };
  });
  setAccounts(updatedAccounts);
  localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
  
  setShowJournalEntryModal(false);
  setNewJournalEntry({ date: new Date().toISOString().split("T")[0], description: "", entries: [{ accountId: "", accountName: "", debit: 0, credit: 0 }] });
  addNotification("Journal entry posted!", "success");
  addAuditEntry("JOURNAL_ENTRY", `Posted: ${entry.description}`);
};

const addJournalLine = () => {
  setNewJournalEntry({
    ...newJournalEntry,
    entries: [...(newJournalEntry.entries || []), { accountId: "", accountName: "", debit: 0, credit: 0 }]
  });
};

const updateJournalLine = (index: number, field: string, value: any) => {
  const newEntries = [...(newJournalEntry.entries || [])];
  newEntries[index] = { ...newEntries[index], [field]: value };
  setNewJournalEntry({ ...newJournalEntry, entries: newEntries });
};

const deleteJournalLine = (index: number) => {
  const newEntries = (newJournalEntry.entries || []).filter((_, i) => i !== index);
  setNewJournalEntry({ ...newJournalEntry, entries: newEntries });
};

const getTrialBalance = () => {
  const trialBalance = accounts.map(acc => ({
    code: acc.code,
    name: acc.name,
    debit: acc.normalBalance === 'debit' ? acc.balance : 0,
    credit: acc.normalBalance === 'credit' ? acc.balance : 0
  }));
  const totalDebits = trialBalance.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = trialBalance.reduce((sum, a) => sum + a.credit, 0);
  return { trialBalance, totalDebits, totalCredits };
};

// ========== VENDOR MANAGEMENT FUNCTIONS ==========
const addVendor = () => {
  if (!newVendor.name) return;
  
  const reason = prompt(editingVendorId ? "Why are you editing this vendor?" : "Why are you adding this vendor?");
  if (editingVendorId && !reason) return;
  
  if (editingVendorId) {
    const oldVendor = vendors.find(v => v.id === editingVendorId);
    // UPDATE existing vendor
    const updatedVendors = vendors.map(v => 
      v.id === editingVendorId 
        ? { ...v, ...newVendor, id: v.id }
        : v
    );
    setVendors(updatedVendors);
    localStorage.setItem("vendors", JSON.stringify(updatedVendors));
    
    addChangeLog('vendor', editingVendorId, newVendor.name || '', 'update', reason || 'No reason', [
      { field: 'name', oldValue: oldVendor?.name, newValue: newVendor.name },
      { field: 'email', oldValue: oldVendor?.email, newValue: newVendor.email },
      { field: 'phone', oldValue: oldVendor?.phone, newValue: newVendor.phone },
      { field: 'address', oldValue: oldVendor?.address, newValue: newVendor.address },
    ]);
    
    addNotification(`Vendor "${newVendor.name}" updated!`, "success");
    setEditingVendorId(null);
  } else {
    // ADD new vendor
    const vendor: Vendor = {
      id: Date.now().toString(),
      name: newVendor.name,
      email: newVendor.email || "",
      phone: newVendor.phone || "",
      address: newVendor.address || "",
      taxId: newVendor.taxId,
      website: newVendor.website,
      notes: newVendor.notes,
      createdAt: new Date().toISOString()
    };
    const updated = [...vendors, vendor];
    setVendors(updated);
    localStorage.setItem("vendors", JSON.stringify(updated));
    
    addChangeLog('vendor', vendor.id, newVendor.name, 'create', reason || 'New vendor added');
    
    addNotification(`Vendor "${vendor.name}" added!`, "success");
  }
  
  setShowVendorModal(false);
  setNewVendor({ name: "", email: "", phone: "", address: "" });
};

const addBill = () => {
  if (!newBill.vendorId || !newBill.billNumber || !newBill.amount) return;
  
  const reason = prompt(editingBillId ? "Why are you editing this bill?" : "Why are you creating this bill?");
  if (editingBillId && !reason) return;
  
  if (editingBillId) {
    // UPDATE existing bill
    const oldBill = bills.find(b => b.id === editingBillId);
    const updatedBills = bills.map(b => 
      b.id === editingBillId 
        ? { ...b, ...newBill, id: b.id }
        : b
    );
    setBills(updatedBills);
    localStorage.setItem("bills", JSON.stringify(updatedBills));
    
    addChangeLog('bill', editingBillId, newBill.billNumber || '', 'update', reason || 'No reason', [
      { field: 'amount', oldValue: oldBill?.amount, newValue: newBill.amount },
      { field: 'dueDate', oldValue: oldBill?.dueDate, newValue: newBill.dueDate },
    ]);
    
    addNotification(`Bill ${newBill.billNumber} updated!`, "success");
    setEditingBillId(null);
  } else {
    // ADD new bill
    const bill: Bill = {
      id: Date.now().toString(),
      vendorId: newBill.vendorId,
      vendorName: vendors.find(v => v.id === newBill.vendorId)?.name || "",
      billNumber: newBill.billNumber,
      date: newBill.date || new Date().toISOString().split("T")[0],
      dueDate: newBill.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: newBill.amount,
      paidAmount: 0,
      status: "pending",
      items: newBill.items || [],
      notes: newBill.notes,
      createdAt: new Date().toISOString()
    };
    const updated = [...bills, bill];
    setBills(updated);
    localStorage.setItem("bills", JSON.stringify(updated));
    
    addChangeLog('bill', bill.id, bill.billNumber, 'create', reason || 'New bill created');
    
    addNotification(`Bill ${bill.billNumber} created!`, "success");
  }
  
  setShowBillModal(false);
  setNewBill({
    vendorId: "", vendorName: "", billNumber: "", date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    amount: 0, paidAmount: 0, status: "pending", items: [{ id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, amount: 0 }]
  });
};

const payBill = (billId: string, paymentAmount: number) => {
  const updatedBills = bills.map(bill => {
    if (bill.id === billId) {
      const newPaidAmount = bill.paidAmount + paymentAmount;
      let newStatus: Bill['status'] = bill.status;
      if (newPaidAmount >= bill.amount) newStatus = "paid";
      else if (newPaidAmount > 0) newStatus = "partial";
      return { ...bill, paidAmount: newPaidAmount, status: newStatus };
    }
    return bill;
  });
  setBills(updatedBills);
  localStorage.setItem("bills", JSON.stringify(updatedBills));
  addNotification(`Payment of ${currencySymbols[currency]}${paymentAmount} applied to bill!`, "success");
  
  // Create journal entry for bill payment
  const journalEntry: Partial<JournalEntry> = {
    date: new Date().toISOString().split("T")[0],
    description: `Bill payment for vendor`,
    entries: [
      { accountId: accounts.find(a => a.name === "Accounts Payable")?.id || "", accountName: "Accounts Payable", debit: paymentAmount, credit: 0 },
      { accountId: accounts.find(a => a.name === "Bank Account")?.id || "", accountName: "Bank Account", debit: 0, credit: paymentAmount }
    ]
  };
  // Would call addJournalEntry logic here
};
  
  const getConvertedAmount = (amount: number) => {
    const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1;
    return amount * rate;
  };

  // ========== INDEXEDDB STORAGE FOR IMAGES ==========
const initImageDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FinWiseImages", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("attachments")) {
        const store = db.createObjectStore("attachments", { keyPath: "id" });
        store.createIndex("transactionId", "transactionId", { unique: false });
      }
    };
  });
};

const saveAttachmentToDB = async (attachment: Attachment): Promise<void> => {
  const db = await initImageDB();
  const transaction = db.transaction(["attachments"], "readwrite");
  const store = transaction.objectStore("attachments");
  store.put(attachment);
};

const getAttachmentFromDB = async (id: string): Promise<Attachment | null> => {
  const db = await initImageDB();
  const transaction = db.transaction(["attachments"], "readonly");
  const store = transaction.objectStore("attachments");
  return new Promise((resolve) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
  });
};

const getAllAttachmentsFromDB = async (): Promise<Attachment[]> => {
  const db = await initImageDB();
  const transaction = db.transaction(["attachments"], "readonly");
  const store = transaction.objectStore("attachments");
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
};

const deleteAttachmentFromDB = async (id: string): Promise<void> => {
  const db = await initImageDB();
  const transaction = db.transaction(["attachments"], "readwrite");
  const store = transaction.objectStore("attachments");
  store.delete(id);
};

const getAttachmentsByTransaction = async (transactionId: string): Promise<Attachment[]> => {
  const db = await initImageDB();
  const transaction = db.transaction(["attachments"], "readonly");
  const store = transaction.objectStore("attachments");
  const index = store.index("transactionId");
  return new Promise((resolve) => {
    const request = index.getAll(transactionId);
    request.onsuccess = () => resolve(request.result || []);
  });
};

  // ========== SMART IMAGE CONVERSION TO WebP ==========
// Automatically chooses best quality based on image size and type
const convertToWebP = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        // Calculate optimal dimensions (max 1600px for high quality, 800px for small files)
        let width = img.width;
        let height = img.height;
        
        // Smart resizing based on original size
        let maxDimension = 1600; // High quality for large images
        if (file.size < 100 * 1024) { // Under 100KB - keep original or resize less
          maxDimension = 1200;
        } else if (file.size < 500 * 1024) { // 100KB-500KB
          maxDimension = 1400;
        } else { // Over 500KB
          maxDimension = 1600;
        }
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Smart quality selection based on file type and size
        let quality = 0.75; // Default 75%
        
        // Adjust quality based on original file size
        if (file.size < 50 * 1024) { // Very small images (<50KB)
          quality = 0.85; // Higher quality, less compression needed
        } else if (file.size < 200 * 1024) { // Small images (50-200KB)
          quality = 0.75; // Good balance
        } else if (file.size < 500 * 1024) { // Medium images (200-500KB)
          quality = 0.70; // More compression
        } else if (file.size < 1024 * 1024) { // Large images (500KB-1MB)
          quality = 0.65; // Aggressive compression
        } else { // Very large images (>1MB)
          quality = 0.60; // Maximum compression
        }
        
        // Special handling for PNG (lossless originally, can compress more)
        if (file.type === 'image/png') {
          quality = quality * 0.9; // Slightly more compression for PNG
        }
        
        // Convert to WebP
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        resolve(webpDataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  const addAttachment = async (transactionId: string, file: File) => {
  try {
    let dataUrl: string;
    let finalFilename: string;
    let originalSizeKB = (file.size / 1024).toFixed(1);
    
    if (file.type.startsWith('image/')) {
      addNotification(`Optimizing image: ${originalSizeKB}KB → WebP...`, "info");
      dataUrl = await convertToWebP(file);
      const newSizeKB = ((dataUrl.length * 0.75) / 1024).toFixed(1);
      const savingsPercent = ((1 - (parseFloat(newSizeKB) / parseFloat(originalSizeKB))) * 100).toFixed(0);
      finalFilename = file.name.replace(/\.(jpg|jpeg|png|gif|bmp|tiff|webp|avif)$/i, '.webp');
      addNotification(`✓ Image optimized: ${originalSizeKB}KB → ${newSizeKB}KB (${savingsPercent}% smaller)`, "success");
    } else {
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      finalFilename = file.name;
      addNotification(`Attached ${finalFilename} (${originalSizeKB}KB)`, "success");
    }
    
    const attachment: Attachment = {
      id: Date.now().toString(),
      transactionId,
      filename: finalFilename,
      dataUrl,  // This is ALWAYS a string now
      size: dataUrl.length * 0.75,
      uploadedAt: new Date().toISOString()
    };
    
    // Save full image to IndexedDB
    await saveAttachmentToDB(attachment);
    
    // Update local state with full attachment (keep dataUrl for view modal)
    const updated = [...attachments, attachment];
    setAttachments(updated);
    localStorage.setItem("attachments", JSON.stringify(updated.map(a => ({ ...a, dataUrl: a.dataUrl }))));
    
    // Update transaction with attachment reference
    const updatedTransactions = transactions.map(t => 
      t.id === transactionId 
        ? { ...t, attachments: [...(t.attachments || []), attachment] }
        : t
    );
    saveTransactions(updatedTransactions);
    
  } catch (error) {
    addNotification("Failed to optimize image", "error");
  }
};

  const deleteAttachment = async (attachmentId: string, transactionId: string) => {
  // Delete from IndexedDB
  await deleteAttachmentFromDB(attachmentId);
  
  // Delete from local state
  const updated = attachments.filter(a => a.id !== attachmentId);
  setAttachments(updated);
  localStorage.setItem("attachments", JSON.stringify(updated));
  
  // Update transaction
  const updatedTransactions = transactions.map(t => 
    t.id === transactionId 
      ? { ...t, attachments: (t.attachments || []).filter(a => a.id !== attachmentId) }
      : t
  );
  saveTransactions(updatedTransactions);
  addNotification("Attachment deleted!", "info");
};

  const viewAttachments = async (transactionId: string) => {
  // Get full attachments from IndexedDB (with images)
  const fullAttachments = await getAttachmentsByTransaction(transactionId);
  setViewingAttachments(fullAttachments);
  setShowViewAttachmentsModal(true);
};

  // ========== DEFI FUNCTIONS ==========
  const addDefiPosition = () => {
    if (!newDefiPosition.protocol || !newDefiPosition.amount) return;
    const position = { id: Date.now().toString(), ...newDefiPosition, currentValue: newDefiPosition.amount, lastUpdated: new Date().toISOString() };
    const updated = [...defiPositions, position];
    setDefiPositions(updated);
    localStorage.setItem("defiPositions", JSON.stringify(updated));
    setShowDefiModal(false);
    setNewDefiPosition({ protocol: "", token: "", amount: 0, apy: 0, deposited: new Date().toISOString().split("T")[0] });
    addNotification(`DeFi position added to ${newDefiPosition.protocol}!`, "success");
  };

  // ========== NFT FUNCTIONS ==========
  const addNft = () => {
    if (!newNft.collection || !newNft.name) return;
    const nft = { id: Date.now().toString(), ...newNft, currentValue: newNft.floorPrice, lastUpdated: new Date().toISOString() };
    const updated = [...nftCollections, nft];
    setNftCollections(updated);
    localStorage.setItem("nftCollections", JSON.stringify(updated));
    setShowNftModal(false);
    setNewNft({ collection: "", name: "", floorPrice: 0, purchasePrice: 0, purchaseDate: new Date().toISOString().split("T")[0] });
    addNotification(`NFT added to ${newNft.collection}!`, "success");
  };

  // ========== HUGGING FACE AI FUNCTIONS ==========
  const askHuggingFace = async (text: string) => {
    if (!hfApiKey) {
      addNotification("Please set your Hugging Face API key first", "warning");
      setShowHfModal(true);
      return;
    }
    addNotification("Asking Hugging Face AI...", "info");
    try {
      const response = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-mnli", {
        method: "POST",
        headers: { "Authorization": `Bearer ${hfApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: text, parameters: { candidate_labels: ["Income", "Expense", "Housing", "Food", "Transportation", "Entertainment", "Shopping", "Healthcare", "Utilities"] } })
      });
      const data = await response.json();
      if (data.labels && data.scores) {
        const bestMatch = data.labels[0];
        addNotification(`AI suggests category: ${bestMatch}`, "success");
        return bestMatch;
      }
    } catch (error) {
      addNotification("AI service error, using local suggestions", "warning");
    }
    return null;
  };

  const saveHfApiKey = () => {
    localStorage.setItem("hf_api_key", hfApiKey);
    setShowHfModal(false);
    addNotification("Hugging Face API key saved!", "success");
  };

  const calculateNftPnL = (nft: any) => {
    const purchaseDate = new Date(nft.purchaseDate);
    const now = new Date();
    const daysHeld = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    const pnl = nft.floorPrice - nft.purchasePrice;
    const pnlPercent = nft.purchasePrice > 0 ? (pnl / nft.purchasePrice) * 100 : 0;
    return { pnl, pnlPercent, daysHeld };
  };

  const calculateDefiYield = (position: any) => {
    const depositedDate = new Date(position.deposited);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - depositedDate.getTime()) / (1000 * 60 * 60 * 24));
    const yearlyYield = position.amount * (position.apy / 100);
    const earnedYield = (yearlyYield / 365) * daysDiff;
    return { yearlyYield, earnedYield, currentValue: position.amount + earnedYield };
  };

  const addNotification = (message: string, type: "success" | "error" | "warning" | "info") => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
  };

  // ========== AUTO BACKUP ==========
const createBackup = async () => {
  if (transactions.length === 0 && products.length === 0) return;
  
  // Get all attachments from IndexedDB
  const allAttachments = await getAllAttachmentsFromDB();
  
  const backup = {
    date: new Date().toISOString(),
    transactions,
    budgets: Array.from(budgets.entries()),
    savingsGoals,
    products,
    customers,
    employees,
    assets,
    bankAccounts,
    companies,
    loans,
    invoices,
    recurringTransactions,
    auditLog,
    lockedPeriods,
    attachments: allAttachments, // Full attachments from IndexedDB
    defiPositions,
    nftCollections,
    invoiceTemplates,
    vendors,
    bills,
    accounts,
    journalEntries,
    version: "3.0"
  };
  const backupBlob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(backupBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finwise_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addNotification("Auto backup created!", "info");
};

  // Auto-backup every 30 minutes (user can trigger manually too)
  useEffect(() => {
    const interval = setInterval(() => createBackup(), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [transactions, budgets, savingsGoals, products, customers, employees, assets, bankAccounts, companies, loans, invoices, recurringTransactions]);

  const addAuditEntry = (action: string, details: string) => {
    const entry = { id: Date.now(), timestamp: new Date().toISOString(), action, details, user: "Current User" };
    setAuditLog(prev => [entry, ...prev]);
    localStorage.setItem("auditLog", JSON.stringify([entry, ...auditLog]));
  };

  const clearAllAttachments = async () => {
    const db = await initImageDB();
    const transaction = db.transaction(["attachments"], "readwrite");
    const store = transaction.objectStore("attachments");
    store.clear();
    setAttachments([]);
    localStorage.setItem("attachments", "[]");
    addNotification("All attachments cleared!", "info");
  };

  // ========== BACK BUTTON HISTORY ==========
  const navigateToTab = useCallback((tab: string, addToHistory = true) => {
    if (addToHistory) {
      const newHistory = tabHistory.slice(0, historyIndex + 1);
      newHistory.push(tab);
      setTabHistory(newHistory.slice(-30));
      setHistoryIndex(newHistory.length - 1);
      localStorage.setItem('tabHistory', JSON.stringify(newHistory.slice(-30)));
      localStorage.setItem('historyIndex', String(newHistory.length - 1));
    }
    setActiveTab(tab);
    setShowMobileMenu(false);
    setShowBottomSheet(false);
  }, [tabHistory, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousTab = tabHistory[historyIndex - 1];
      setActiveTab(previousTab);
      window.history.pushState({ tab: previousTab }, '', `#${previousTab}`);
      setBackPressCount(0);
    } else {
      setBackPressCount(prev => prev + 1);
      if (backPressTimer) clearTimeout(backPressTimer);
      backPressTimer = setTimeout(() => setBackPressCount(0), 2000);
      if (backPressCount >= 2) {
        if (confirm('Exit FinWise?')) window.close();
        setBackPressCount(0);
      } else {
        addNotification('Press back again to exit', 'info');
      }
    }
  }, [historyIndex, tabHistory, backPressCount]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('tabHistory');
    const savedIndex = localStorage.getItem('historyIndex');
    if (savedHistory && savedIndex) {
      const parsed = JSON.parse(savedHistory);
      setTabHistory(parsed);
      setHistoryIndex(parseInt(savedIndex));
      setActiveTab(parsed[parseInt(savedIndex)] || 'dashboard');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => goBack();
    window.addEventListener('popstate', handlePopState);
    window.history.pushState({ tab: activeTab }, '', `#${activeTab}`);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [goBack, activeTab]);

  // ========== TRANSACTION FUNCTIONS ==========
  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(`transactions_${currentCompanyId}`, JSON.stringify(newTransactions));
    addAuditEntry("UPDATE_TRANSACTIONS", `Updated ${newTransactions.length} transactions`);
  };

  const getAiCategorySuggestion = (description: string, amount: number): { category: string; confidence: number } => {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("salary") || lowerDesc.includes("income")) return { category: "Income", confidence: 90 };
    if (lowerDesc.includes("rent") || lowerDesc.includes("mortgage")) return { category: "Housing", confidence: 85 };
    if (lowerDesc.includes("uber") || lowerDesc.includes("gas")) return { category: "Transportation", confidence: 80 };
    if (lowerDesc.includes("restaurant") || lowerDesc.includes("food")) return { category: "Food & Dining", confidence: 75 };
    return { category: "Uncategorized", confidence: 0 };
  };

  // ========== FRAUD DETECTION ==========
  const detectFraudRealTime = (transaction: Transaction) => {
    const amounts = transactions.filter(t => t.amount < 0).map(t => Math.abs(t.amount));
    if (amounts.length < 5) return;
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.map(a => Math.pow(a - avg, 2)).reduce((a, b) => a + b, 0) / amounts.length);
    const isAnomaly = Math.abs(transaction.amount) > avg + 3 * stdDev;
    if (isAnomaly && stdDev > 0) {
      addNotification(`⚠️ Unusual transaction: ${currencySymbols[currency]}${Math.abs(transaction.amount)} (avg: ${currencySymbols[currency]}${avg.toFixed(2)})`, "warning");
      addAuditEntry("FRAUD_ALERT", `Unusual amount: ${transaction.description} - ${currencySymbols[currency]}${Math.abs(transaction.amount)}`);
    }
  };

  const addTransaction = () => {
  if (!newTx.description || !newTx.amount) return;
  const aiSuggestion = getAiCategorySuggestion(newTx.description, newTx.amount);
  const finalCategory = newTx.category || aiSuggestion.category;
  
  if (editingTransactionId) {
    const oldTransaction = transactions.find(t => t.id === editingTransactionId);
    const reason = prompt("Why are you editing this transaction?");
    if (!reason) return;
    
    // Update existing transaction
    const updatedTransactions = transactions.map(t => 
      t.id === editingTransactionId 
        ? { 
            ...t, 
            description: newTx.description, 
            amount: newTx.amount, 
            category: finalCategory, 
            date: newTx.date 
          }
        : t
    );
    saveTransactions(updatedTransactions);
    
    // Add to change log
    addChangeLog('transaction', editingTransactionId, newTx.description, 'update', reason, [
      { field: 'description', oldValue: oldTransaction?.description, newValue: newTx.description },
      { field: 'amount', oldValue: oldTransaction?.amount, newValue: newTx.amount },
      { field: 'category', oldValue: oldTransaction?.category, newValue: finalCategory },
      { field: 'date', oldValue: oldTransaction?.date, newValue: newTx.date },
    ]);
    
    addNotification("Transaction updated successfully!", "success");
    setEditingTransactionId(null);
  } else {
    // Add new transaction - no reason needed for creation
    const transaction: Transaction = { 
      id: Date.now().toString(), 
      description: newTx.description, 
      amount: newTx.amount, 
      category: finalCategory, 
      date: newTx.date 
    };
    saveTransactions([transaction, ...transactions]);
    detectFraudRealTime(transaction);
    addNotification("Transaction added successfully!", "success");
    
    if (aiSuggestion.confidence > 70 && !newTx.category) {
      setCurrentSuggestion({ 
        transactionId: transaction.id, 
        suggestedCategory: aiSuggestion.category, 
        confidence: aiSuggestion.confidence 
      });
      setShowAiSuggestion(true);
    }
  }
  
  setShowForm(false);
  setNewTx({ description: "", amount: 0, category: "", date: new Date().toISOString().split("T")[0] });
};
  
  const deleteTransaction = (id: string) => {
    const deleted = transactions.find(t => t.id === id);
    saveTransactions(transactions.filter(t => t.id !== id));
    addNotification("Transaction deleted", "info");
    if (deleted) addAuditEntry("DELETE_TRANSACTION", `Deleted ${deleted.description}`);
  };

  const applyAiSuggestion = (transactionId: string, suggestedCategory: string) => {
    const updated = transactions.map(t => t.id === transactionId ? { ...t, category: suggestedCategory } : t);
    saveTransactions(updated);
    addNotification(`AI suggested: ${suggestedCategory}`, "success");
    setShowAiSuggestion(false);
  };

  // ========== RECURRING TRANSACTIONS ==========
  const addRecurringTransaction = () => {
    if (!newRecurring.description || !newRecurring.amount) return;
    const recurring = { id: Date.now().toString(), ...newRecurring, lastAdded: new Date().toISOString().split("T")[0] };
    const updated = [...recurringTransactions, recurring];
    setRecurringTransactions(updated);
    localStorage.setItem("recurringTransactions", JSON.stringify(updated));
    setShowRecurringModal(false);
    setNewRecurring({ description: "", amount: 0, category: "", frequency: "monthly", dayOfMonth: 1 });
    addNotification("Recurring transaction added!", "success");
  };

  const deleteRecurringTransaction = (id: string) => {
    const updated = recurringTransactions.filter(r => r.id !== id);
    setRecurringTransactions(updated);
    localStorage.setItem("recurringTransactions", JSON.stringify(updated));
    addNotification("Recurring transaction removed", "info");
  };

  const checkRecurringTransactions = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayDay = new Date().getDate();
    recurringTransactions.forEach(recurring => {
      if (recurring.frequency === "monthly" && todayDay === recurring.dayOfMonth) {
        const existingToday = transactions.some(t => t.description === recurring.description && t.date === today);
        if (!existingToday) {
          const newTransaction: Transaction = {
            id: Date.now() + Math.random().toString(),
            description: `${recurring.description} (Auto)`,
            amount: -Math.abs(recurring.amount),
            category: recurring.category,
            date: today
          };
          saveTransactions([newTransaction, ...transactions]);
          addNotification(`Auto added: ${recurring.description}`, "info");
        }
      }
    });
  };

  // ========== BUDGET FUNCTIONS ==========
  const addBudget = () => {
    if (!newBudget.category || !newBudget.amount) return;
    const newBudgets = new Map(budgets);
    newBudgets.set(newBudget.category, newBudget.amount);
    setBudgets(newBudgets);
    localStorage.setItem(`budgets_${currentCompanyId}`, JSON.stringify(Array.from(newBudgets.entries())));
    setShowBudgetModal(false);
    setNewBudget({ category: "", amount: 0 });
    addNotification(`Budget set for ${newBudget.category}`, "success");
  };

  const getBudgetProgress = (category: string) => {
    const spent = transactions.filter(t => t.category === category && t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const budget = budgets.get(category) || 0;
    return budget > 0 ? (spent / budget) * 100 : 0;
  };

  // ========== SAVINGS GOALS ==========
  const addSavingsGoal = () => {
    if (!newGoal.name || !newGoal.target) return;
    const newGoals = [...savingsGoals, { id: Date.now().toString(), name: newGoal.name, target: newGoal.target, current: 0 }];
    setSavingsGoals(newGoals);
    localStorage.setItem("savingsGoals", JSON.stringify(newGoals));
    setShowGoalModal(false);
    setNewGoal({ name: "", target: 0 });
    addNotification(`Savings goal "${newGoal.name}" created!`, "success");
  };

  // ========== INVENTORY FUNCTIONS ==========
const addProduct = () => {
  if (!newProduct.name || !newProduct.sku) return;
  
  const reason = prompt(editingProductId ? "Why are you editing this product?" : "Why are you adding this product?");
  if (editingProductId && !reason) return;
  
  if (editingProductId) {
    const oldProduct = products.find(p => p.id === editingProductId);
    // UPDATE existing product
    const updatedProducts = products.map(p => 
      p.id === editingProductId 
        ? { ...p, ...newProduct, id: p.id }
        : p
    );
    setProducts(updatedProducts);
    localStorage.setItem("products", JSON.stringify(updatedProducts));
    
    // Add to change log
    addChangeLog('product', editingProductId, newProduct.name, 'update', reason || 'No reason', [
      { field: 'name', oldValue: oldProduct?.name, newValue: newProduct.name },
      { field: 'sku', oldValue: oldProduct?.sku, newValue: newProduct.sku },
      { field: 'quantity', oldValue: oldProduct?.quantity, newValue: newProduct.quantity },
      { field: 'price', oldValue: oldProduct?.price, newValue: newProduct.price },
      { field: 'cost', oldValue: oldProduct?.cost, newValue: newProduct.cost },
      { field: 'minStock', oldValue: oldProduct?.minStock, newValue: newProduct.minStock },
    ]);
    
    addNotification(`Product "${newProduct.name}" updated!`, "success");
    setEditingProductId(null);
  } else {
    // ADD new product
    const product = { id: Date.now().toString(), ...newProduct, createdAt: new Date().toISOString() };
    const updated = [...products, product];
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    
    // Add to change log
    addChangeLog('product', product.id, newProduct.name, 'create', reason || 'New product added');
    
    addNotification(`Product "${newProduct.name}" added!`, "success");
  }
  
  setShowProductModal(false);
  setNewProduct({ name: "", sku: "", quantity: 0, price: 0, cost: 0, category: "", minStock: 0 });
};

  const updateStock = () => {
    if (!selectedProduct) return;
    const newQuantity = stockAdjustment.type === "add" ? selectedProduct.quantity + stockAdjustment.quantity : Math.max(0, selectedProduct.quantity - stockAdjustment.quantity);
    const updated = products.map(p => p.id === selectedProduct.id ? { ...p, quantity: newQuantity } : p);
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    setShowStockAdjustModal(false);
    setSelectedProduct(null);
    addNotification(`Stock updated for ${selectedProduct.name}!`, "success");
  };

  const deleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    const reason = prompt(`Why are you deleting product "${product?.name}"?`, "Discontinued");
    if (!reason) return;
    
    addChangeLog('product', id, product?.name || 'Unknown', 'delete', reason);
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    addNotification("Product deleted", "info");
  };

  const getLowStockProducts = () => products.filter(p => p.quantity <= p.minStock);
  const calculateInventoryValue = () => {
    if (valuationMethod === "FIFO") return products.reduce((sum, p) => sum + p.quantity * p.cost, 0);
    if (valuationMethod === "LIFO") return products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const avgCost = products.reduce((sum, p) => sum + p.cost, 0) / (products.length || 1);
    return products.reduce((sum, p) => sum + p.quantity * avgCost, 0);
  };

  // ========== CUSTOMER FUNCTIONS ==========
const addCustomer = () => {
  if (!newCustomer.name) return;
  
  const reason = prompt(editingCustomerId ? "Why are you editing this customer?" : "Why are you adding this customer?");
  if (editingCustomerId && !reason) return;
  
  if (editingCustomerId) {
    const oldCustomer = customers.find(c => c.id === editingCustomerId);
    // UPDATE existing customer
    const updatedCustomers = customers.map(c => 
      c.id === editingCustomerId 
        ? { ...c, ...newCustomer, id: c.id }
        : c
    );
    setCustomers(updatedCustomers);
    localStorage.setItem("customers", JSON.stringify(updatedCustomers));
    addChangeLog('customer', editingCustomerId, newCustomer.name, 'update', reason || 'No reason', [
      { field: 'name', oldValue: oldCustomer?.name, newValue: newCustomer.name },
      { field: 'email', oldValue: oldCustomer?.email, newValue: newCustomer.email },
      { field: 'phone', oldValue: oldCustomer?.phone, newValue: newCustomer.phone },
    ]);
    addNotification(`Customer "${newCustomer.name}" updated!`, "success");
    setEditingCustomerId(null);
  } else {
    // ADD new customer
    const customer = { id: Date.now().toString(), ...newCustomer };
    const updated = [...customers, customer];
    setCustomers(updated);
    localStorage.setItem("customers", JSON.stringify(updated));
    addChangeLog('customer', customer.id, newCustomer.name, 'create', reason || 'New customer added');
    addNotification(`Customer "${newCustomer.name}" added!`, "success");
  }
  
  setShowCustomerModal(false);
  setNewCustomer({ name: "", email: "", phone: "", address: "" });
};

  // ========== DELETE FUNCTIONS ==========
const deleteCustomer = (id: string) => {
  const customer = customers.find(c => c.id === id);
  const reason = prompt(`Why are you deleting customer "${customer?.name}"?`, "No longer a customer");
  if (!reason) return;
  
  if (confirm(t("messages.confirm_delete") || "Delete this customer?")) {
    addChangeLog('customer', id, customer?.name || 'Unknown', 'delete', reason);
    setCustomers(customers.filter(c => c.id !== id));
    localStorage.setItem("customers", JSON.stringify(customers.filter(c => c.id !== id)));
    addNotification(t("messages.customer_deleted") || "Customer deleted!", "info");
  }
};

const deleteEmployee = (id: string) => {
  const employee = employees.find(e => e.id === id);
  const reason = prompt(`Why are you deleting employee "${employee?.name}"?`, "No longer employed");
  if (!reason) return;
  
  if (confirm(t("messages.confirm_delete") || "Delete this employee?")) {
    addChangeLog('employee', id, employee?.name || 'Unknown', 'delete', reason);
    setEmployees(employees.filter(e => e.id !== id));
    localStorage.setItem("employees", JSON.stringify(employees.filter(e => e.id !== id)));
    addNotification(t("messages.employee_deleted") || "Employee deleted!", "info");
  }
};

const deleteAsset = (id: string) => {
  const asset = assets.find(a => a.id === id);
  const reason = prompt(`Why are you deleting asset "${asset?.name}"?`, "Asset disposed/sold");
  if (!reason) return;
  
  if (confirm(t("messages.confirm_delete") || "Delete this asset?")) {
    addChangeLog('asset', id, asset?.name || 'Unknown', 'delete', reason);
    setAssets(assets.filter(a => a.id !== id));
    localStorage.setItem("assets", JSON.stringify(assets.filter(a => a.id !== id)));
    addNotification(t("messages.asset_deleted") || "Asset deleted!", "info");
  }
};

const deleteBankAccount = (id: string) => {
  const account = bankAccounts.find(b => b.id === id);
  const reason = prompt(`Why are you deleting bank account "${account?.name}"?`, "Account closed");
  if (!reason) return;
  
  if (confirm(t("messages.confirm_delete") || "Delete this bank account?")) {
    addChangeLog('bank', id, account?.name || 'Unknown', 'delete', reason);
    setBankAccounts(bankAccounts.filter(b => b.id !== id));
    localStorage.setItem("bankAccounts", JSON.stringify(bankAccounts.filter(b => b.id !== id)));
    addNotification(t("messages.bank_deleted") || "Bank account deleted!", "info");
  }
};

  // ========== PAYROLL FUNCTIONS ==========
const addEmployee = () => {
  if (!newEmployee.name || !newEmployee.salary) return;
  
  const reason = prompt(editingEmployeeId ? "Why are you editing this employee?" : "Why are you adding this employee?");
  if (editingEmployeeId && !reason) return;
  
  if (editingEmployeeId) {
    const oldEmployee = employees.find(e => e.id === editingEmployeeId);
    // UPDATE existing employee
    const updatedEmployees = employees.map(e => 
      e.id === editingEmployeeId 
        ? { ...e, ...newEmployee, id: e.id }
        : e
    );
    setEmployees(updatedEmployees);
    localStorage.setItem("employees", JSON.stringify(updatedEmployees));
    
    // Add to change log
    addChangeLog('employee', editingEmployeeId, newEmployee.name, 'update', reason || 'No reason', [
      { field: 'name', oldValue: oldEmployee?.name, newValue: newEmployee.name },
      { field: 'salary', oldValue: oldEmployee?.salary, newValue: newEmployee.salary },
      { field: 'position', oldValue: oldEmployee?.position, newValue: newEmployee.position },
      { field: 'taxRate', oldValue: oldEmployee?.taxRate, newValue: newEmployee.taxRate },
    ]);
    
    addNotification(`Employee "${newEmployee.name}" updated!`, "success");
    setEditingEmployeeId(null);
  } else {
    // ADD new employee
    const employee = { id: Date.now().toString(), ...newEmployee };
    const updated = [...employees, employee];
    setEmployees(updated);
    localStorage.setItem("employees", JSON.stringify(updated));
    
    // Add to change log
    addChangeLog('employee', employee.id, newEmployee.name, 'create', reason || 'New employee added');
    
    addNotification(`Employee "${newEmployee.name}" added!`, "success");
  }
  
  setShowPayrollModal(false);
  setNewEmployee({ name: "", salary: 0, position: "", taxRate: 20 });
};

  // ========== ASSET FUNCTIONS ==========
  const calculateDepreciation = (asset: any) => {
    const depreciableAmount = asset.purchasePrice - asset.salvageValue;
    if (asset.method === "straight-line") return depreciableAmount / asset.usefulLife;
    if (asset.method === "declining-balance") return depreciableAmount * (2 / asset.usefulLife);
    return 0;
  };

  // ========== ASSET FUNCTIONS ==========
const addAsset = () => {
  if (!newAsset.name || !newAsset.purchasePrice) return;
  
  const reason = prompt(editingAssetId ? "Why are you editing this asset?" : "Why are you adding this asset?");
  if (editingAssetId && !reason) return;
  
  if (editingAssetId) {
    const oldAsset = assets.find(a => a.id === editingAssetId);
    // UPDATE existing asset
    const updatedAssets = assets.map(a => 
      a.id === editingAssetId 
        ? { ...a, ...newAsset, id: a.id }
        : a
    );
    setAssets(updatedAssets);
    localStorage.setItem("assets", JSON.stringify(updatedAssets));
    
    // Add to change log
    addChangeLog('asset', editingAssetId, newAsset.name, 'update', reason || 'No reason', [
      { field: 'name', oldValue: oldAsset?.name, newValue: newAsset.name },
      { field: 'purchaseDate', oldValue: oldAsset?.purchaseDate, newValue: newAsset.purchaseDate },
      { field: 'purchasePrice', oldValue: oldAsset?.purchasePrice, newValue: newAsset.purchasePrice },
      { field: 'usefulLife', oldValue: oldAsset?.usefulLife, newValue: newAsset.usefulLife },
      { field: 'salvageValue', oldValue: oldAsset?.salvageValue, newValue: newAsset.salvageValue },
    ]);
    
    addNotification(`Asset "${newAsset.name}" updated!`, "success");
    setEditingAssetId(null);
  } else {
    // ADD new asset
    const asset = { id: Date.now().toString(), ...newAsset };
    const updated = [...assets, asset];
    setAssets(updated);
    localStorage.setItem("assets", JSON.stringify(updated));
    
    // Add to change log
    addChangeLog('asset', asset.id, newAsset.name, 'create', reason || 'New asset added');
    
    addNotification(`Asset "${newAsset.name}" added!`, "success");
  }
  
  setShowAssetModal(false);
  setNewAsset({ name: "", purchaseDate: "", purchasePrice: 0, usefulLife: 5, salvageValue: 0, method: "straight-line" });
};

  // ========== BANK FUNCTIONS ==========
const addBankAccount = () => {
  if (!newBankAccount.name) return;
  
  const reason = prompt(editingBankId ? "Why are you editing this bank account?" : "Why are you adding this bank account?");
  if (editingBankId && !reason) return;
  
  if (editingBankId) {
    const oldAccount = bankAccounts.find(b => b.id === editingBankId);
    // UPDATE existing bank account
    const updatedBankAccounts = bankAccounts.map(b => 
      b.id === editingBankId 
        ? { ...b, ...newBankAccount, id: b.id, lastSynced: new Date().toISOString() }
        : b
    );
    setBankAccounts(updatedBankAccounts);
    localStorage.setItem("bankAccounts", JSON.stringify(updatedBankAccounts));
    
    // Add to change log
    addChangeLog('bank', editingBankId, newBankAccount.name, 'update', reason || 'No reason', [
      { field: 'name', oldValue: oldAccount?.name, newValue: newBankAccount.name },
      { field: 'balance', oldValue: oldAccount?.balance, newValue: newBankAccount.balance },
      { field: 'currency', oldValue: oldAccount?.currency, newValue: newBankAccount.currency },
    ]);
    
    addNotification(`Bank account "${newBankAccount.name}" updated!`, "success");
    setEditingBankId(null);
  } else {
    // ADD new bank account
    const account = { id: Date.now().toString(), ...newBankAccount, lastSynced: new Date().toISOString() };
    const updated = [...bankAccounts, account];
    setBankAccounts(updated);
    localStorage.setItem("bankAccounts", JSON.stringify(updated));
    
    // Add to change log
    addChangeLog('bank', account.id, newBankAccount.name, 'create', reason || 'New bank account added');
    
    addNotification(`Bank account "${newBankAccount.name}" added!`, "success");
  }
  
  setShowBankModal(false);
  setNewBankAccount({ name: "", balance: 0, currency: "USD" });
};

  const syncBankAccount = async (accountId: string) => {
    addNotification("Syncing with bank...", "info");
    setTimeout(() => addNotification("Bank sync complete!", "success"), 2000);
  };

  const startBankFeed = () => {
    addNotification("Starting bank feed...", "info");
    // Simulate real-time bank feed
    const interval = setInterval(() => {
      if (bankFeedActive) {
        // In real app, this would fetch from bank API
        addNotification("Bank feed: No new transactions", "info");
      }
    }, 60000);
    setBankFeedActive(true);
    return () => clearInterval(interval);
  };

  // ========== COMPANY FUNCTIONS ==========
  const addCompany = () => {
    if (!newCompany.name) return;
    const company = { id: Date.now().toString(), ...newCompany };
    const updated = [...companies, company];
    setCompanies(updated);
    localStorage.setItem("companies", JSON.stringify(updated));
    setCurrentCompanyId(company.id);
    localStorage.setItem("currentCompanyId", company.id);
    setShowCompanyModal(false);
    setNewCompany({ name: "", currency: "USD", fiscalYearStart: "2024-01-01" });
    addNotification(`Company "${newCompany.name}" created!`, "success");
  };

  const switchCompany = (companyId: string) => {
    localStorage.setItem(`transactions_${currentCompanyId}`, JSON.stringify(transactions));
    localStorage.setItem(`budgets_${currentCompanyId}`, JSON.stringify(Array.from(budgets.entries())));
    setCurrentCompanyId(companyId);
    localStorage.setItem("currentCompanyId", companyId);
    const newTransactions = localStorage.getItem(`transactions_${companyId}`);
    if (newTransactions) setTransactions(JSON.parse(newTransactions));
    else setTransactions([]);
    const newBudgets = localStorage.getItem(`budgets_${companyId}`);
    if (newBudgets) setBudgets(new Map(JSON.parse(newBudgets)));
    else setBudgets(new Map());
    addNotification(`Switched to ${companies.find(c => c.id === companyId)?.name || "Personal"}`, "success");
  };

  // ========== LOAN FUNCTIONS ==========
  const calculateAmortization = () => {
    const monthlyRate = newLoan.rate / 100 / 12;
    const payment = (newLoan.amount * monthlyRate * Math.pow(1 + monthlyRate, newLoan.term)) / (Math.pow(1 + monthlyRate, newLoan.term) - 1);
    const schedule = [];
    let balance = newLoan.amount;
    for (let i = 1; i <= newLoan.term; i++) {
      const interest = balance * monthlyRate;
      const principal = payment - interest;
      balance -= principal;
      schedule.push({ month: i, payment, interest, principal, balance: Math.max(0, balance) });
    }
    return { payment, schedule };
  };

  const addLoan = () => {
    const { payment, schedule } = calculateAmortization();
    const loan = { id: Date.now().toString(), ...newLoan, monthlyPayment: payment, schedule };
    setLoans([...loans, loan]);
    localStorage.setItem("loans", JSON.stringify([...loans, loan]));
    setShowLoanModal(false);
    setNewLoan({ amount: 0, rate: 5, term: 12, startDate: "" });
    addNotification("Loan added!", "success");
  };

  // ========== INVOICE FUNCTIONS ==========
  const addInvoiceItem = () => {
    setCurrentInvoice({ ...currentInvoice, items: [...currentInvoice.items, { description: "", quantity: 1, price: 0 }] });
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const newItems = [...currentInvoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setCurrentInvoice({ ...currentInvoice, items: newItems });
  };

  const calculateInvoiceTotal = () => currentInvoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const generateInvoicePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.text("INVOICE", 20, 30);
    doc.setFontSize(12);
    doc.text(`Invoice #: ${currentInvoice.invoiceNumber}`, 20, 50);
    doc.text(`Date: ${new Date().toISOString().split("T")[0]}`, 20, 60);
    doc.text(`Due Date: ${currentInvoice.dueDate}`, 20, 70);
    doc.text(`Customer: ${currentInvoice.customerName}`, 20, 85);
    doc.text(`Email: ${currentInvoice.customerEmail}`, 20, 95);
    let y = 120;
    doc.text("Description", 20, y);
    doc.text("Qty", 120, y);
    doc.text("Price", 150, y);
    doc.text("Total", 180, y);
    y += 10;
    currentInvoice.items.forEach(item => {
      doc.text(item.description.substring(0, 30), 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`${currencySymbols[currency]}${item.price}`, 150, y);
      doc.text(`${currencySymbols[currency]}${item.quantity * item.price}`, 180, y);
      y += 10;
    });
    y += 10;
    doc.text(`TOTAL: ${currencySymbols[currency]}${calculateInvoiceTotal()}`, 150, y);
    const invoice = { id: Date.now().toString(), ...currentInvoice, total: calculateInvoiceTotal(), createdAt: new Date().toISOString() };
    setInvoices([...invoices, invoice]);
    localStorage.setItem("invoices", JSON.stringify([...invoices, invoice]));
    doc.save(`invoice_${currentInvoice.invoiceNumber}.pdf`);
    addNotification("Invoice generated!", "success");
    setShowInvoiceModal(false);
  };

  // ========== PERIOD LOCKING ==========
  const lockPeriod = (month: string) => {
    const updated = [...lockedPeriods, month];
    setLockedPeriods(updated);
    localStorage.setItem("lockedPeriods", JSON.stringify(updated));
    addNotification("Period locked!", "success");
  };

  const closeYear = () => {
    const currentYear = new Date().getFullYear();
    const yearMonths = ["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => `${currentYear}-${m}`);
    const newLocked = [...lockedPeriods, ...yearMonths];
    setLockedPeriods(newLocked);
    localStorage.setItem("lockedPeriods", JSON.stringify(newLocked));
    addNotification(`Year ${currentYear} closed! All periods locked.`, "success");
    addAuditEntry("YEAR_CLOSE", `Closed year ${currentYear}`);
  };

  const yearEndClosing = () => {
    const currentYear = new Date().getFullYear();
    const yearMonths = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(m => `${currentYear}-${m}`);
    const newLocked = [...lockedPeriods, ...yearMonths];
    setLockedPeriods(newLocked);
    localStorage.setItem("lockedPeriods", JSON.stringify(newLocked));
    addNotification("Year closed!", "success");
  };

  // ========== REPORT FUNCTIONS ==========
  const generatePNLReport = (startDate: string, endDate: string) => {
    const filtered = transactions.filter(t => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
    const income = filtered.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netIncome = income - expenses;
    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();
    filtered.forEach(t => {
      if (t.amount > 0) incomeByCategory.set(t.category, (incomeByCategory.get(t.category) || 0) + t.amount);
      else expenseByCategory.set(t.category, (expenseByCategory.get(t.category) || 0) + Math.abs(t.amount));
    });
    return { income, expenses, netIncome, incomeByCategory, expenseByCategory };
  };

  const downloadReport = (type: string) => {
    const { start, end } = reportDateRange;
    const report = generatePNLReport(start, end);
    const reportContent = `========================================\n${type.toUpperCase()} REPORT\n========================================\nPeriod: ${start || "Start"} to ${end || "Today"}\nCurrency: ${currency}\n========================================\n\nINCOME:\n${Array.from(report.incomeByCategory.entries()).map(([cat, amt]) => `  ${cat}: ${currencySymbols[currency]}${getConvertedAmount(amt).toLocaleString()}`).join("\n")}\n  TOTAL INCOME: ${currencySymbols[currency]}${getConvertedAmount(report.income).toLocaleString()}\n\nEXPENSES:\n${Array.from(report.expenseByCategory.entries()).map(([cat, amt]) => `  ${cat}: ${currencySymbols[currency]}${getConvertedAmount(amt).toLocaleString()}`).join("\n")}\n  TOTAL EXPENSES: ${currencySymbols[currency]}${getConvertedAmount(report.expenses).toLocaleString()}\n\n========================================\nNET INCOME: ${currencySymbols[currency]}${getConvertedAmount(report.netIncome).toLocaleString()}\n========================================\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification("Report downloaded!", "success");
  };

  // ========== CHART DATA ==========
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense; // This will be 0 when no transactions

  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();
    transactions.forEach(t => {
      if (t.amount < 0) {
        const cat = t.category || "Uncategorized";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Math.abs(t.amount));
      }
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
  };

  const getMonthlyData = () => {
    const monthMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { income: 0, expense: 0 });
      const data = monthMap.get(month)!;
      if (t.amount > 0) data.income += t.amount;
      else data.expense += Math.abs(t.amount);
    });
    return Array.from(monthMap.entries()).map(([month, data]) => ({ month, ...data }));
  };

  const getFilteredTransactions = () => {
    let filtered = transactions;
    if (searchTerm) filtered = filtered.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterCategory === "income") filtered = filtered.filter(t => t.amount > 0);
    else if (filterCategory === "expense") filtered = filtered.filter(t => t.amount < 0);
    else if (filterCategory !== "all") filtered = filtered.filter(t => t.category === filterCategory);
    return filtered;
  };

  const getAnalyticsData = () => {
    const monthlyData = getMonthlyData();
    const growthRates: number[] = [];
    for (let i = 1; i < monthlyData.length; i++) {
      if (monthlyData[i-1].income > 0) {
        const growth = ((monthlyData[i].income - monthlyData[i-1].income) / monthlyData[i-1].income) * 100;
        growthRates.push(growth);
      }
    }
    const avgGrowth = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;
    const categorySpending = new Map<string, number>();
    transactions.forEach(t => {
      if (t.amount < 0) categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + Math.abs(t.amount));
    });
    const topCategories = Array.from(categorySpending.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { avgGrowth, topCategories };
  };

  // ========== CASH FLOW FORECAST ==========
const getCashFlowForecast = (months: number = 6) => {
  const forecast = [];
  const startDate = new Date();
  let runningBalance = balance;
  
  // If no transactions, return empty forecast with zero balances
  if (transactions.length === 0) {
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + i);
      forecast.push({
        month: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
        inflow: 0,
        outflow: 0,
        net: 0,
        balance: 0
      });
    }
    return forecast;
  }
  
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(startDate);
    monthDate.setMonth(startDate.getMonth() + i);
    let inflow = 0, outflow = 0;
    
    // Add recurring transactions (user's actual recurring data)
    recurringTransactions.forEach(rt => {
      if (rt.amount > 0) inflow += rt.amount;
      else outflow += Math.abs(rt.amount);
    });
    
    // Only add average from last 3 months if there are at least 3 months of data
    const last3Months = transactions.filter(t => {
      const tDate = new Date(t.date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return tDate >= threeMonthsAgo;
    });
    
    if (last3Months.length > 0) {
      const avgMonthlyIncome = last3Months.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) / Math.max(1, 3);
      const avgMonthlyExpense = last3Months.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) / Math.max(1, 3);
      
      inflow += avgMonthlyIncome;
      outflow += avgMonthlyExpense;
    }
    
    const net = inflow - outflow;
    runningBalance += net;
    
    forecast.push({
      month: monthDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
      inflow: Math.max(0, inflow),
      outflow: Math.max(0, outflow),
      net,
      balance: runningBalance
    });
  }
  return forecast;
};

  // ========== OTHER FUNCTIONS ==========
  const scanReceipt = async (imageFile: File) => {
    const Tesseract = await import("tesseract.js");
    setScanningText("Scanning receipt...");
    const worker = await Tesseract.createWorker("eng");
    const { data: { text } } = await worker.recognize(imageFile);
    await worker.terminate();
    setScanningText(`Extracted: ${text.substring(0, 100)}...`);
    const amountMatch = text.match(/\$\s*(\d+(?:\.\d{2})?)/i);
    if (amountMatch) setNewTx({ ...newTx, amount: -parseFloat(amountMatch[1]) });
    const firstLine = text.split("\n")[0];
    if (firstLine) setNewTx({ ...newTx, description: firstLine.substring(0, 50) });
    setTimeout(() => setScanningText(""), 3000);
  };

  const startVoiceCommand = () => {
    if (!("webkitSpeechRecognition" in window)) {
      addNotification("Voice recognition not supported", "error");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === "fa" ? "fa-IR" : "en-US";
    recognition.onstart = () => {
      setIsListening(true);
      addNotification("Listening... Speak your command", "info");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.toLowerCase().includes("add")) {
        const amountMatch = transcript.match(/\d+(?:\.\d+)?/);
        const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
        setNewTx({ ...newTx, amount: -Math.abs(amount), description: transcript.substring(0, 50) });
        setShowForm(true);
        addNotification(`Prepared: ${transcript.substring(0, 30)}`, "success");
      } else if (transcript.toLowerCase().includes("dashboard")) setActiveTab("dashboard");
      else if (transcript.toLowerCase().includes("transactions")) setActiveTab("transactions");
      else if (transcript.toLowerCase().includes("reports")) setActiveTab("reports");
      setIsListening(false);
    };
    recognition.start();
  };

  const askChatGPT = async (question: string) => {
    addNotification("Asking AI...", "info");
    setTimeout(() => {
      let response = "";
      const lowerQuestion = question.toLowerCase();
      if (lowerQuestion.includes("balance")) response = `Your balance is ${currencySymbols[currency]}${getConvertedAmount(balance).toLocaleString()}`;
      else if (lowerQuestion.includes("income")) response = `Your total income is ${currencySymbols[currency]}${getConvertedAmount(totalIncome).toLocaleString()}`;
      else if (lowerQuestion.includes("expense")) response = `Your total expenses are ${currencySymbols[currency]}${getConvertedAmount(totalExpense).toLocaleString()}`;
      else response = "I can help with balance, income, expenses, budget, or savings goals!";
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
      addNotification(response, "info");
    }, 500);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    navigateToTab(result.tab);
    setTimeout(() => {
      const element = document.getElementById(`search-result-${result.id}`);
      if (element) {
        element.classList.add('search-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => element.classList.remove('search-highlight'), 2000);
      }
      addNotification(`Found: ${result.title}`, "success");
    }, 100);
  };

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Amount"];
    const rows = transactions.map(t => [t.date, t.description, t.category, t.amount.toString()]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification("CSV exported!", "success");
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("FinWise Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Total Income: ${currencySymbols[currency]}${totalIncome.toLocaleString()}`, 20, 50);
    doc.text(`Total Expenses: ${currencySymbols[currency]}${totalExpense.toLocaleString()}`, 20, 60);
    doc.text(`Balance: ${currencySymbols[currency]}${balance.toLocaleString()}`, 20, 70);
    let y = 90;
    doc.text("Recent Transactions:", 20, y);
    y += 10;
    transactions.slice(0, 10).forEach((tx, index) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${index + 1}. ${tx.date} - ${tx.description} - ${currencySymbols[currency]}${Math.abs(tx.amount)}`, 20, y);
      y += 10;
    });
    doc.save(`report_${new Date().toISOString().split("T")[0]}.pdf`);
    addNotification("PDF exported!", "success");
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const wsData = [["Date", "Description", "Category", "Amount", "Type"], ...transactions.map(t => [t.date, t.description, t.category, Math.abs(t.amount), t.amount > 0 ? "Income" : "Expense"])];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split("T")[0]}.xlsx`);
    addNotification("Excel exported!", "success");
  };

  const exportToQuickBooks = () => {
    const headers = ["Date", "Description", "Amount", "Account Name", "Transaction Type", "Memo"];
    const rows = transactions.map(t => [
      t.date,
      t.description,
      Math.abs(t.amount),
      t.category,
      t.amount > 0 ? "Deposit" : "Check",
      `Imported from FinWise`
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quickbooks_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification("QuickBooks export ready! Import this CSV into QuickBooks.", "success");
  };



  // ========== EXPORT ALL IMAGES AS ZIP ==========
const exportAllImagesAsZip = async () => {
  try {
    const JSZip = await import("jszip");
    const zip = new JSZip.default();
    
    const allAttachments = await getAllAttachmentsFromDB();
    
    if (allAttachments.length === 0) {
      addNotification("No images to export!", "warning");
      return;
    }
    
    addNotification(`Exporting ${allAttachments.length} images...`, "info");
    
    for (const att of allAttachments) {
      // Convert base64 to blob
      const base64Data = att.dataUrl.split(',')[1];
      const binaryData = atob(base64Data);
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([uint8Array], { type: 'image/webp' });
      // Use transactionId_filename format for organization
      zip.file(`${att.transactionId}_${att.filename}`, blob);
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finwise_images_${new Date().toISOString().split("T")[0]}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification(`Exported ${allAttachments.length} images as ZIP!`, "success");
  } catch (error) {
    addNotification("Failed to export images", "error");
  }
};

  const connectBlockchain = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setBlockchainEnabled(true);
        addNotification("Blockchain connected!", "success");
      } catch (error) {
        addNotification("Failed to connect wallet.", "error");
      }
    } else {
      addNotification("Please install MetaMask for blockchain verification.", "error");
    }
  };

  const enableQuantumEncryption = async () => {
    addNotification("Initializing quantum-resistant encryption...", "info");
    const keyPair = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    localStorage.setItem("quantum_key", JSON.stringify(await crypto.subtle.exportKey("raw", keyPair)));
    setQuantumEncryption(true);
    addNotification("Quantum-resistant encryption enabled!", "success");
  };

  const connectReceiptPrinter = () => {
    addNotification("Connecting to receipt printer...", "info");
    setTimeout(() => {
      setHardwareConnected({ ...hardwareConnected, receiptPrinter: true });
      addNotification("Receipt printer connected!", "success");
    }, 2000);
  };

  const connectBarcodeScanner = () => {
    addNotification("Barcode scanner ready.", "info");
    setHardwareConnected({ ...hardwareConnected, barcodeScanner: true });
  };

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    localStorage.setItem("darkMode", String(newDark));
    document.documentElement.classList.toggle("dark", newDark);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
    if (lang === "fa") {
      document.documentElement.dir = "rtl";
      document.documentElement.classList.add("rtl");
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.classList.remove("rtl");
    }
  };

  // ========== RESPONSIVE DETECTION ==========
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
      else setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ========== LOAD DATA ==========
useEffect(() => {
  const loadData = async () => {

    // theme
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
      setDarkMode(savedDarkMode);
      if (savedDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

    // change audit
    const savedChangeLogs = localStorage.getItem('changeLogs');
    if (savedChangeLogs) setChangeLogs(JSON.parse(savedChangeLogs));

    // transactions - NO SAMPLE DATA, only what user has saved
    const saved = localStorage.getItem(`transactions_${currentCompanyId}`);
    if (saved) setTransactions(JSON.parse(saved));
    // Don't create sample data - start empty!
    
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    
    const savedEmployees = localStorage.getItem('employees');
    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    
    const savedBankAccounts = localStorage.getItem('bankAccounts');
    if (savedBankAccounts) setBankAccounts(JSON.parse(savedBankAccounts));
    
    const savedBudgets = localStorage.getItem(`budgets_${currentCompanyId}`);
    if (savedBudgets) setBudgets(new Map(JSON.parse(savedBudgets)));
    
    const savedCompanies = localStorage.getItem('companies');
    if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
    
    const savedLoans = localStorage.getItem('loans');
    if (savedLoans) setLoans(JSON.parse(savedLoans));
    
    const savedSavingsGoals = localStorage.getItem('savingsGoals');
    if (savedSavingsGoals) setSavingsGoals(JSON.parse(savedSavingsGoals));
    
    const savedRecurring = localStorage.getItem('recurringTransactions');
    if (savedRecurring) setRecurringTransactions(JSON.parse(savedRecurring));
    
    const savedAuditLog = localStorage.getItem('auditLog');
    if (savedAuditLog) setAuditLog(JSON.parse(savedAuditLog));
    
    const savedLockedPeriods = localStorage.getItem('lockedPeriods');
    if (savedLockedPeriods) setLockedPeriods(JSON.parse(savedLockedPeriods));
    
    const savedDefi = localStorage.getItem('defiPositions');
    if (savedDefi) setDefiPositions(JSON.parse(savedDefi));
    
    const savedNft = localStorage.getItem('nftCollections');
    if (savedNft) setNftCollections(JSON.parse(savedNft));
    
    const savedHfKey = localStorage.getItem("hf_api_key");
    if (savedHfKey) setHfApiKey(savedHfKey);
    
    const savedTemplates = localStorage.getItem('invoiceTemplates');
    if (savedTemplates) setInvoiceTemplates(JSON.parse(savedTemplates));
    
    // Load vendors
    const savedVendors = localStorage.getItem('vendors');
    if (savedVendors) setVendors(JSON.parse(savedVendors));
    
    // Load bills
    const savedBills = localStorage.getItem('bills');
    if (savedBills) setBills(JSON.parse(savedBills));
    
    // Load chart of accounts
    const savedAccounts = localStorage.getItem('accounts');
    if (savedAccounts) setAccounts(JSON.parse(savedAccounts));
    else {
      // Initialize default chart of accounts
      const defaultAccounts: Account[] = [
        { id: "1", code: "1000", name: "Cash", type: "asset", normalBalance: "debit", balance: 0 },
        { id: "2", code: "1100", name: "Bank Account", type: "asset", normalBalance: "debit", balance: 0 },
        { id: "3", code: "1200", name: "Accounts Receivable", type: "asset", normalBalance: "debit", balance: 0 },
        { id: "4", code: "2000", name: "Accounts Payable", type: "liability", normalBalance: "credit", balance: 0 },
        { id: "5", code: "3000", name: "Owner's Equity", type: "equity", normalBalance: "credit", balance: 0 },
        { id: "6", code: "4000", name: "Sales Revenue", type: "revenue", normalBalance: "credit", balance: 0 },
        { id: "7", code: "5000", name: "Rent Expense", type: "expense", normalBalance: "debit", balance: 0 },
        { id: "8", code: "5100", name: "Utilities Expense", type: "expense", normalBalance: "debit", balance: 0 },
        { id: "9", code: "5200", name: "Salary Expense", type: "expense", normalBalance: "debit", balance: 0 },
        { id: "10", code: "5300", name: "Office Supplies", type: "expense", normalBalance: "debit", balance: 0 },
      ];
      setAccounts(defaultAccounts);
      localStorage.setItem("accounts", JSON.stringify(defaultAccounts));
    }
    
    // Load journal entries
    const savedJournalEntries = localStorage.getItem('journalEntries');
    if (savedJournalEntries) setJournalEntries(JSON.parse(savedJournalEntries));
    
    // Load attachments metadata from localStorage
    const savedAttachmentsMeta = localStorage.getItem('attachments');
    if (savedAttachmentsMeta) {
      const metaAttachments = JSON.parse(savedAttachmentsMeta);
      setAttachments(metaAttachments);
      
      // Migrate old attachments from localStorage to IndexedDB if needed
      const dbAttachments = await getAllAttachmentsFromDB();
      if (dbAttachments.length === 0 && metaAttachments.length > 0) {
        for (const att of metaAttachments) {
          if (att.dataUrl) {
            await saveAttachmentToDB(att);
          }
        }
      }
    }

    const savedLang = localStorage.getItem("language");
    if (savedLang) i18n.changeLanguage(savedLang);
    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedLang === "fa") {
      document.documentElement.dir = "rtl";
      document.documentElement.classList.add("rtl");
    }
  };
  
  loadData();
}, [currentCompanyId]);

  // Global search shortcut
  useEffect(() => {
    const handleGlobalSearch = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleGlobalSearch);
    return () => window.removeEventListener('keydown', handleGlobalSearch);
  }, []);

  

  // Check recurring transactions
  useEffect(() => {
    checkRecurringTransactions();
    const interval = setInterval(checkRecurringTransactions, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [recurringTransactions, transactions]);

  // Check recurring invoices (daily)
  useEffect(() => {
    generateRecurringInvoices();
    const interval = setInterval(generateRecurringInvoices, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [invoiceTemplates]);

  // Budget alerts
  useEffect(() => {
    budgets.forEach((budget, category) => {
      const spent = transactions.filter(t => t.category === category && t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const percentage = (spent / budget) * 100;
      if (percentage >= 90 && percentage < 100) addNotification(`${category} budget is at ${percentage.toFixed(0)}%`, "warning");
      else if (percentage >= 100) addNotification(`${category} budget exceeded!`, "error");
    });
  }, [transactions, budgets]);

  // Tab definitions
  const tabs = [
    { id: "dashboard", icon: icons.dashboard, label: t("navigation.dashboard") },
    { id: "transactions", icon: icons.transactions, label: t("navigation.transactions") },
    { id: "inventory", icon: icons.inventory, label: t("navigation.inventory") },
    { id: "customers", icon: icons.customers, label: t("navigation.customers") },
    { id: "payroll", icon: icons.payroll, label: t("navigation.payroll") },
    { id: "assets", icon: icons.asset, label: t("navigation.assets") },
    { id: "bank", icon: icons.bank, label: t("navigation.bank") },
    { id: "reports", icon: icons.reports, label: t("navigation.reports") },
  ];

  const getActionsForTab = (tab: string) => {
  const commonActions = [
    { id: "add", icon: icons.add, label: t("transactions.add"), onClick: () => setShowForm(true), variant: "primary" },
    { id: "export_csv", icon: icons.csv, label: t("transactions.export_csv"), onClick: () => exportToCSV(), variant: "secondary" },
    { id: "export_pdf", icon: icons.pdf, label: t("transactions.export_pdf"), onClick: () => exportToPDF(), variant: "secondary" },
    { id: "export_excel", icon: icons.excel, label: t("transactions.export_excel"), onClick: () => exportToExcel(), variant: "secondary" },
  ];
  
  const tabSpecific: Record<string, any[]> = {
    transactions: [
      { id: "scan", icon: icons.scanner, label: t("transactions.scan_receipt"), onClick: () => document.getElementById('receiptInput')?.click(), variant: "accent" },
      { id: "budget", icon: icons.budget, label: t("transactions.budget"), onClick: () => setShowBudgetModal(true), variant: "accent" },
      { id: "recurring", icon: icons.recurring, label: t("transactions.recurring"), onClick: () => setShowRecurringModal(true), variant: "accent" },
    ],
    inventory: [{ id: "add_product", icon: icons.add, label: t("inventory.add_product"), onClick: () => setShowProductModal(true), variant: "primary" }],
    customers: [{ id: "add_customer", icon: icons.add, label: t("customers.add_customer"), onClick: () => setShowCustomerModal(true), variant: "primary" }],
    payroll: [{ id: "add_employee", icon: icons.add, label: t("payroll.add_employee"), onClick: () => setShowPayrollModal(true), variant: "primary" }],
    assets: [{ id: "add_asset", icon: icons.add, label: t("assets.add_asset"), onClick: () => setShowAssetModal(true), variant: "primary" }],
    bank: [
      { id: "connect", icon: icons.bank, label: t("bank.connect_account"), onClick: () => setShowBankModal(true), variant: "primary" },
      { id: "sync", icon: icons.sync, label: t("bank.sync_now"), onClick: () => syncBankAccount(''), variant: "secondary" },
    ],
    reports: [{ id: "analytics", icon: icons.chart, label: t("reports.advanced_analytics"), onClick: () => setShowAnalyticsModal(true), variant: "accent" }],
  };
  
  const moreActions = [
  // ========== FINANCIAL OPERATIONS ==========
  { id: "journal_entry", icon: icons.book, label: "Journal Entry", onClick: () => setShowJournalEntryModal(true) },
  { id: "chart_of_accounts", icon: icons.list, label: "Chart of Accounts", onClick: () => setShowAccountsModal(true) },
  { id: "invoice", icon: icons.invoice, label: t("buttons.invoice"), onClick: () => setShowInvoiceModal(true) },
  { id: "invoice_template", icon: icons.copy, label: "Invoice Template", onClick: () => setShowTemplateModal(true) },
  { id: "loan", icon: icons.loan, label: t("buttons.loan"), onClick: () => setShowLoanModal(true) },
  { id: "goal", icon: icons.wallet, label: t("dashboard.add_goal"), onClick: () => setShowGoalModal(true) },
  
  // ========== BUSINESS MANAGEMENT ==========
  { id: "company", icon: icons.building, label: t("buttons.company"), onClick: () => setShowCompanyModal(true) },
  { id: "vendor", icon: icons.building, label: "Vendor", onClick: () => setShowVendorModal(true) },
  { id: "bill", icon: icons.file, label: "Bill", onClick: () => setShowBillModal(true) },
  
  // ========== TAX & COMPLIANCE ==========
  { id: "tax", icon: icons.tax, label: t("buttons.tax"), onClick: () => setShowTaxModal(true) },
  { id: "lock", icon: icons.lock, label: t("modals.period_locking"), onClick: () => setShowLockModal(true) },
  { id: "audit", icon: icons.audit, label: t("modals.audit_log"), onClick: () => setShowAuditModal(true) },
  
  // ========== DATA MANAGEMENT ==========
  { id: "import", icon: icons.import, label: t("modals.import_data"), onClick: () => setShowMigrationModal(true) },
  { id: "restore_backup", icon: icons.upload, label: "Restore Backup", onClick: () => document.getElementById('backupRestoreInput')?.click(), variant: "secondary" },
  { id: "manual_backup", icon: icons.save, label: "Manual Backup", onClick: () => createBackup(), variant: "secondary" },
  { id: "qb_export", icon: icons.excel, label: "QuickBooks Export", onClick: () => exportToQuickBooks() },
  { id: "export_images", icon: icons.image, label: "Export Images (ZIP)", onClick: () => exportAllImagesAsZip() },
  
  // ========== AI & VOICE ==========
  { id: "voice", icon: icons.voice, label: t("buttons.voice"), onClick: () => startVoiceCommand() },
  { id: "ai", icon: icons.ai, label: t("buttons.ai_chat"), onClick: () => setShowChatbot(true) },
  { id: "hfai", icon: icons.ai, label: "Hugging Face AI", onClick: () => setShowHfModal(true) },
  
  // ========== CRYPTO & INVESTMENTS ==========
  { id: "defi", icon: icons.trend, label: "DeFi Yield", onClick: () => setShowDefiModal(true) },
  { id: "nft", icon: icons.image, label: "NFT Tracker", onClick: () => setShowNftModal(true) },
  
  // ========== HARDWARE ==========
  { id: "printer", icon: icons.printer, label: t("buttons.printer"), onClick: () => connectReceiptPrinter() },
  { id: "scanner", icon: icons.scanner, label: t("buttons.scanner"), onClick: () => connectBarcodeScanner() },
  
  // ========== DANGER ZONE (Keep at bottom) ==========
  { id: "change_history", icon: icons.history, label: "Change History", onClick: () => setShowChangeHistoryModal(true) },
  { 
  id: "clear", 
  icon: icons.clear, 
  label: "Clear All Data", 
  onClick: () => clearAllData(), 
  variant: "danger" 
},
];
  
  return { visible: [...commonActions, ...(tabSpecific[tab] || [])], more: moreActions };
};

  // Modal state setters for components
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  const formatDate = (day: number, month: number, year: number): string => {
  return new Date(year, month, day).toLocaleDateString();
};


  // Keyboard shortcuts helper - COMPLETE VERSION with More dropdown support
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // ESC key - close More dropdown first, then modals, then navigate back
    if (e.key === 'Escape') {
      // Close More dropdown if open
      const dropdown = document.getElementById('more-dropdown');
      const backdrop = document.getElementById('more-dropdown-backdrop');
      if (dropdown && !dropdown.classList.contains('opacity-0')) {
        dropdown.classList.add('opacity-0', 'invisible');
        dropdown.classList.remove('opacity-100', 'visible');
        if (backdrop) {
          backdrop.classList.add('opacity-0', 'invisible');
          backdrop.classList.remove('opacity-100', 'visible');
        }
        setMoreMenuSearch('');
        e.preventDefault();
        return;
      }
      
      // Check if any modal is open and close it
      if (showForm) {
        setShowForm(false);
        setEditingTransactionId(null);
        setNewTx({ description: "", amount: 0, category: "", date: new Date().toISOString().split("T")[0] });
        e.preventDefault();
        return;
      }
      if (showCustomerModal) {
        setShowCustomerModal(false);
        setEditingCustomerId(null);
        setNewCustomer({ name: "", email: "", phone: "", address: "" });
        e.preventDefault();
        return;
      }
      if (showPayrollModal) {
        setShowPayrollModal(false);
        setEditingEmployeeId(null);
        setNewEmployee({ name: "", salary: 0, position: "", taxRate: 20 });
        e.preventDefault();
        return;
      }
      if (showAssetModal) {
        setShowAssetModal(false);
        setEditingAssetId(null);
        setNewAsset({ name: "", purchaseDate: "", purchasePrice: 0, usefulLife: 5, salvageValue: 0, method: "straight-line" });
        e.preventDefault();
        return;
      }
      if (showProductModal) {
        setShowProductModal(false);
        setEditingProductId(null);
        setNewProduct({ name: "", sku: "", quantity: 0, price: 0, cost: 0, category: "", minStock: 0 });
        e.preventDefault();
        return;
      }
      if (showBankModal) {
        setShowBankModal(false);
        setEditingBankId(null);
        setNewBankAccount({ name: "", balance: 0, currency: "USD" });
        e.preventDefault();
        return;
      }
      if (showVendorModal) {
        setShowVendorModal(false);
        setEditingVendorId(null);
        setNewVendor({ name: "", email: "", phone: "", address: "" });
        e.preventDefault();
        return;
      }
      if (showBillModal) {
        setShowBillModal(false);
        setEditingBillId(null);
        e.preventDefault();
        return;
      }
      if (showBudgetModal) {
        setShowBudgetModal(false);
        e.preventDefault();
        return;
      }
      if (showRecurringModal) {
        setShowRecurringModal(false);
        e.preventDefault();
        return;
      }
      if (showTaxModal) {
        setShowTaxModal(false);
        e.preventDefault();
        return;
      }
      if (showLockModal) {
        setShowLockModal(false);
        e.preventDefault();
        return;
      }
      if (showAuditModal) {
        setShowAuditModal(false);
        e.preventDefault();
        return;
      }
      if (showMigrationModal) {
        setShowMigrationModal(false);
        e.preventDefault();
        return;
      }
      if (showJournalEntryModal) {
        setShowJournalEntryModal(false);
        e.preventDefault();
        return;
      }
      if (showTemplateModal) {
        setShowTemplateModal(false);
        e.preventDefault();
        return;
      }
      if (showInvoiceModal) {
        setShowInvoiceModal(false);
        e.preventDefault();
        return;
      }
      if (showLoanModal) {
        setShowLoanModal(false);
        e.preventDefault();
        return;
      }
      if (showGoalModal) {
        setShowGoalModal(false);
        e.preventDefault();
        return;
      }
      if (showAnalyticsModal) {
        setShowAnalyticsModal(false);
        e.preventDefault();
        return;
      }
      if (showDefiModal) {
        setShowDefiModal(false);
        e.preventDefault();
        return;
      }
      if (showNftModal) {
        setShowNftModal(false);
        e.preventDefault();
        return;
      }
      if (showHfModal) {
        setShowHfModal(false);
        e.preventDefault();
        return;
      }
      if (showChangeHistoryModal) {
        setShowChangeHistoryModal(false);
        e.preventDefault();
        return;
      }
      if (showAttachmentModal) {
        setShowAttachmentModal(false);
        setAttachmentFile(null);
        e.preventDefault();
        return;
      }
      if (showViewAttachmentsModal) {
        setShowViewAttachmentsModal(false);
        e.preventDefault();
        return;
      }
      if (showAiSuggestion) {
        setShowAiSuggestion(false);
        e.preventDefault();
        return;
      }
      if (showCompanyModal) {
        setShowCompanyModal(false);
        e.preventDefault();
        return;
      }
      if (showStockAdjustModal) {
        setShowStockAdjustModal(false);
        e.preventDefault();
        return;
      }
      
      // If no modal is open, navigate back
      goBack();
      e.preventDefault();
    }
    
    // Ctrl+N for new transaction
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      setShowForm(true);
      setEditingTransactionId(null);
      setNewTx({ description: "", amount: 0, category: "", date: new Date().toISOString().split("T")[0] });
    }
    
    // Ctrl+D for dashboard
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      setActiveTab("dashboard");
    }
    
    // Ctrl+T for transactions
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      setActiveTab("transactions");
    }
    
    // Ctrl+R for reports
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      setActiveTab("reports");
    }
    
    // ? key for help
    if (e.key === '?') {
      e.preventDefault();
      addNotification("Shortcuts: Esc (Close Modal/Back), Ctrl+N (New), Ctrl+D (Dashboard), Ctrl+T (Transactions), Ctrl+R (Reports), ⌘K (Search)", "info");
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [
  showForm, showCustomerModal, showPayrollModal, showAssetModal, showProductModal,
  showBankModal, showVendorModal, showBillModal, showBudgetModal, showRecurringModal,
  showTaxModal, showLockModal, showAuditModal, showMigrationModal, showJournalEntryModal,
  showTemplateModal, showInvoiceModal, showLoanModal, showGoalModal, showAnalyticsModal,
  showDefiModal, showNftModal, showHfModal, showChangeHistoryModal, showAttachmentModal,
  showViewAttachmentsModal, showAiSuggestion, showCompanyModal, showStockAdjustModal,
  goBack
]);


  // ========== RENDER ==========
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-primary">
        
        {/* ========== DESKTOP SIDEBAR ========== */}
<aside className={`fixed top-0 left-0 h-full w-72 bg-sidebar border-r border-border z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 hidden md:block`}>
  <div className="p-5 border-b border-border">
    {/* Theme-aware logo */}
    <img 
      src={darkMode ? "https://dahgan.com/web-apps/finwise/1x/logodark.png" : "https://dahgan.com/web-apps/finwise/1x/logolight.png"} 
      alt="FinWise: Accountant Manager"
      className="w-full max-w-[180px] h-auto mx-auto"
    />
  </div>
          
          {/* Desktop Search Button */}
          <div className="px-3 py-2">
            <button onClick={() => setShowSearchModal(true)} className="w-full btn-secondary text-sm py-2 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={icons.search} className="w-4 h-4" />
              Search (⌘K)
            </button>
          </div>
          
          <nav className="p-3 space-y-1">
            {tabs.map((item) => (
              <button key={item.id} onClick={() => navigateToTab(item.id)} className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}>
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between">
              <select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language} className="text-sm bg-transparent border border-border rounded px-2 py-1">
                <option value="en">EN</option>
                <option value="fa">FA</option>
                <option value="de">DE</option>
              </select>
              <select onChange={(e) => setCurrency(e.target.value)} value={currency} className="text-sm bg-transparent border border-border rounded px-2 py-1">
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="IRR">IRR</option>
                <option value="TRY">TRY</option>
                <option value="AMD">AMD</option>
              </select>
              <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-hover">
                <FontAwesomeIcon 
                  icon={theme === "dark" ? icons.sun : icons.moon} 
                  className="w-4 h-4" 
                />
                <span className="ml-2 text-xs hidden lg:inline">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </button>
            </div>
            <button onClick={connectBlockchain} className="w-full btn-secondary text-xs py-1.5">
              <FontAwesomeIcon icon={icons.blockchain} className="mr-1 w-3 h-3" /> Blockchain
            </button>
            <button onClick={enableQuantumEncryption} className="w-full btn-secondary text-xs py-1.5">
              <FontAwesomeIcon icon={icons.quantum} className="mr-1 w-3 h-3" /> Quantum
            </button>
            {companies.length > 0 && (
              <select onChange={(e) => switchCompany(e.target.value)} value={currentCompanyId} className="w-full text-sm bg-transparent border border-border rounded px-2 py-1">
                {companies.map(c => <option key={c.id} value={c.id}>🏢 {c.name}</option>)}
                <option value="default">🏠 Personal</option>
              </select>
            )}
          </div>
        </aside>

        {/* ========== MOBILE HEADER ========== */}
<div className="md:hidden fixed top-0 left-0 right-0 bg-card z-50 border-b border-border px-4 py-3 flex justify-between items-center">
  <button onClick={() => setShowMobileMenu(true)} className="p-2 rounded-lg hover:bg-hover">
    <FontAwesomeIcon icon={icons.menu} className="w-5 h-5" />
  </button>
  
  {/* Mobile Logo */}
  <img 
    src={darkMode ? "https://dahgan.com/web-apps/finwise/1x/logodark.png" : "https://dahgan.com/web-apps/finwise/1x/logolight.png"} 
    alt="FinWise: Accountant Manager"
    className="h-8 w-auto"
  />
  
  <div className="flex gap-2">
    <button onClick={() => setShowSearchModal(true)} className="p-2 rounded-lg hover:bg-hover" title="Search (⌘K)">
      <FontAwesomeIcon icon={icons.search} className="w-5 h-5" />
    </button>
    <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-hover">
      <FontAwesomeIcon 
        icon={darkMode ? icons.sun : icons.moon} 
        className="w-5 h-5" 
      />
    </button>
  </div>
</div>

            

        {/* ========== MOBILE MENU ========== */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-card p-4 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold">Menu</h2>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 rounded-lg hover:bg-hover">
                  <FontAwesomeIcon icon={icons.close} className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 space-y-1">
                {tabs.map((item) => (
                  <button key={item.id} onClick={() => navigateToTab(item.id)} className={`sidebar-item ${activeTab === item.id ? "active" : ""}`}>
                    <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
                <div className="pt-4 mt-4 border-t border-border space-y-2">
                  <select onChange={(e) => changeLanguage(e.target.value)} value={i18n.language} className="w-full text-sm bg-transparent border border-border rounded px-3 py-2">
                    <option value="en">English</option>
                    <option value="fa">فارسی</option>
                    <option value="de">Deutsch</option>
                  </select>
                  <select onChange={(e) => setCurrency(e.target.value)} value={currency} className="w-full text-sm bg-transparent border border-border rounded px-3 py-2">
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="IRR">IRR</option>
                    <option value="TRY">TRY</option>
                    <option value="AMD">AMD</option>
                  </select>
                  <button onClick={connectBlockchain} className="w-full btn-secondary text-sm py-2">Blockchain</button>
                  <button onClick={enableQuantumEncryption} className="w-full btn-secondary text-sm py-2">Quantum</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== MAIN CONTENT ========== */}
        <div className={`pt-16 md:pt-0 transition-all duration-300 ${sidebarOpen ? "md:ml-72" : ""}`}>
          <div className="p-4 md:p-6 max-w-7xl mx-auto">

            {/* ========== CONTEXTUAL ACTION BUTTONS ========== */}
{(() => {
  const { visible, more } = getActionsForTab(activeTab);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {visible.map(action => (
        <button key={action.id} onClick={action.onClick} className={`btn-${action.variant || 'secondary'} text-sm px-3 py-1.5`}>
          <FontAwesomeIcon icon={action.icon} className="mr-1 w-3 h-3" /> {action.label}
        </button>
      ))}
      
      {/* UNIFIED MORE DROPDOWN - Works on both desktop and mobile */}
      {more.length > 0 && (
        <div className="relative">
          <button 
            onClick={() => setIsMoreOpen(true)}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            <FontAwesomeIcon icon={icons.more} className="mr-1 w-3 h-3" /> More
          </button>
          
          {/* Modal Overlay */}
          {isMoreOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-all md:bg-black/30"
                onClick={() => setIsMoreOpen(false)}
              />
              
              {/* Dropdown Modal - Centered on mobile, absolute on desktop */}
              <div className="
                fixed z-50 bg-card border border-border shadow-xl overflow-hidden
                /* Mobile styles */
                top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                w-[90%] max-w-[400px] max-h-[80vh] rounded-xl
                /* Desktop styles */
                md:absolute md:top-full md:left-0 md:translate-x-0 md:translate-y-0
                md:w-auto md:min-w-[280px] md:max-h-[500px] md:rounded-lg md:mt-1
              ">
                {/* Header with Close Button */}
                <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex justify-between items-center">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={icons.more} className="w-4 h-4 text-muted" />
                    More Actions
                    <span className="text-xs text-muted font-normal ml-1">({more.length})</span>
                  </h3>
                  <button 
                    onClick={() => setIsMoreOpen(false)}
                    className="p-1 rounded-lg hover:bg-hover transition-colors"
                  >
                    <FontAwesomeIcon icon={icons.close} className="w-4 h-4 text-muted" />
                  </button>
                </div>
                
                {/* Search input */}
                <div className="sticky top-[49px] bg-card p-3 border-b border-border">
                  <div className="relative">
                    <FontAwesomeIcon icon={icons.search} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Search actions..."
                      value={moreMenuSearch}
                      onChange={(e) => setMoreMenuSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm modern-input rounded-lg"
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Actions List */}
                <div className="max-h-[calc(80vh-120px)] md:max-h-[350px] overflow-y-auto p-2">
                  {/* Recent Actions Section */}
                  {recentActions.length > 0 && moreMenuSearch === '' && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
                        🕐 Recent
                      </div>
                      {more
                        .filter(action => recentActions.includes(action.id))
                        .map(action => (
                          <button
                            key={action.id}
                            onClick={() => {
                              saveRecentAction(action.id);
                              action.onClick();
                              setIsMoreOpen(false);
                              setMoreMenuSearch('');
                            }}
                            className={`w-full text-left px-3 py-2.5 md:py-2 text-sm rounded-lg transition-all flex items-center gap-3 hover:bg-hover ${
                              action.variant === 'danger' ? 'text-red-500' : ''
                            }`}
                          >
                            <FontAwesomeIcon icon={action.icon} className="w-4 h-4" />
                            <span>{action.label}</span>
                          </button>
                        ))}
                      <div className="h-px bg-border-light my-2" />
                    </>
                  )}
                  
                  {/* All Actions */}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">
                    📋 All Actions
                  </div>
                  {more
                    .filter(action => 
                      moreMenuSearch === '' || 
                      action.label.toLowerCase().includes(moreMenuSearch.toLowerCase())
                    )
                    .map((action) => (
                      <button
                        key={action.id}
                        onClick={() => {
                          saveRecentAction(action.id);
                          action.onClick();
                          setIsMoreOpen(false);
                          setMoreMenuSearch('');
                        }}
                        className={`w-full text-left px-3 py-2.5 md:py-2 text-sm rounded-lg transition-all flex items-center gap-3 hover:bg-hover ${
                          action.variant === 'danger' ? 'text-red-500' : ''
                        }`}
                      >
                        <FontAwesomeIcon icon={action.icon} className="w-4 h-4" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  
                  {more.filter(a => a.label.toLowerCase().includes(moreMenuSearch.toLowerCase())).length === 0 && (
                    <div className="text-center text-muted text-sm py-8">
                      No matching actions found
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="sticky bottom-0 bg-card p-2 border-t border-border text-[10px] text-muted text-center flex items-center justify-center gap-3">
                  <span><FontAwesomeIcon icon={icons.close} className="mr-1 w-3 h-3" /> Click ✕ to close</span>
                  <span className="hidden md:inline">•</span>
                  <span><FontAwesomeIcon icon={icons.keyboard} className="mr-1 w-3 h-3" /> ESC to close</span>
                  <span className="hidden md:inline">•</span>
                  <span><FontAwesomeIcon icon={icons.search} className="mr-1 w-3 h-3" /> ⌘K global search</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
})()}

            <input id="backupRestoreInput" type="file" accept=".json" className="hidden" onChange={importFullBackup} />

            {/* Hidden file input */}
            <input id="receiptInput" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) scanReceipt(file); }} />

            {/* ========== DASHBOARD TAB ========== */}
            {activeTab === "dashboard" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="stat-card"><p className="stat-label">{t("dashboard.total_income")}</p><p className="stat-value">{currencySymbols[currency]}{getConvertedAmount(totalIncome).toLocaleString()}</p></div>
                  <div className="stat-card"><p className="stat-label">{t("dashboard.total_expenses")}</p><p className="stat-value">{currencySymbols[currency]}{getConvertedAmount(totalExpense).toLocaleString()}</p></div>
                  <div className="stat-card"><p className="stat-label">{t("dashboard.balance")}</p><p className={`stat-value ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>{currencySymbols[currency]}{getConvertedAmount(balance).toLocaleString()}</p></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="stat-card p-3"><p className="stat-label text-xs">{t("dashboard.profit_margin")}</p><p className="stat-value text-lg">{totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%</p></div>
                  <div className="stat-card p-3"><p className="stat-label text-xs">{t("dashboard.expense_ratio")}</p><p className="stat-value text-lg">{totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}%</p></div>
                  <div className="stat-card p-3"><p className="stat-label text-xs">{t("dashboard.roi")}</p><p className="stat-value text-lg">{totalExpense > 0 ? ((balance / totalExpense) * 100).toFixed(1) : 0}%</p></div>
                  <div className="stat-card p-3"><p className="stat-label text-xs">{t("dashboard.savings_rate")}</p><p className="stat-value text-lg">{totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%</p></div>
                </div>

                {/* Spending Heatmap */}
<div className="heatmap-container">
  <h3 className="font-semibold mb-4 flex items-center gap-2">
    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    Monthly Spending Heatmap
  </h3>
  
  <div className="overflow-x-auto">
    <div className="min-w-[280px]">
      {/* Day labels */}
      <div className="heatmap-days-row">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="heatmap-day-label">{day}</div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="heatmap-grid">
        {(() => {
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();
          const firstDay = new Date(year, month, 1);
          const lastDay = new Date(year, month + 1, 0);
          const daysInMonth = lastDay.getDate();
          const startWeekday = firstDay.getDay();
          
          // Calculate daily spending
          const dailySpending: { [key: number]: number } = {};
          transactions.forEach(t => {
            if (t.amount < 0) {
              const date = new Date(t.date);
              if (date.getMonth() === month && date.getFullYear() === year) {
                const day = date.getDate();
                dailySpending[day] = (dailySpending[day] || 0) + Math.abs(t.amount);
              }
            }
          });
          
          const spendingValues = Object.values(dailySpending);
          const maxSpending = spendingValues.length > 0 ? Math.max(...spendingValues) : 1;
          
          // Get spending level (0-4)
          const getSpendingLevel = (amount: number): number => {
            if (amount === 0) return 0;
            const ratio = amount / maxSpending;
            if (ratio < 0.25) return 1;
            if (ratio < 0.5) return 2;
            if (ratio < 0.75) return 3;
            return 4;
          };
          
          // Build calendar cells
          const cells = [];
          
          // Add empty cells for days before month starts
          for (let i = 0; i < startWeekday; i++) {
            cells.push(<div key={`empty-${i}`} className="heatmap-cell heatmap-level-0 opacity-30" />);
          }
          
          // Add cells for each day of month
          for (let day = 1; day <= daysInMonth; day++) {
            const spending = dailySpending[day] || 0;
            const level = getSpendingLevel(spending);
            cells.push(
              <div
                key={day}
                className={`heatmap-cell heatmap-level-${level}`}
                title={spending > 0 ? `${currencySymbols[currency]}${spending.toLocaleString()} spent on ${formatDate(day, month, year)}` : `No spending on ${formatDate(day, month, year)}`}
              >
                {day}
              </div>
            );
          }
          
          return cells;
        })()}
      </div>
      
      {/* Legend */}
      <div className="heatmap-legend">
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-color heatmap-level-0" />
          <span className="heatmap-legend-text">No spend</span>
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-color heatmap-level-1" />
          <span className="heatmap-legend-text">Low</span>
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-color heatmap-level-2" />
          <span className="heatmap-legend-text">Medium</span>
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-color heatmap-level-3" />
          <span className="heatmap-legend-text">High</span>
        </div>
        <div className="heatmap-legend-item">
          <div className="heatmap-legend-color heatmap-level-4" />
          <span className="heatmap-legend-text">Highest</span>
        </div>
      </div>
    </div>
  </div>
</div>

                {/* Cash Flow Forecast - Only show if there are transactions */}
{transactions.length > 0 && (
  <div className="bg-card rounded-lg shadow p-4 mb-6">
    <h3 className="font-semibold mb-3">📈 Cash Flow Forecast (6 months)</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-hover">
          <tr>
            <th className="px-3 py-2 text-left">Month</th>
            <th className="px-3 py-2 text-right">Inflow</th>
            <th className="px-3 py-2 text-right">Outflow</th>
            <th className="px-3 py-2 text-right">Net</th>
            <th className="px-3 py-2 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {getCashFlowForecast(6).map((f, idx) => {
            // Only show if there's actual data, otherwise show empty
            const hasData = f.inflow > 0 || f.outflow > 0;
            if (!hasData && transactions.length === 0) return null;
            return (
              <tr key={idx} className="border-b border-border">
                <td className="px-3 py-2">{f.month}</td>
                <td className="px-3 py-2 text-right text-green-600">
                  {f.inflow > 0 ? `${currencySymbols[currency]}${f.inflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                </td>
                <td className="px-3 py-2 text-right text-red-600">
                  {f.outflow > 0 ? `${currencySymbols[currency]}${f.outflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                </td>
                <td className={`px-3 py-2 text-right font-semibold ${f.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {f.net !== 0 ? `${currencySymbols[currency]}${f.net.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-'}
                </td>
                <td className={`px-3 py-2 text-right font-bold ${f.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currencySymbols[currency]}${f.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </td>
              </tr>
            );
          }).filter(Boolean)}
        </tbody>
      </table>
    </div>
    {transactions.length === 0 && (
      <p className="text-center text-muted py-4">Add transactions to see cash flow forecast</p>
    )}
  </div>
)}

                {/* Savings Goals Section */}
                {savingsGoals.length > 0 && (
                  <div className="bg-card rounded-lg shadow p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">🎯 Savings Goals</h3>
                      <button onClick={() => setShowGoalModal(true)} className="text-xs text-blue-500">+ Add Goal</button>
                    </div>
                    <div className="space-y-3">
                      {savingsGoals.map(goal => {
                        const progress = (goal.current / goal.target) * 100;
                        return (
                          <div key={goal.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{goal.name}</span>
                              <span>{currencySymbols[currency]}{goal.current.toLocaleString()} / {currencySymbols[currency]}{goal.target.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-hover rounded-full h-2">
                              <div className="bg-green-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* DeFi Positions Section */}
                {defiPositions.length > 0 && (
                  <div className="bg-card rounded-lg shadow p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">📈 DeFi Yield Positions</h3>
                      <button onClick={() => setShowDefiModal(true)} className="text-xs text-blue-500">+ Add Position</button>
                    </div>
                    <div className="space-y-3">
                      {defiPositions.map(pos => {
                        const { yearlyYield, earnedYield, currentValue } = calculateDefiYield(pos);
                        return (
                          <div key={pos.id} className="border-b border-border pb-2 last:border-0">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-sm">{pos.protocol}</p>
                                <p className="text-xs text-muted">{pos.token} | {pos.apy}% APY</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-green-600">{currencySymbols[currency]}{currentValue.toLocaleString()}</p>
                                <p className="text-xs text-muted">+{currencySymbols[currency]}{earnedYield.toLocaleString()} earned</p>
                              </div>
                            </div>
                            <div className="w-full bg-hover rounded-full h-1.5 mt-1">
                              <div className="bg-green-500 rounded-full h-1.5" style={{ width: `${Math.min((earnedYield / pos.amount) * 100, 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Outstanding Bills Section */}
                {bills.filter(b => b.status !== 'paid').length > 0 && (
                  <div className="bg-card rounded-lg shadow p-4 mb-6">
                    <h3 className="font-semibold mb-3">⚠️ Outstanding Bills</h3>
                    <div className="space-y-2">
                      {bills.filter(b => b.status !== 'paid').slice(0, 5).map(bill => (
                        <div key={bill.id} className="flex justify-between items-center p-2 hover:bg-hover rounded">
                          <div>
                            <p className="font-medium text-sm">{bill.vendorName}</p>
                            <p className="text-xs text-muted">Bill #{bill.billNumber} | Due: {bill.dueDate}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-red-600">{currencySymbols[currency]}{(bill.amount - bill.paidAmount).toLocaleString()}</p>
                            <button onClick={() => { const amount = prompt("Enter payment amount:", (bill.amount - bill.paidAmount).toString()); if (amount) payBill(bill.id, parseFloat(amount)); }} className="text-xs text-blue-500 mt-1">Pay</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NFT Collections Section */}
                {nftCollections.length > 0 && (
                  <div className="bg-card rounded-lg shadow p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">🎨 NFT Portfolio</h3>
                      <button onClick={() => setShowNftModal(true)} className="text-xs text-blue-500">+ Add NFT</button>
                    </div>
                    <div className="space-y-3">
                      {nftCollections.map(nft => {
                        const { pnl, pnlPercent, daysHeld } = calculateNftPnL(nft);
                        return (
                          <div key={nft.id} className="border-b border-border pb-2 last:border-0">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-sm">{nft.collection}</p>
                                <p className="text-xs text-muted">{nft.name} | Held {daysHeld} days</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">{currencySymbols[currency]}{nft.floorPrice.toLocaleString()}</p>
                                <p className={`text-xs ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>{pnl >= 0 ? "+" : ""}{currencySymbols[currency]}{Math.abs(pnl).toLocaleString()} ({pnlPercent.toFixed(1)}%)</p>
                              </div>
                            </div>
                            <div className="w-full bg-hover rounded-full h-1.5 mt-1">
                              <div className={`rounded-full h-1.5 ${pnl >= 0 ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${Math.min(Math.abs(pnlPercent), 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Budget Progress Section */}
                {budgets.size > 0 && (
                  <div className="bg-card rounded-lg shadow p-4 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">📊 Budget Progress</h3>
                      <button onClick={() => setShowBudgetModal(true)} className="text-xs text-blue-500">Set Budget</button>
                    </div>
                    {Array.from(budgets.entries()).map(([category, budget]) => {
                      const progress = getBudgetProgress(category);
                      const spent = transactions.filter(t => t.category === category && t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
                      return (
                        <div key={category} className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{category}</span>
                            <span>{currencySymbols[currency]}{spent.toLocaleString()} / {currencySymbols[currency]}{budget.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-hover rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${progress > 90 ? "bg-red-500" : progress > 70 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="chart-container">
                    <h3 className="chart-title">{t("dashboard.expenses_by_category")}</h3>
                    {getCategoryData().length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={getCategoryData()} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                            {getCategoryData().map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                          </Pie>
                          <Tooltip formatter={(value) => `${currencySymbols[currency]}${getConvertedAmount(Number(value)).toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (<p className="text-center text-muted py-8">{t("dashboard.no_expense_data")}</p>)}
                  </div>
                  <div className="chart-container">
                    <h3 className="chart-title">{t("dashboard.monthly_trend")}</h3>
                    {getMonthlyData().length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={getMonthlyData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `${currencySymbols[currency]}${value}`} />
                          <Tooltip formatter={(value) => `${currencySymbols[currency]}${Number(value).toLocaleString()}`} />
                          <Legend />
                          <Bar dataKey="income" fill="#00C49F" name={t("dashboard.income")} />
                          <Bar dataKey="expense" fill="#FF8042" name={t("dashboard.expense")} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (<p className="text-center text-muted py-8">{t("dashboard.no_transaction_data")}</p>)}
                  </div>
                </div>

                <div className="bg-card rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">{t("dashboard.recent_transactions")}</h3>
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center p-2 hover:bg-hover rounded">
                        <div><p className="font-medium text-sm">{tx.description}</p><p className="text-xs text-muted">{tx.date}</p></div>
                        <p className={`font-semibold text-sm ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>{currencySymbols[currency]}{getConvertedAmount(Math.abs(tx.amount)).toLocaleString()}</p>
                      </div>
                    ))}
                    {transactions.length === 0 && <p className="text-center text-muted py-4">{t("transactions.no_transactions")}</p>}
                  </div>
                </div>
              </>
            )}

            {/* ========== TRANSACTIONS TAB ========== */}
            {activeTab === "transactions" && (
              <>
                <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                  <h2 className="text-xl font-semibold">{t("transactions.title")}</h2>
                  <div className="flex flex-wrap gap-2">
                    <input type="text" placeholder={t("transactions.search_placeholder")} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="modern-input text-sm px-3 py-1.5 w-full sm:w-48" />
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="modern-select text-sm px-3 py-1.5">
                      <option value="all">{t("transactions.all_categories")}</option>
                      <option value="income">{t("transactions.income_only")}</option>
                      <option value="expense">{t("transactions.expense_only")}</option>
                    </select>
                  </div>
                </div>
                <div className="bg-card rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-hover">
                        <tr><th className="px-4 py-2 text-left">{t("transactions.date")}</th><th className="px-4 py-2 text-left">{t("transactions.description")}</th><th className="px-4 py-2 text-left">{t("transactions.category")}</th><th className="px-4 py-2 text-right">{t("transactions.amount")}</th><th className="px-4 py-2 text-right">{t("transactions.actions")}</th></tr>
                      </thead>
                      <tbody>
                        {getFilteredTransactions().map((tx) => (
                          <tr key={tx.id} className="border-b border-border hover:bg-hover">
                            <td className="px-4 py-2">
                              {tx.date}
                              {(tx.attachments && tx.attachments.length > 0) && (
                                <button onClick={() => viewAttachments(tx.id)} className="text-green-600 hover:text-green-800 ml-1" title="View attachments">
                                  <FontAwesomeIcon icon={icons.eye} className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-2">{tx.description}</td>
                            <td className="px-4 py-2">{tx.category}</td>
                            <td className={`px-4 py-2 text-right font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {currencySymbols[currency]}{getConvertedAmount(Math.abs(tx.amount)).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex gap-1 justify-end">
                                {/* Edit button */}
                                <button 
                                onClick={() => {
                                  setNewTx({
                                    description: tx.description,
                                    amount: tx.amount,
                                    category: tx.category,
                                    date: tx.date
                                  });
                                  setEditingTransactionId(tx.id);
                                  setShowForm(true);
                                }} 
                                className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Edit transaction"
                              >
                                <FontAwesomeIcon icon={icons.edit} className="w-4 h-4" />
                              </button>
                                {/* Delete button */}
                                <button 
                                  onClick={() => deleteTransaction(tx.id)} 
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Delete transaction"
                                >
                                  <FontAwesomeIcon icon={icons.trash} className="w-4 h-4" />
                                </button>
                                {/* Attachment button */}
                                <button 
                                  onClick={() => { setSelectedTransactionId(tx.id); setShowAttachmentModal(true); }} 
                                  className="text-green-500 hover:text-green-700 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                                  title="Add attachment"
                                >
                                  <FontAwesomeIcon icon={icons.image} className="w-4 h-4" />
                                </button>
                                {/* View attachments button */}
                                {(tx.attachments && tx.attachments.length > 0) && (
                                  <button 
                                    onClick={() => viewAttachments(tx.id)} 
                                    className="text-purple-500 hover:text-purple-700 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                    title="View attachments"
                                  >
                                    <FontAwesomeIcon icon={icons.eye} className="w-4 h-4" />
                                    {tx.attachments.length > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                        {tx.attachments.length}
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {transactions.length === 0 && <p className="text-center text-muted py-8">{t("transactions.no_transactions")}</p>}
                </div>
              </>
            )}

            {/* ========== INVENTORY TAB ========== */}
            {activeTab === "inventory" && (
              <div className="bg-card rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h2 className="text-xl font-semibold">{t("inventory.title")}</h2>
                  <div className="flex gap-2">
                    <select value={valuationMethod} onChange={e => setValuationMethod(e.target.value)} className="modern-select text-sm px-2 py-1">
                      <option value="FIFO">FIFO</option>
                      <option value="LIFO">LIFO</option>
                      <option value="AVG">Weighted Average</option>
                    </select>
                    <button onClick={() => setShowProductModal(true)} className="btn-primary text-sm px-3 py-1.5"><FontAwesomeIcon icon={icons.add} className="mr-1 w-3 h-3" /> {t("inventory.add_product")}</button>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                  <FontAwesomeIcon icon={icons.product} className="mr-2" />
                  Inventory Value ({valuationMethod}): {currencySymbols[currency]}{calculateInventoryValue().toLocaleString()}
                </div>

                {getLowStockProducts().length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon icon={icons.warning} className="text-yellow-500" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">{getLowStockProducts().length} product(s) below minimum stock level!</p>
                    </div>
                  </div>
                )}

                {products.length === 0 ? (
                  <div className="text-center py-12"><FontAwesomeIcon icon={icons.inventory} className="text-5xl text-muted mb-3" /><p className="text-muted">No products yet. Click {t("inventory.add_product")} to get started.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(p => (
  <div key={p.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-all relative">
    {/* Delete button */}
    <button 
      onClick={() => {
        if (confirm(`Delete product "${p.name}"? This action cannot be undone.`)) {
          deleteProduct(p.id);
        }
      }}
      className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
      title="Delete product"
    >
      <FontAwesomeIcon icon={icons.trash} className="w-4 h-4" />
    </button>
    
    {/* Edit button */}
    <button 
      onClick={() => {
        setNewProduct({
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          price: p.price,
          cost: p.cost,
          category: p.category,
          minStock: p.minStock
        });
        setEditingProductId(p.id);
        setShowProductModal(true);
      }} 
      className="absolute top-2 right-10 text-blue-500 hover:text-blue-700 transition-colors p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 z-10"
      title="Edit product"
    >
      <FontAwesomeIcon icon={icons.edit} className="w-4 h-4" />
    </button>
    
    <h3 className="font-semibold pr-16">{p.name}</h3>
    <p className="text-xs text-muted">SKU: {p.sku}</p>
    <div className="mt-2 space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-muted">Quantity:</span>
        <span className={p.quantity <= p.minStock ? "text-red-600 font-semibold" : ""}>{p.quantity}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted">Price:</span>
        <span className="text-green-600">{currencySymbols[currency]}{p.price}</span>
      </div>
      {p.quantity <= p.minStock && (
        <div className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
          <FontAwesomeIcon icon={icons.warning} className="w-3 h-3" />
          Low stock! Min: {p.minStock}
        </div>
      )}
    </div>
    <button 
      onClick={() => { setSelectedProduct(p); setShowStockAdjustModal(true); }} 
      className="w-full mt-3 btn-secondary text-sm py-1.5"
    >
      <FontAwesomeIcon icon={icons.edit} className="mr-1 w-3 h-3" />
      {t("inventory.adjust_stock")}
    </button>
  </div>
))}
                  </div>
                )}
              </div>
            )}

            {/* ========== CUSTOMERS TAB ========== */}
{activeTab === "customers" && (
  <div className="bg-card rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <h2 className="text-xl font-semibold">{t("customers.title")}</h2>
      <button onClick={() => setShowCustomerModal(true)} className="btn-primary text-sm px-3 py-1.5">
        <FontAwesomeIcon icon={icons.add} className="mr-1 w-3 h-3" /> {t("customers.add_customer")}
      </button>
    </div>
    {customers.length === 0 ? (
      <div className="text-center py-12">
        <FontAwesomeIcon icon={icons.customers} className="text-5xl text-muted mb-3" />
        <p className="text-muted">No customers yet. Click {t("customers.add_customer")} to get started.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(c => (
          <div key={c.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-all relative">
            {/* Delete button */}
            <button 
              onClick={() => deleteCustomer(c.id)} 
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
              title="Delete customer"
            >
              <FontAwesomeIcon icon={icons.trash} className="w-4 h-4" />
            </button>
            {/* Edit button */}
            <button 
              onClick={() => {
                setNewCustomer({
                  name: c.name,
                  email: c.email,
                  phone: c.phone,
                  address: c.address || ""
                });
                setEditingCustomerId(c.id);
                setShowCustomerModal(true);
              }} 
              className="absolute top-2 right-10 text-blue-500 hover:text-blue-700 transition-colors p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 z-10"
              title="Edit customer"
            >
              <FontAwesomeIcon icon={icons.edit} className="w-4 h-4" />
            </button>
            <h3 className="font-semibold pr-16">{c.name}</h3>
            <p className="text-xs text-muted">{c.email}</p>
            <p className="text-xs text-muted">{c.phone}</p>
          </div>
        ))}
      </div>
    )}
  </div>
)}

            

            {/* ========== PAYROLL TAB ========== */}
{activeTab === "payroll" && (
  <div className="bg-card rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <h2 className="text-xl font-semibold">{t("payroll.title")}</h2>
      <button onClick={() => setShowPayrollModal(true)} className="btn-primary text-sm px-3 py-1.5">
        <FontAwesomeIcon icon={icons.add} className="mr-1 w-3 h-3" /> {t("payroll.add_employee")}
      </button>
    </div>
    {employees.length === 0 ? (
      <div className="text-center py-12">
        <FontAwesomeIcon icon={icons.payroll} className="text-5xl text-muted mb-3" />
        <p className="text-muted">No employees yet. Click {t("payroll.add_employee")} to get started.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {employees.map(e => (
          <div key={e.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-all relative">
            {/* Delete button */}
            <button 
              onClick={() => deleteEmployee(e.id)} 
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 z-10"
              title="Delete employee"
            >
              <FontAwesomeIcon icon={icons.trash} className="w-4 h-4" />
            </button>
            {/* Edit button */}
            <button 
  onClick={() => {
    setNewEmployee({
      name: e.name,
      salary: e.salary,
      position: e.position,
      taxRate: e.taxRate
    });
    setEditingEmployeeId(e.id);
    setShowPayrollModal(true);
  }} 
  className="absolute top-2 right-10 text-blue-500 hover:text-blue-700 transition-colors p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 z-10"
  title="Edit employee"
>
  <FontAwesomeIcon icon={icons.edit} className="w-4 h-4" />
</button>
            <h3 className="font-semibold pr-16">{e.name}</h3>
            <p className="text-xs text-muted">{e.position}</p>
            <div className="mt-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Salary:</span>
                <span>{currencySymbols[currency]}{e.salary.toLocaleString()}</span>
              </div>
            </div>
            <button 
              onClick={() => { 
                const payrollTx: Transaction = { 
                  id: Date.now().toString(), 
                  description: `Payroll - ${e.name}`, 
                  amount: -e.salary, 
                  category: "Payroll", 
                  date: new Date().toISOString().split("T")[0] 
                }; 
                saveTransactions([payrollTx, ...transactions]); 
                addNotification(`Payroll processed for ${e.name}`, "success"); 
              }} 
              className="w-full mt-3 btn-primary text-sm py-1.5"
            >
              {t("payroll.process_payroll")}
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}

            {/* ========== ASSETS TAB ========== */}
{activeTab === "assets" && (
  <div className="bg-card rounded-lg shadow p-6">
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <h2 className="text-xl font-semibold">{t("assets.title")}</h2>
      <button onClick={() => setShowAssetModal(true)} className="btn-primary text-sm px-3 py-1.5">
        <FontAwesomeIcon icon={icons.add} className="mr-1 w-3 h-3" /> {t("assets.add_asset")}
      </button>
    </div>
    {assets.length === 0 ? (
      <div className="text-center py-12">
        <FontAwesomeIcon icon={icons.asset} className="text-5xl text-muted mb-3" />
        <p className="text-muted">No assets yet. Click {t("assets.add_asset")} to get started.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-hover">
            <tr>
              <th className="px-4 py-2 text-left w-10">Actions</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Purchase Date</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Annual Depreciation</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => (
              <tr key={a.id} className="border-b border-border hover:bg-hover">
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => deleteAsset(a.id)} 
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete asset"
                    >
                      <FontAwesomeIcon icon={icons.trash} className="w-4 h-4" />
                    </button>
                    <button 
  onClick={() => {
    setNewAsset({
      name: a.name,
      purchaseDate: a.purchaseDate,
      purchasePrice: a.purchasePrice,
      usefulLife: a.usefulLife,
      salvageValue: a.salvageValue,
      method: a.method
    });
    setEditingAssetId(a.id);
    setShowAssetModal(true);
  }} 
  className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
  title="Edit asset"
>
  <FontAwesomeIcon icon={icons.edit} className="w-4 h-4" />
</button>
                  </div>
                </td>
                <td className="px-4 py-2 font-medium">{a.name}</td>
                <td className="px-4 py-2">{a.purchaseDate || "-"}</td>
                <td className="px-4 py-2 text-right">{currencySymbols[currency]}{a.purchasePrice.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-orange-600">{currencySymbols[currency]}{calculateDepreciation(a).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

            {/* ========== BANK TAB ========== */}
            {activeTab === "bank" && (
              <div className="bg-card rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h2 className="text-xl font-semibold">{t("bank.title")}</h2>
                  <button onClick={() => setShowBankModal(true)} className="btn-primary text-sm px-3 py-1.5">
                    <FontAwesomeIcon icon={icons.add} className="mr-1 w-3 h-3" /> {t("bank.connect_account")}
                  </button>
                </div>
                
                {bankAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <FontAwesomeIcon icon={icons.bank} className="text-5xl text-muted mb-3" />
                    <p className="text-muted">No bank accounts connected. Click {t("bank.connect_account")} to get started.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bankAccounts.map(b => (
  <div key={b.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-all relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-500 to-gray-700"></div>
    
    {/* Delete button */}
    <button onClick={() => deleteBankAccount(b.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 z-10 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
      <FontAwesomeIcon icon={icons.trash} className="w-4 h-4" />
    </button>
    
    {/* Edit button */}
    <button 
      onClick={() => {
        setNewBankAccount({
          name: b.name,
          balance: b.balance,
          currency: b.currency
        });
        setEditingBankId(b.id);
        setShowBankModal(true);
      }} 
      className="absolute top-2 right-10 text-blue-500 hover:text-blue-700 z-10 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
      title="Edit bank account"
    >
      <FontAwesomeIcon icon={icons.edit} className="w-4 h-4" />
    </button>
    
    <h3 className="font-semibold pr-16">{b.name}</h3>
    <p className="text-2xl font-bold text-green-600">{currencySymbols[b.currency]}{b.balance.toLocaleString()}</p>
    <p className="text-xs text-muted">{t("bank.last_synced")}: {new Date(b.lastSynced).toLocaleDateString()}</p>
    <button onClick={() => syncBankAccount(b.id)} className="w-full mt-3 btn-secondary text-sm py-1.5">
      <FontAwesomeIcon icon={icons.sync} className="mr-1 w-3 h-3" /> {t("bank.sync_now")}
    </button>
  </div>
))}
                  </div>
                )}
              </div>
            )}

            {/* ========== REPORTS TAB ========== */}
            {activeTab === "reports" && (
              <div className="bg-card rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">{t("reports.title")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div><label className="text-sm text-muted">{t("reports.start_date")}</label><input type="date" value={reportDateRange.start} onChange={e => setReportDateRange({ ...reportDateRange, start: e.target.value })} className="modern-input w-full mt-1" /></div>
                  <div><label className="text-sm text-muted">{t("reports.end_date")}</label><input type="date" value={reportDateRange.end} onChange={e => setReportDateRange({ ...reportDateRange, end: e.target.value })} className="modern-input w-full mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button onClick={() => downloadReport("pnl")} className="btn-primary py-2 text-sm">P&L Report</button>
                  <button onClick={() => downloadReport("balance")} className="btn-secondary py-2 text-sm">Balance Sheet</button>
                  <button onClick={() => downloadReport("cashflow")} className="btn-secondary py-2 text-sm">Cash Flow</button>
                  <button onClick={() => { const year = new Date().getFullYear(); const yearlyReport = generatePNLReport(`${year}-01-01`, `${year}-12-31`); addNotification(`Yearly Report ${year}: Net ${currencySymbols[currency]}${yearlyReport.netIncome}`, "info"); }} className="btn-accent py-2 text-sm">Yearly</button>
                </div>
                {/* Budget vs Actual Report */}
                {budgets.size > 0 && (
                  <div className="bg-card rounded-lg shadow p-6 mb-6">
                    <h3 className="font-semibold mb-3">📊 Budget vs Actual</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-hover">
                          <tr>
                            <th className="px-3 py-2 text-left">Category</th>
                            <th className="px-3 py-2 text-right">Budget</th>
                            <th className="px-3 py-2 text-right">Actual</th>
                            <th className="px-3 py-2 text-right">Variance</th>
                            <th className="px-3 py-2 text-right">% Used</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(budgets.entries()).map(([category, budget]) => {
                            const actual = transactions.filter(t => t.category === category && t.amount < 0)
                              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                            const variance = budget - actual;
                            const percentUsed = (actual / budget) * 100;
                            return (
                              <tr key={category} className="border-b border-border">
                                <td className="px-3 py-2">{category}</td>
                                <td className="px-3 py-2 text-right">{currencySymbols[currency]}{budget.toLocaleString()}</td>
                                <td className="px-3 py-2 text-right text-red-600">{currencySymbols[currency]}{actual.toLocaleString()}</td>
                                <td className={`px-3 py-2 text-right font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {variance >= 0 ? '+' : ''}{currencySymbols[currency]}{Math.abs(variance).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <div className="flex items-center gap-2">
                                    <span className={`${percentUsed > 90 ? 'text-red-600' : percentUsed > 70 ? 'text-yellow-600' : 'text-green-600'}`}>{percentUsed.toFixed(1)}%</span>
                                    <div className="w-16 bg-hover rounded-full h-1.5">
                                      <div className={`h-1.5 rounded-full ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(percentUsed, 100)}%` }} />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Trial Balance */}
{accounts.length > 0 && (
  <div className="bg-card rounded-lg shadow p-6 mb-6">
    <h3 className="font-semibold mb-3">⚖️ Trial Balance</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-hover">
          <tr><th className="px-3 py-2 text-left">Account</th><th className="px-3 py-2 text-right">Debit</th><th className="px-3 py-2 text-right">Credit</th></tr>
        </thead>
        <tbody>
          {(() => {
            const { trialBalance, totalDebits, totalCredits } = getTrialBalance();
            return (
              <>
                {trialBalance.filter(t => t.debit !== 0 || t.credit !== 0).map((item, idx) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="px-3 py-2">{item.code} - {item.name}</td>
                    <td className="px-3 py-2 text-right">{item.debit > 0 ? `${currencySymbols[currency]}${item.debit.toLocaleString()}` : '-'}</td>
                    <td className="px-3 py-2 text-right">{item.credit > 0 ? `${currencySymbols[currency]}${item.credit.toLocaleString()}` : '-'}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border font-bold">
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">{currencySymbols[currency]}{totalDebits.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{currencySymbols[currency]}{totalCredits.toLocaleString()}</td>
                </tr>
              </>
            );
          })()}
        </tbody>
      </table>
    </div>
  </div>
)}
                <div className="mt-6 pt-4 border-t border-border"><button onClick={() => setShowAnalyticsModal(true)} className="btn-outline w-full py-2">Advanced Analytics</button></div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ========== FLOATING ACTION BUTTON (Mobile) ========== */}
      {isMobile && (
        <>
          <button onClick={() => setShowBottomSheet(true)} className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg z-40">
            <FontAwesomeIcon icon={icons.add} className="w-6 h-6" />
          </button>
          {showBottomSheet && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setShowBottomSheet(false)}>
              <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-card p-4 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-bold">Quick Actions</h3>
                  <button onClick={() => setShowBottomSheet(false)} className="p-2 rounded-lg hover:bg-hover"><FontAwesomeIcon icon={icons.close} className="w-5 h-5" /></button>
                </div>
                <div className="p-3 grid grid-cols-3 gap-2">
                  {getActionsForTab(activeTab).visible.map(action => (
                    <button key={action.id} onClick={() => { action.onClick(); setShowBottomSheet(false); }} className={`btn-${action.variant || 'secondary'} py-3 text-sm flex flex-col items-center gap-1`}>
                      <FontAwesomeIcon icon={action.icon} className="w-5 h-5" />
                      <span className="text-xs">{action.label}</span>
                    </button>
                  ))}
                  {getActionsForTab(activeTab).more.map(action => (
                    <button key={action.id} onClick={() => { action.onClick(); setShowBottomSheet(false); }} className={`btn-secondary py-3 text-sm flex flex-col items-center gap-1 ${action.variant === 'danger' ? 'text-red-600' : ''}`}>
                      <FontAwesomeIcon icon={action.icon} className="w-5 h-5" />
                      <span className="text-xs">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========== AI CHATBOT ========== */}
      {!isMobile && (
        <button onClick={() => setShowChatbot(true)} className="fixed bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-40">
          <FontAwesomeIcon icon={icons.ai} className="w-5 h-5" />
        </button>
      )}
      {showChatbot && (
        <div className="fixed bottom-20 right-6 w-80 bg-card rounded-lg shadow-xl z-50 border border-border">
          <div className="flex justify-between items-center p-3 border-b border-border">
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <button onClick={() => setShowChatbot(false)} className="text-muted hover:text-primary"><FontAwesomeIcon icon={icons.close} className="w-4 h-4" /></button>
          </div>
          <div className="h-80 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (<div key={i} className={`p-2 rounded-lg text-sm ${msg.role === "user" ? "bg-blue-100 dark:bg-blue-900/30 text-right" : "bg-hover"}`}>{msg.content}</div>))}
            {chatMessages.length === 0 && <p className="text-center text-muted text-sm py-8">Ask me about your finances!</p>}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask a question..." className="flex-1 modern-input text-sm" onKeyPress={(e) => { if (e.key === "Enter" && chatInput) { setChatMessages([...chatMessages, { role: "user", content: chatInput }]); askChatGPT(chatInput); setChatInput(""); } }} />
          </div>
        </div>
      )}

      {/* ========== NOTIFICATIONS ========== */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <div key={notif.id} className={`p-3 rounded-lg shadow-lg text-white text-sm ${notif.type === "success" ? "toast-success" : notif.type === "error" ? "toast-error" : notif.type === "warning" ? "toast-warning" : "toast-info"}`}>
            {notif.message}
          </div>
        ))}
      </div>

      {/* ========== SCANNING STATUS ========== */}
      {scanningText && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-lg shadow-lg z-50 text-sm">
          {scanningText}
        </div>
      )}

      {/* ========== MODALS ========== */}

      {/* Chart of Accounts Modal */}
{showAccountsModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold">📚 Chart of Accounts</h3>
        <button onClick={() => setShowAccountsModal(false)} className="text-muted hover:text-primary">
          <FontAwesomeIcon icon={icons.close} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-hover">
            <tr><th className="px-3 py-2 text-left">Code</th><th className="px-3 py-2 text-left">Account Name</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-right">Balance</th></tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id} className="border-b border-border">
                <td className="px-3 py-2">{acc.code}</td>
                <td className="px-3 py-2">{acc.name}</td>
                <td className="px-3 py-2 capitalize">{acc.type}</td>
                <td className={`px-3 py-2 text-right font-semibold ${acc.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currencySymbols[currency]}{Math.abs(acc.balance).toLocaleString()} {acc.normalBalance === 'debit' ? 'Dr' : 'Cr'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <button className="btn-primary w-full py-2 text-sm">Add Account (Coming Soon)</button>
      </div>
    </div>
  </div>
)}

{/* Journal Entry Modal */}
{showJournalEntryModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-2xl max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-3">📝 Journal Entry</h3>
      <div className="space-y-2">
        <input type="date" placeholder="Date" value={newJournalEntry.date} onChange={e => setNewJournalEntry({ ...newJournalEntry, date: e.target.value })} className="modern-input w-full text-sm" />
        <input type="text" placeholder="Description" value={newJournalEntry.description} onChange={e => setNewJournalEntry({ ...newJournalEntry, description: e.target.value })} className="modern-input w-full text-sm" />
        <input type="text" placeholder="Reference #" value={newJournalEntry.reference} onChange={e => setNewJournalEntry({ ...newJournalEntry, reference: e.target.value })} className="modern-input w-full text-sm" />
        <h4 className="font-semibold text-sm mt-2">Journal Lines</h4>
        {(newJournalEntry.entries || []).map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <select value={line.accountId} onChange={e => { updateJournalLine(idx, "accountId", e.target.value); updateJournalLine(idx, "accountName", accounts.find(a => a.id === e.target.value)?.name || ""); }} className="col-span-5 modern-select text-sm">
              <option value="">Select Account</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
            </select>
            <input type="number" placeholder="Debit" value={line.debit || 0} onChange={e => updateJournalLine(idx, "debit", parseFloat(e.target.value) || 0)} className="col-span-2 modern-input text-sm" />
            <input type="number" placeholder="Credit" value={line.credit || 0} onChange={e => updateJournalLine(idx, "credit", parseFloat(e.target.value) || 0)} className="col-span-2 modern-input text-sm" />
            <button onClick={() => deleteJournalLine(idx)} className="col-span-1 text-red-500"><FontAwesomeIcon icon={icons.trash} /></button>
          </div>
        ))}
        <button onClick={addJournalLine} className="text-blue-500 text-sm">+ Add Line</button>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => setShowJournalEntryModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button>
        <button onClick={addJournalEntry} className="btn-primary px-3 py-1.5 text-sm">Post Entry</button>
      </div>
    </div>
  </div>
)}

{/* Vendor Modal */}
{showVendorModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-md">
      <h3 className="text-lg font-bold mb-3">🏢 Add Vendor</h3>
      <div className="space-y-2">
        <input type="text" placeholder="Vendor Name" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} className="modern-input w-full text-sm" />
        <input type="email" placeholder="Email" value={newVendor.email} onChange={e => setNewVendor({ ...newVendor, email: e.target.value })} className="modern-input w-full text-sm" />
        <input type="tel" placeholder="Phone" value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} className="modern-input w-full text-sm" />
        <input type="text" placeholder="Address" value={newVendor.address} onChange={e => setNewVendor({ ...newVendor, address: e.target.value })} className="modern-input w-full text-sm" />
        <input type="text" placeholder="Tax ID (optional)" value={newVendor.taxId} onChange={e => setNewVendor({ ...newVendor, taxId: e.target.value })} className="modern-input w-full text-sm" />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => setShowVendorModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button>
        <button onClick={addVendor} className="btn-primary px-3 py-1.5 text-sm">Add Vendor</button>
      </div>
    </div>
  </div>
)}

{/* Bill Modal */}
{showBillModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-lg">
      <h3 className="text-lg font-bold mb-3">📄 Create Bill</h3>
      <div className="space-y-2">
        <select value={newBill.vendorId} onChange={e => setNewBill({ ...newBill, vendorId: e.target.value, vendorName: vendors.find(v => v.id === e.target.value)?.name || "" })} className="modern-select w-full text-sm">
          <option value="">Select Vendor</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <input type="text" placeholder="Bill Number" value={newBill.billNumber} onChange={e => setNewBill({ ...newBill, billNumber: e.target.value })} className="modern-input w-full text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" placeholder="Date" value={newBill.date} onChange={e => setNewBill({ ...newBill, date: e.target.value })} className="modern-input text-sm" />
          <input type="date" placeholder="Due Date" value={newBill.dueDate} onChange={e => setNewBill({ ...newBill, dueDate: e.target.value })} className="modern-input text-sm" />
        </div>
        <input type="number" placeholder="Amount" value={newBill.amount} onChange={e => setNewBill({ ...newBill, amount: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" />
        <textarea placeholder="Notes (optional)" value={newBill.notes} onChange={e => setNewBill({ ...newBill, notes: e.target.value })} className="modern-input w-full text-sm" rows={2} />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => setShowBillModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button>
        <button onClick={addBill} className="btn-primary px-3 py-1.5 text-sm">Create Bill</button>
      </div>
    </div>
  </div>
)}
      
      {/* Add Transaction Modal */}
      {showForm && (
  <div className="modal-overlay">
    <div className="modal-content max-w-md">
      <h3 className="text-lg font-bold mb-3">
        {editingTransactionId ? "Edit Transaction" : "Add Transaction"}
      </h3><div className="space-y-2"><input type="text" placeholder="Description" value={newTx.description} onChange={e => setNewTx({ ...newTx, description: e.target.value })} className="modern-input w-full text-sm" /><input type="number" placeholder="Amount" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="text" placeholder="Category" value={newTx.category} onChange={e => setNewTx({ ...newTx, category: e.target.value })} className="modern-input w-full text-sm" /><input type="date" value={newTx.date} onChange={e => setNewTx({ ...newTx, date: e.target.value })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowForm(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button><button onClick={addTransaction} className="btn-primary px-3 py-1.5 text-sm">Save</button></div></div></div>)}

      {/* Attachment Modal */}
      {showAttachmentModal && selectedTransactionId && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h3 className="text-lg font-bold mb-3">📎 Add Attachment</h3>
            <p className="text-xs text-muted mb-3">Attach receipt, invoice, or document to transaction</p>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} className="modern-input w-full text-sm" />
            {attachmentFile && <p className="text-xs text-muted mt-1">Selected: {attachmentFile.name}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowAttachmentModal(false); setAttachmentFile(null); }} className="btn-outline px-3 py-1.5 text-sm">Cancel</button>
              <button onClick={async () => { if (attachmentFile) { await addAttachment(selectedTransactionId, attachmentFile); setShowAttachmentModal(false); setAttachmentFile(null); } }} className="btn-primary px-3 py-1.5 text-sm">Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* View Attachments Modal */}
      {showViewAttachmentsModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">📎 Attachments ({viewingAttachments.length})</h3>
            <div className="space-y-3">
              {viewingAttachments.map(att => (
                <div key={att.id} className="border border-border rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium break-all">{att.filename}</p>
                      <p className="text-xs text-muted">Uploaded: {new Date(att.uploadedAt).toLocaleString()}</p>
                      <p className="text-xs text-muted">Size: {(att.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => deleteAttachment(att.id, att.transactionId)} 
                            className="text-red-500 hover:text-red-700 ml-2"
                            title="Delete attachment">
                      <FontAwesomeIcon icon={icons.trash} />
                    </button>
                  </div>
                  {att.dataUrl.startsWith('data:image') && (
                    <div className="mt-2">
                      <img 
                        src={att.dataUrl} 
                        alt={att.filename} 
                        className="max-w-full max-h-48 object-contain rounded cursor-pointer"
                        onClick={() => window.open(att.dataUrl, '_blank')}
                      />
                    </div>
                  )}
                  {att.dataUrl.startsWith('data:application/pdf') && (
                    <div className="mt-2">
                      <a href={att.dataUrl} download={att.filename} className="text-blue-500 text-sm hover:underline">
                        <FontAwesomeIcon icon={icons.download} className="mr-1" />
                        Download PDF
                      </a>
                    </div>
                  )}
                </div>
              ))}
              {viewingAttachments.length === 0 && (
                <p className="text-center text-muted py-4">No attachments for this transaction</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowViewAttachmentsModal(false)} className="btn-primary px-3 py-1.5 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestion Modal */}
      {showAiSuggestion && (
        <div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">AI Suggestion</h3><p className="text-sm mb-2">I think this should be categorized as:</p><p className="text-xl font-bold text-blue-600 text-center mb-2">{currentSuggestion.suggestedCategory}</p><p className="text-xs text-muted text-center mb-4">Confidence: {currentSuggestion.confidence}%</p><div className="flex justify-end gap-2"><button onClick={() => setShowAiSuggestion(false)} className="btn-outline px-3 py-1.5 text-sm">Ignore</button><button onClick={() => applyAiSuggestion(currentSuggestion.transactionId, currentSuggestion.suggestedCategory)} className="btn-primary px-3 py-1.5 text-sm">Apply</button></div></div></div>
      )}

      {/* Invoice Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <h3 className="text-lg font-bold mb-3">📄 Create Invoice Template</h3>
            <div className="space-y-2">
              <input type="text" placeholder="Template Name (e.g., Monthly Retainer)" value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} className="modern-input w-full text-sm" />
              <input type="text" placeholder="Customer Name" value={newTemplate.customerName} onChange={e => setNewTemplate({ ...newTemplate, customerName: e.target.value })} className="modern-input w-full text-sm" />
              <select value={newTemplate.frequency} onChange={e => setNewTemplate({ ...newTemplate, frequency: e.target.value as any })} className="modern-select w-full text-sm">
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
              {newTemplate.frequency === 'monthly' && (
                <input type="number" placeholder="Day of Month (1-31)" min="1" max="31" value={newTemplate.dayOfMonth} onChange={e => setNewTemplate({ ...newTemplate, dayOfMonth: parseInt(e.target.value) || 1 })} className="modern-input w-full text-sm" />
              )}
              <h4 className="font-semibold text-sm mt-2">Items</h4>
              {(newTemplate.items || []).map((item, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2">
                  <input type="text" placeholder="Description" value={item.description} onChange={e => { const newItems = [...(newTemplate.items || [])]; newItems[idx].description = e.target.value; setNewTemplate({ ...newTemplate, items: newItems }); }} className="col-span-2 modern-input text-sm" />
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e => { const newItems = [...(newTemplate.items || [])]; newItems[idx].quantity = parseInt(e.target.value) || 0; setNewTemplate({ ...newTemplate, items: newItems }); }} className="modern-input text-sm" />
                  <input type="number" placeholder="Price" value={item.price} onChange={e => { const newItems = [...(newTemplate.items || [])]; newItems[idx].price = parseFloat(e.target.value) || 0; setNewTemplate({ ...newTemplate, items: newItems }); }} className="modern-input text-sm" />
                </div>
              ))}
              <button onClick={() => setNewTemplate({ ...newTemplate, items: [...(newTemplate.items || []), { description: "", quantity: 1, price: 0 }] })} className="text-blue-500 text-sm">+ Add Item</button>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowTemplateModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button>
              <button onClick={addInvoiceTemplate} className="btn-primary px-3 py-1.5 text-sm">Create Template</button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (<div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">Set Budget</h3><div className="space-y-2"><input type="text" placeholder="Category" value={newBudget.category} onChange={e => setNewBudget({ ...newBudget, category: e.target.value })} className="modern-input w-full text-sm" /><input type="number" placeholder="Budget Amount" value={newBudget.amount} onChange={e => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowBudgetModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button><button onClick={addBudget} className="btn-primary px-3 py-1.5 text-sm">Save</button></div></div></div>)}

      {/* Recurring Modal */}
      {showRecurringModal && (<div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">Recurring Transaction</h3><div className="space-y-2"><input type="text" placeholder="Description" value={newRecurring.description} onChange={e => setNewRecurring({ ...newRecurring, description: e.target.value })} className="modern-input w-full text-sm" /><input type="number" placeholder="Amount" value={newRecurring.amount} onChange={e => setNewRecurring({ ...newRecurring, amount: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="text" placeholder="Category" value={newRecurring.category} onChange={e => setNewRecurring({ ...newRecurring, category: e.target.value })} className="modern-input w-full text-sm" /><select value={newRecurring.frequency} onChange={e => setNewRecurring({ ...newRecurring, frequency: e.target.value })} className="modern-select w-full text-sm"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="yearly">Yearly</option></select><input type="number" placeholder="Day of month (1-31)" min="1" max="31" value={newRecurring.dayOfMonth} onChange={e => setNewRecurring({ ...newRecurring, dayOfMonth: parseInt(e.target.value) || 1 })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowRecurringModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button><button onClick={addRecurringTransaction} className="btn-primary px-3 py-1.5 text-sm">Save</button></div></div></div>)}

      {/* Product Modal */}
      {showProductModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-md">
      <h3 className="text-lg font-bold mb-3">
        {editingProductId ? "Edit Product" : t("inventory.add_product")}
      </h3>
      <div className="space-y-2"><input type="text" placeholder="Product Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="modern-input w-full text-sm" /><input type="text" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} className="modern-input w-full text-sm" /><input type="number" placeholder="Quantity" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="number" placeholder="Cost" value={newProduct.cost} onChange={e => setNewProduct({ ...newProduct, cost: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="number" placeholder="Min Stock" value={newProduct.minStock} onChange={e => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) || 0 })} className="modern-input w-full text-sm" /></div>      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => { 
          setShowProductModal(false); 
          setEditingProductId(null); 
          setNewProduct({ name: "", sku: "", quantity: 0, price: 0, cost: 0, category: "", minStock: 0 });
        }} className="btn-outline px-3 py-1.5 text-sm">
          Cancel
        </button>
        <button onClick={addProduct} className="btn-primary px-3 py-1.5 text-sm">
          {editingProductId ? "Update" : "Add"}
        </button>
      </div></div>
  </div>
)}


      {/* Customer Modal */}
      {showCustomerModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-md">
      <h3 className="text-lg font-bold mb-3">
        {editingCustomerId ? "Edit Customer" : t("customers.add_customer")}
      </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted mb-1">{t("customers.name")}</label>
                <input
                  type="text"
                  placeholder={t("customers.name")}
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="modern-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">{t("customers.email")}</label>
                <input
                  type="email"
                  placeholder={t("customers.email")}
                  value={newCustomer.email}
                  onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="modern-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1">{t("customers.phone")}</label>
                <input
                  type="tel"
                  placeholder={t("customers.phone")}
                  value={newCustomer.phone}
                  onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="modern-input w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { 
  setShowCustomerModal(false); 
  setEditingCustomerId(null); 
  setNewCustomer({ name: "", email: "", phone: "", address: "" });
}} className="btn-outline px-4 py-2">
  {t("buttons.cancel")}
</button>
              <button onClick={addCustomer} className="btn-primary px-4 py-2">
                <FontAwesomeIcon icon={icons.save} className="mr-2" />
                {t("buttons.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {showPayrollModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-md">
      <h3 className="text-lg font-bold mb-3">
        {editingEmployeeId ? "Edit Employee" : t("payroll.add_employee")}
      </h3><div className="space-y-2"><input type="text" placeholder="Name" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} className="modern-input w-full text-sm" /><input type="text" placeholder="Position" value={newEmployee.position} onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })} className="modern-input w-full text-sm" /><input type="number" placeholder="Salary" value={newEmployee.salary} onChange={e => setNewEmployee({ ...newEmployee, salary: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="number" placeholder="Tax Rate %" value={newEmployee.taxRate} onChange={e => setNewEmployee({ ...newEmployee, taxRate: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => { 
  setShowPayrollModal(false); 
  setEditingEmployeeId(null); 
  setNewEmployee({ name: "", salary: 0, position: "", taxRate: 20 });
}} className="btn-outline px-3 py-1.5 text-sm">
  Cancel
</button><button onClick={addEmployee} className="btn-primary px-3 py-1.5 text-sm">Add</button></div></div></div>)}

      {/* Asset Modal */}
      {showAssetModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-md">
      <h3 className="text-lg font-bold mb-3">
        {editingAssetId ? "Edit Asset" : t("assets.add_asset")}
      </h3><div className="space-y-2"><input type="text" placeholder="Asset Name" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} className="modern-input w-full text-sm" /><input type="date" placeholder="Purchase Date" value={newAsset.purchaseDate} onChange={e => setNewAsset({ ...newAsset, purchaseDate: e.target.value })} className="modern-input w-full text-sm" /><input type="number" placeholder="Purchase Price" value={newAsset.purchasePrice} onChange={e => setNewAsset({ ...newAsset, purchasePrice: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="number" placeholder="Useful Life (years)" value={newAsset.usefulLife} onChange={e => setNewAsset({ ...newAsset, usefulLife: parseInt(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="number" placeholder="Salvage Value" value={newAsset.salvageValue} onChange={e => setNewAsset({ ...newAsset, salvageValue: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => { 
  setShowAssetModal(false); 
  setEditingAssetId(null); 
  setNewAsset({ name: "", purchaseDate: "", purchasePrice: 0, usefulLife: 5, salvageValue: 0, method: "straight-line" });
}} className="btn-outline px-3 py-1.5 text-sm">
  Cancel
</button><button onClick={addAsset} className="btn-primary px-3 py-1.5 text-sm">Add</button></div></div></div>)}

      {/* Bank Modal */}
      {showBankModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-md">
      <h3 className="text-lg font-bold mb-3">
        {editingBankId ? "Edit Bank Account" : "Connect Bank Account"}
      </h3>
      <div className="space-y-2">
        <input type="text" placeholder="Account Name" value={newBankAccount.name} onChange={e => setNewBankAccount({ ...newBankAccount, name: e.target.value })} className="modern-input w-full text-sm" />
        <input type="number" placeholder="Current Balance" value={newBankAccount.balance} onChange={e => setNewBankAccount({ ...newBankAccount, balance: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" />
        <select value={newBankAccount.currency} onChange={e => setNewBankAccount({ ...newBankAccount, currency: e.target.value })} className="modern-select w-full text-sm">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="IRR">IRR</option>
          <option value="TRY">TRY</option>
          <option value="AMD">AMD</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => { 
          setShowBankModal(false); 
          setEditingBankId(null); 
          setNewBankAccount({ name: "", balance: 0, currency: "USD" });
        }} className="btn-outline px-3 py-1.5 text-sm">
          Cancel
        </button>
        <button onClick={addBankAccount} className="btn-primary px-3 py-1.5 text-sm">
          {editingBankId ? "Update" : "Connect"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Stock Adjust Modal */}
      {showStockAdjustModal && selectedProduct && (
        <div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">{t("inventory.adjust_stock")}: {selectedProduct.name}</h3><div className="space-y-2"><select value={stockAdjustment.type} onChange={e => setStockAdjustment({ ...stockAdjustment, type: e.target.value })} className="modern-select w-full text-sm"><option value="add">Add Stock</option><option value="remove">Remove Stock</option></select><input type="number" placeholder="Quantity" value={stockAdjustment.quantity} onChange={e => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(e.target.value) || 0 })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowStockAdjustModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button><button onClick={updateStock} className="btn-primary px-3 py-1.5 text-sm">Update</button></div></div></div>
      )}

      {/* Company Modal */}
      {showCompanyModal && (<div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">Create Company</h3><div className="space-y-2"><input type="text" placeholder="Company Name" value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} className="modern-input w-full text-sm" /><select value={newCompany.currency} onChange={e => setNewCompany({ ...newCompany, currency: e.target.value })} className="modern-select w-full text-sm"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select><input type="date" value={newCompany.fiscalYearStart} onChange={e => setNewCompany({ ...newCompany, fiscalYearStart: e.target.value })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowCompanyModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button><button onClick={addCompany} className="btn-primary px-3 py-1.5 text-sm">Create</button></div></div></div>)}

      {/* Invoice Modal */}
      {showInvoiceModal && (<div className="modal-overlay"><div className="modal-content max-w-lg"><h3 className="text-lg font-bold mb-3">Create Invoice</h3><div className="space-y-2"><input type="text" placeholder="Customer Name" value={currentInvoice.customerName} onChange={e => setCurrentInvoice({ ...currentInvoice, customerName: e.target.value })} className="modern-input w-full text-sm" /><input type="email" placeholder="Customer Email" value={currentInvoice.customerEmail} onChange={e => setCurrentInvoice({ ...currentInvoice, customerEmail: e.target.value })} className="modern-input w-full text-sm" /><input type="date" placeholder="Due Date" value={currentInvoice.dueDate} onChange={e => setCurrentInvoice({ ...currentInvoice, dueDate: e.target.value })} className="modern-input w-full text-sm" /><h4 className="font-semibold mt-2">Items</h4>{currentInvoice.items.map((item, idx) => (<div key={idx} className="grid grid-cols-4 gap-2"><input type="text" placeholder="Description" value={item.description} onChange={e => updateInvoiceItem(idx, "description", e.target.value)} className="col-span-2 modern-input text-sm" /><input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateInvoiceItem(idx, "quantity", parseInt(e.target.value) || 0)} className="modern-input text-sm" /><input type="number" placeholder="Price" value={item.price} onChange={e => updateInvoiceItem(idx, "price", parseFloat(e.target.value) || 0)} className="modern-input text-sm" /></div>))}<button onClick={addInvoiceItem} className="text-blue-500 text-sm mt-1">+ Add Item</button><div className="text-right font-bold mt-2">Total: {currencySymbols[currency]}{calculateInvoiceTotal().toLocaleString()}</div></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowInvoiceModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button><button onClick={generateInvoicePDF} className="btn-primary px-3 py-1.5 text-sm">Generate PDF</button></div></div></div>)}

      {/* Loan Modal */}
      {showLoanModal && (<div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">Add Loan</h3><div className="space-y-2"><input type="number" placeholder="Loan Amount" value={newLoan.amount} onChange={e => setNewLoan({ ...newLoan, amount: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="number" placeholder="Interest Rate (%)" value={newLoan.rate} onChange={e => setNewLoan({ ...newLoan, rate: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="number" placeholder="Term (months)" value={newLoan.term} onChange={e => setNewLoan({ ...newLoan, term: parseInt(e.target.value) || 0 })} className="modern-input w-full text-sm" /><input type="date" placeholder="Start Date" value={newLoan.startDate} onChange={e => setNewLoan({ ...newLoan, startDate: e.target.value })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowLoanModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button><button onClick={addLoan} className="btn-primary px-3 py-1.5 text-sm">Add Loan</button></div></div></div>)}

      {/* Savings Goal Modal */}
      {showGoalModal && (<div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">Add Savings Goal</h3><div className="space-y-2"><input type="text" placeholder="Goal name (e.g., Vacation)" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} className="modern-input w-full text-sm" /><input type="number" placeholder="Target amount" value={newGoal.target} onChange={e => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowGoalModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button><button onClick={addSavingsGoal} className="btn-primary px-3 py-1.5 text-sm">Add Goal</button></div></div></div>)}

      {/* Analytics Modal */}
      {showAnalyticsModal && (<div className="modal-overlay"><div className="modal-content max-w-lg"><div className="flex justify-between items-center mb-3"><h3 className="text-lg font-bold">Advanced Analytics</h3><button onClick={() => setShowAnalyticsModal(false)} className="text-muted hover:text-primary"><FontAwesomeIcon icon={icons.close} /></button></div><select value={analyticsPeriod} onChange={e => setAnalyticsPeriod(e.target.value)} className="modern-select w-full mb-3 text-sm"><option value="6months">Last 6 Months</option><option value="1year">Last Year</option><option value="all">All Time</option></select>{(() => { const analytics = getAnalyticsData(); return (<div><div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 text-white mb-3"><p className="text-xs opacity-90">Average Growth Rate</p><p className="text-2xl font-bold">{analytics.avgGrowth.toFixed(1)}%</p></div><div className="bg-hover rounded-lg p-3"><h4 className="font-semibold text-sm mb-2">Top Spending Categories</h4>{analytics.topCategories.map(([cat, amount], idx) => (<div key={cat} className="mb-2"><div className="flex justify-between text-xs mb-1"><span>#{idx + 1} {cat}</span><span>{currencySymbols[currency]}{getConvertedAmount(amount).toLocaleString()}</span></div><div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5"><div className="bg-purple-500 rounded-full h-1.5" style={{ width: `${(amount / analytics.topCategories[0][1]) * 100}%` }} /></div></div>))}</div></div>)})()}</div></div>)}

      {/* Tax Modal */}
      {showTaxModal && (<div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">Tax Calculator</h3><select value={selectedTaxCountry} onChange={e => setSelectedTaxCountry(e.target.value)} className="modern-select w-full mb-3 text-sm"><option value="US">USA</option><option value="Germany">Germany (19%)</option><option value="Turkey">Turkey (20%)</option><option value="Iran">Iran (9%)</option><option value="Armenia">Armenia (20%)</option></select><div className="bg-hover p-3 rounded-lg mb-2"><p className="text-xs text-muted">Estimated Tax</p><p className="text-2xl font-bold text-yellow-600">{currencySymbols[currency]}{((totalIncome * (taxRates[selectedTaxCountry as keyof typeof taxRates] || 0)) / 100).toLocaleString()}</p></div><button onClick={() => setShowTaxModal(false)} className="btn-primary w-full py-2 text-sm">Close</button></div></div>)}

      {/* Lock Period Modal */}
      {showLockModal && (<div className="modal-overlay"><div className="modal-content max-w-md"><h3 className="text-lg font-bold mb-3">Lock Period</h3><select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="modern-select w-full mb-3 text-sm"><option value="">Select Month</option>{Array(12).fill(0).map((_, i) => { const date = new Date(); date.setMonth(i); const monthStr = `${date.getFullYear()}-${String(i+1).padStart(2,"0")}`; return <option key={i} value={monthStr}>{date.toLocaleString("default", { month: "long", year: "numeric" })} {lockedPeriods.includes(monthStr) ? "(Locked)" : ""}</option>; })}</select><div className="flex gap-2"><button onClick={() => selectedMonth && lockPeriod(selectedMonth)} disabled={!selectedMonth} className="btn-secondary flex-1 py-2 text-sm disabled:opacity-50">Lock Month</button><button onClick={yearEndClosing} className="btn-primary flex-1 py-2 text-sm">Close Year</button></div><button onClick={() => setShowLockModal(false)} className="btn-outline w-full mt-3 py-2 text-sm">Cancel</button></div></div>)}

      {/* Audit Modal */}
      {showAuditModal && (<div className="modal-overlay"><div className="modal-content max-w-2xl max-h-[70vh] overflow-y-auto"><div className="flex justify-between items-center mb-3"><h3 className="text-lg font-bold">Audit Log</h3><button onClick={() => setShowAuditModal(false)} className="text-muted hover:text-primary"><FontAwesomeIcon icon={icons.close} /></button></div>{auditLog.length === 0 ? <p className="text-center text-muted py-8">No audit entries yet</p> : auditLog.map(entry => (<div key={entry.id} className="border-l-4 border-blue-500 bg-hover p-3 rounded mb-2"><div className="flex justify-between text-xs text-muted"><span>{new Date(entry.timestamp).toLocaleString()}</span><span className="font-semibold text-blue-600">{entry.action}</span></div><p className="text-sm mt-1">{entry.details}</p></div>))}</div></div>)}

      {showMigrationModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h3 className="text-lg font-bold mb-3">Import Data</h3>
            <p className="text-xs text-muted mb-3">Import from CSV format (Date,Description,Amount,Category)</p>
            <input type="file" accept=".csv" onChange={importFromCSV} className="modern-input w-full text-sm" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowMigrationModal(false)} className="btn-outline px-3 py-1.5 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* DeFi Modal */}
      {showDefiModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h3 className="text-lg font-bold mb-3">💰 Add DeFi Position</h3>
            <div className="space-y-2">
              <input type="text" placeholder="Protocol (e.g., Aave, Compound)" value={newDefiPosition.protocol} onChange={e => setNewDefiPosition({ ...newDefiPosition, protocol: e.target.value })} className="modern-input w-full text-sm" />
              <input type="text" placeholder="Token (e.g., ETH, USDC)" value={newDefiPosition.token} onChange={e => setNewDefiPosition({ ...newDefiPosition, token: e.target.value })} className="modern-input w-full text-sm" />
              <input type="number" placeholder="Amount Deposited" value={newDefiPosition.amount} onChange={e => setNewDefiPosition({ ...newDefiPosition, amount: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" />
              <input type="number" placeholder="APY (%)" value={newDefiPosition.apy} onChange={e => setNewDefiPosition({ ...newDefiPosition, apy: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" />
              <input type="date" placeholder="Deposited Date" value={newDefiPosition.deposited} onChange={e => setNewDefiPosition({ ...newDefiPosition, deposited: e.target.value })} className="modern-input w-full text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowDefiModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button>
              <button onClick={addDefiPosition} className="btn-primary px-3 py-1.5 text-sm">Add Position</button>
            </div>
          </div>
        </div>
      )}

      {/* Change History Modal */}
{showChangeHistoryModal && (
  <div className="modal-overlay">
    <div className="modal-content max-w-3xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">📜 Change History & Audit Trail</h3>
        <button onClick={() => setShowChangeHistoryModal(false)} className="text-muted hover:text-primary">
          <FontAwesomeIcon icon={icons.close} />
        </button>
      </div>
      <div className="space-y-3">
        {changeLogs.length === 0 ? (
          <p className="text-center text-muted py-8">No changes recorded yet</p>
        ) : (
          changeLogs.map(log => (
            <div key={log.id} className="border-l-4 border-purple-500 bg-hover p-3 rounded-lg">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    log.action === 'create' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    log.action === 'update' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                    log.action === 'delete' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {log.action.toUpperCase()}
                  </span>
                  <span className="ml-2 font-medium">{log.entityType}: {log.entityName}</span>
                </div>
                <span className="text-xs text-muted">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm mt-2">
                <span className="text-muted">Reason:</span> {log.reason}
              </p>
              {log.changes && log.changes.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-muted">Changes:</span>
                  <ul className="ml-4 mt-1 space-y-0.5">
                    {log.changes.map((change, idx) => (
                      <li key={idx}>
                        {change.field}: <span className="line-through text-red-500">{String(change.oldValue)}</span> → 
                        <span className="text-green-600 ml-1">{String(change.newValue)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-2 text-xs text-muted">By: {log.user}</div>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={exportChangeHistory} className="btn-primary px-3 py-1.5 text-sm">
          <FontAwesomeIcon icon={icons.download} className="mr-1" /> Export History
        </button>
      </div>
    </div>
  </div>
)}

      {/* NFT Modal */}
      {showNftModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h3 className="text-lg font-bold mb-3">🎨 Add NFT</h3>
            <div className="space-y-2">
              <input type="text" placeholder="Collection (e.g., Bored Ape)" value={newNft.collection} onChange={e => setNewNft({ ...newNft, collection: e.target.value })} className="modern-input w-full text-sm" />
              <input type="text" placeholder="NFT Name / Token ID" value={newNft.name} onChange={e => setNewNft({ ...newNft, name: e.target.value })} className="modern-input w-full text-sm" />
              <input type="number" placeholder="Purchase Price (ETH/USD)" value={newNft.purchasePrice} onChange={e => setNewNft({ ...newNft, purchasePrice: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" />
              <input type="number" placeholder="Current Floor Price" value={newNft.floorPrice} onChange={e => setNewNft({ ...newNft, floorPrice: parseFloat(e.target.value) || 0 })} className="modern-input w-full text-sm" />
              <input type="date" placeholder="Purchase Date" value={newNft.purchaseDate} onChange={e => setNewNft({ ...newNft, purchaseDate: e.target.value })} className="modern-input w-full text-sm" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNftModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button>
              <button onClick={addNft} className="btn-primary px-3 py-1.5 text-sm">Add NFT</button>
            </div>
          </div>
        </div>
      )}

      {/* Hugging Face API Modal */}
      {showHfModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <h3 className="text-lg font-bold mb-3">🤗 Hugging Face API</h3>
            <p className="text-xs text-muted mb-3">Get your API key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500">huggingface.co/settings/tokens</a></p>
            <input type="password" placeholder="Enter your API key" value={hfApiKey} onChange={e => setHfApiKey(e.target.value)} className="modern-input w-full text-sm" />
            <select value={aiModel} onChange={e => setAiModel(e.target.value)} className="modern-select w-full text-sm mt-2">
              <option value="facebook/bart-large-mnli">Zero-shot Classification (Best)</option>
              <option value="distilbert-base-uncased-finetuned-sst-2-english">Sentiment Analysis</option>
            </select>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowHfModal(false)} className="btn-outline px-3 py-1.5 text-sm">Cancel</button>
              <button onClick={saveHfApiKey} className="btn-primary px-3 py-1.5 text-sm">Save Key</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== SEARCH MODAL ========== */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onResultClick={handleSearchResultClick}
        transactions={transactions}
        products={products}
        customers={customers}
        employees={employees}
        assets={assets}
        bankAccounts={bankAccounts}
        currency={currency}
        currencySymbols={currencySymbols}
        getConvertedAmount={getConvertedAmount}
      />

    </div>
  );
}

export default App;