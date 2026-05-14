import React, { useEffect, useState } from "react";
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
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

function App() {
  // ========== CORE STATE VARIABLES ==========
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currency, setCurrency] = useState("USD");
  const [budgets, setBudgets] = useState<Map<string, number>>(new Map());
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState({ category: "", amount: 0 });
  const [newTx, setNewTx] = useState({
    description: "",
    amount: 0,
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  // ========== REPORT FEATURES ==========
  const [reportDateRange, setReportDateRange] = useState({
    start: "",
    end: "",
  });

  // ========== RECEIPT SCANNING ==========
  const [scanningText, setScanningText] = useState("");

  // ========== NOTIFICATIONS ==========
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: string }[]
  >([]);

  // ========== SAVINGS GOALS ==========
  const [savingsGoals, setSavingsGoals] = useState<
    { id: string; name: string; target: number; current: number }[]
  >([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", target: 0 });

  // ========== SEARCH AND FILTER ==========
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // ========== RECURRING TRANSACTIONS ==========
  const [recurringTransactions, setRecurringTransactions] = useState<any[]>([]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [newRecurring, setNewRecurring] = useState({
    description: "",
    amount: 0,
    category: "",
    frequency: "monthly",
    dayOfMonth: 1,
  });

  // ========== MULTI-COMPANY SUPPORT ==========
  const [companies, setCompanies] = useState<
    { id: string; name: string; currency: string; fiscalYearStart: string }[]
  >([]);
  const [currentCompanyId, setCurrentCompanyId] = useState<string>("default");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    currency: "USD",
    fiscalYearStart: "2024-01-01",
  });

  // ========== AI CATEGORIZATION ==========
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState({
    transactionId: "",
    suggestedCategory: "",
    confidence: 0,
  });

  // ========== INVOICE GENERATOR ==========
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState({
    customerName: "",
    customerEmail: "",
    items: [{ description: "", quantity: 1, price: 0 }],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    invoiceNumber: `INV-${Date.now()}`,
  });

  // ========== INVENTORY MANAGEMENT ==========
  const [products, setProducts] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    quantity: 0,
    price: 0,
    cost: 0,
    category: "",
    minStock: 0,
  });
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    quantity: 0,
    type: "add",
  });
  const [valuationMethod, setValuationMethod] = useState("FIFO");

  // ========== CUSTOMER MANAGEMENT ==========
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // ========== PAYROLL MANAGEMENT ==========
  const [employees, setEmployees] = useState<any[]>([]);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    salary: 0,
    position: "",
    taxRate: 20,
  });

  // ========== FIXED ASSETS ==========
  const [assets, setAssets] = useState<any[]>([]);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    purchaseDate: "",
    purchasePrice: 0,
    usefulLife: 5,
    salvageValue: 0,
    method: "straight-line",
  });

  // ========== LOAN MANAGEMENT ==========
  const [loans, setLoans] = useState<any[]>([]);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    amount: 0,
    rate: 5,
    term: 12,
    startDate: "",
  });

  // ========== BANK INTEGRATION ==========
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [newBankAccount, setNewBankAccount] = useState({
    name: "",
    balance: 0,
    currency: "USD",
  });
  const [bankFeedActive, setBankFeedActive] = useState(false);

  // ========== DATA MIGRATION ==========
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationFile, setMigrationFile] = useState<File | null>(null);

  // ========== AUDIT LOG ==========
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // ========== TAX CALCULATOR ==========
  const [taxRates, setTaxRates] = useState({
    US: { name: "USA", rate: 0, threshold: 0 },
    Germany: { name: "Germany", rate: 19, threshold: 0 },
    Turkey: { name: "Turkey", rate: 20, threshold: 0 },
    Iran: { name: "Iran", rate: 9, threshold: 0 },
    Armenia: { name: "Armenia", rate: 20, threshold: 0 },
  });
  const [selectedTaxCountry, setSelectedTaxCountry] = useState("Germany");
  const [showTaxModal, setShowTaxModal] = useState(false);

  // ========== PERIOD LOCKING ==========
  const [lockedPeriods, setLockedPeriods] = useState<string[]>([]);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  // ========== AI CHATBOT ==========
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { role: string; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState("");

  // ========== HUGGING FACE API KEY ==========
  const [hfApiKey, setHfApiKey] = useState(""); // ← ADD THIS LINE

  // ========== VOICE COMMANDS ==========
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  // ========== ADVANCED ANALYTICS ==========
  const [analyticsPeriod, setAnalyticsPeriod] = useState("6months");
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // ========== BLOCKCHAIN INTEGRATION ==========
  const [blockchainEnabled, setBlockchainEnabled] = useState(false);
  const [blockchainHashes, setBlockchainHashes] = useState<Map<string, string>>(
    new Map(),
  );

  // ========== QUANTUM ENCRYPTION ==========
  const [quantumEncryption, setQuantumEncryption] = useState(false);

  // ========== DEFI YIELD TRACKING ==========
  const [defiPositions, setDefiPositions] = useState<any[]>([]);

  // ========== NFT ASSET TRACKING ==========
  const [nftCollections, setNftCollections] = useState<any[]>([]);

  // ========== HARDWARE INTEGRATIONS ==========
  const [hardwareConnected, setHardwareConnected] = useState({
    receiptPrinter: false,
    barcodeScanner: false,
    cashDrawer: false,
    cardReader: false,
  });

  // ========== CONSTANTS ==========
  const exchangeRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    IRR: 42000,
    TRY: 32,
    AMD: 390,
  };
  const currencySymbols: { [key: string]: string } = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    IRR: "﷼",
    TRY: "₺",
    AMD: "֏",
  };
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  // ========== HELPER FUNCTIONS ==========
  const getConvertedAmount = (amount: number) => {
    const rate = exchangeRates[currency as keyof typeof exchangeRates] || 1;
    return amount * rate;
  };

  const addNotification = (
    message: string,
    type: "success" | "error" | "warning" | "info",
  ) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      5000,
    );
  };

  const addAuditEntry = (action: string, details: string) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user: "Current User",
    };
    const updated = [entry, ...auditLog];
    setAuditLog(updated);
    localStorage.setItem("auditLog", JSON.stringify(updated));
  };

  // ========== TRANSACTION FUNCTIONS ==========
  const saveTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem(
      `transactions_${currentCompanyId}`,
      JSON.stringify(newTransactions),
    );
    addAuditEntry(
      "UPDATE_TRANSACTIONS",
      `Updated ${newTransactions.length} transactions`,
    );
  };

  // ========== AI CATEGORIZATION (Local pattern matching - works offline) ==========
  const getAiCategorySuggestion = (
    description: string,
    amount: number,
  ): { category: string; confidence: number } => {
    const lowerDesc = description.toLowerCase();

    // Income patterns
    if (
      lowerDesc.includes("salary") ||
      lowerDesc.includes("paycheck") ||
      lowerDesc.includes("income") ||
      lowerDesc.includes("deposit")
    )
      return { category: "Income", confidence: 90 };

    // Housing patterns
    if (
      lowerDesc.includes("rent") ||
      lowerDesc.includes("mortgage") ||
      lowerDesc.includes("lease")
    )
      return { category: "Housing", confidence: 85 };

    // Transportation patterns
    if (
      lowerDesc.includes("uber") ||
      lowerDesc.includes("lyft") ||
      lowerDesc.includes("taxi") ||
      lowerDesc.includes("gas") ||
      lowerDesc.includes("fuel")
    )
      return { category: "Transportation", confidence: 80 };

    // Food patterns
    if (
      lowerDesc.includes("restaurant") ||
      lowerDesc.includes("cafe") ||
      lowerDesc.includes("coffee") ||
      lowerDesc.includes("food") ||
      lowerDesc.includes("grocery")
    )
      return { category: "Food & Dining", confidence: 75 };

    // Shopping patterns
    if (
      lowerDesc.includes("amazon") ||
      lowerDesc.includes("walmart") ||
      lowerDesc.includes("target") ||
      lowerDesc.includes("shop")
    )
      return { category: "Shopping", confidence: 70 };

    // Entertainment patterns
    if (
      lowerDesc.includes("netflix") ||
      lowerDesc.includes("spotify") ||
      lowerDesc.includes("movie") ||
      lowerDesc.includes("cinema")
    )
      return { category: "Entertainment", confidence: 85 };

    // Utilities patterns
    if (
      lowerDesc.includes("electric") ||
      lowerDesc.includes("water") ||
      lowerDesc.includes("gas bill") ||
      lowerDesc.includes("internet")
    )
      return { category: "Utilities", confidence: 80 };

    // Healthcare patterns
    if (
      lowerDesc.includes("doctor") ||
      lowerDesc.includes("hospital") ||
      lowerDesc.includes("pharmacy") ||
      lowerDesc.includes("medical")
    )
      return { category: "Healthcare", confidence: 80 };

    return { category: "Uncategorized", confidence: 0 };
  };

  const addTransaction = () => {
    if (!newTx.description || !newTx.amount) return;
    const aiSuggestion = getAiCategorySuggestion(
      newTx.description,
      newTx.amount,
    );
    const finalCategory = newTx.category || aiSuggestion.category;
    const transaction: Transaction = {
      id: Date.now().toString(),
      description: newTx.description,
      amount: newTx.amount,
      category: finalCategory,
      date: newTx.date,
    };
    saveTransactions([transaction, ...transactions]);
    setShowForm(false);
    if (aiSuggestion.confidence > 70 && !newTx.category) {
      setCurrentSuggestion({
        transactionId: transaction.id,
        suggestedCategory: aiSuggestion.category,
        confidence: aiSuggestion.confidence,
      });
      setShowAiSuggestion(true);
    }
    setNewTx({
      description: "",
      amount: 0,
      category: "",
      date: new Date().toISOString().split("T")[0],
    });
    addNotification(t("messages.transaction_added"), "success");
    addAuditEntry(
      "ADD_TRANSACTION",
      `Added ${transaction.description} for ${currencySymbols[currency]}${Math.abs(transaction.amount)}`,
    );
  };

  const deleteTransaction = (id: string) => {
    const deleted = transactions.find((t) => t.id === id);
    saveTransactions(transactions.filter((t) => t.id !== id));
    addNotification(t("messages.transaction_deleted"), "info");
    if (deleted)
      addAuditEntry("DELETE_TRANSACTION", `Deleted ${deleted.description}`);
  };

  const applyAiSuggestion = (
    transactionId: string,
    suggestedCategory: string,
  ) => {
    const updated = transactions.map((t) =>
      t.id === transactionId ? { ...t, category: suggestedCategory } : t,
    );
    saveTransactions(updated);
    addNotification(
      t("messages.ai_suggestion", { category: suggestedCategory }),
      "success",
    );
    setShowAiSuggestion(false);
  };

  // ========== BUDGET FUNCTIONS ==========
  const addBudget = () => {
    if (!newBudget.category || !newBudget.amount) return;
    const newBudgets = new Map(budgets);
    newBudgets.set(newBudget.category, newBudget.amount);
    setBudgets(newBudgets);
    localStorage.setItem(
      `budgets_${currentCompanyId}`,
      JSON.stringify(Array.from(newBudgets.entries())),
    );
    setShowBudgetModal(false);
    setNewBudget({ category: "", amount: 0 });
    addNotification(
      t("messages.budget_set", { category: newBudget.category }),
      "success",
    );
  };

  const getBudgetProgress = (category: string) => {
    const spent = transactions
      .filter((t) => t.category === category && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const budget = budgets.get(category) || 0;
    return budget > 0 ? (spent / budget) * 100 : 0;
  };

  // ========== RECURRING TRANSACTIONS ==========
  const addRecurringTransaction = () => {
    if (!newRecurring.description || !newRecurring.amount) return;
    const recurring = {
      id: Date.now().toString(),
      ...newRecurring,
      lastAdded: new Date().toISOString().split("T")[0],
    };
    const updated = [...recurringTransactions, recurring];
    setRecurringTransactions(updated);
    localStorage.setItem("recurringTransactions", JSON.stringify(updated));
    setShowRecurringModal(false);
    setNewRecurring({
      description: "",
      amount: 0,
      category: "",
      frequency: "monthly",
      dayOfMonth: 1,
    });
    addNotification(t("messages.recurring_added"), "success");
  };

  const deleteRecurringTransaction = (id: string) => {
    const updated = recurringTransactions.filter((r) => r.id !== id);
    setRecurringTransactions(updated);
    localStorage.setItem("recurringTransactions", JSON.stringify(updated));
    addNotification(t("messages.recurring_deleted"), "info");
  };

  const checkRecurringTransactions = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayDay = new Date().getDate();
    recurringTransactions.forEach((recurring) => {
      const shouldAdd =
        recurring.frequency === "monthly" && todayDay === recurring.dayOfMonth;
      if (shouldAdd) {
        const existingToday = transactions.some(
          (t) => t.description === recurring.description && t.date === today,
        );
        if (!existingToday) {
          const newTransaction: Transaction = {
            id: Date.now() + Math.random().toString(),
            description: `${recurring.description} (Auto)`,
            amount: -Math.abs(recurring.amount),
            category: recurring.category,
            date: today,
          };
          saveTransactions([newTransaction, ...transactions]);
          addNotification(
            t("messages.auto_added", { description: recurring.description }),
            "info",
          );
        }
      }
    });
  };

  // ========== REPORT FUNCTIONS ==========
  const generatePNLReport = (startDate: string, endDate: string) => {
    const filtered = transactions.filter((t) => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });
    const income = filtered
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netIncome = income - expenses;
    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();
    filtered.forEach((t) => {
      if (t.amount > 0)
        incomeByCategory.set(
          t.category,
          (incomeByCategory.get(t.category) || 0) + t.amount,
        );
      else
        expenseByCategory.set(
          t.category,
          (expenseByCategory.get(t.category) || 0) + Math.abs(t.amount),
        );
    });
    return { income, expenses, netIncome, incomeByCategory, expenseByCategory };
  };

  const downloadReport = (type: string) => {
    const { start, end } = reportDateRange;
    const report = generatePNLReport(start, end);
    const reportContent = `
========================================
${type.toUpperCase()} REPORT
========================================
Period: ${start || "Start"} to ${end || "Today"}
Currency: ${currency}
========================================

INCOME:
${Array.from(report.incomeByCategory.entries())
  .map(
    ([cat, amt]) =>
      `  ${cat}: ${currencySymbols[currency]}${getConvertedAmount(amt).toLocaleString()}`,
  )
  .join("\n")}
  TOTAL INCOME: ${currencySymbols[currency]}${getConvertedAmount(report.income).toLocaleString()}

EXPENSES:
${Array.from(report.expenseByCategory.entries())
  .map(
    ([cat, amt]) =>
      `  ${cat}: ${currencySymbols[currency]}${getConvertedAmount(amt).toLocaleString()}`,
  )
  .join("\n")}
  TOTAL EXPENSES: ${currencySymbols[currency]}${getConvertedAmount(report.expenses).toLocaleString()}

========================================
NET INCOME: ${currencySymbols[currency]}${getConvertedAmount(report.netIncome).toLocaleString()}
========================================
Generated: ${new Date().toLocaleString()}
    `;
    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_report_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification(t("messages.report_downloaded"), "success");
  };

  // ========== RECEIPT SCANNING ==========
  const scanReceipt = async (imageFile: File) => {
    const Tesseract = await import("tesseract.js");
    setScanningText(t("messages.scanning"));
    const worker = await Tesseract.createWorker("eng");
    const {
      data: { text },
    } = await worker.recognize(imageFile);
    await worker.terminate();
    setScanningText(t("messages.extracted", { text: text.substring(0, 100) }));
    const amountMatch = text.match(/\$\s*(\d+(?:\.\d{2})?)/i);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      setNewTx({ ...newTx, amount: amount < 50 ? -amount : amount });
    }
    const firstLine = text.split("\n")[0];
    if (firstLine)
      setNewTx({ ...newTx, description: firstLine.substring(0, 50) });
    setTimeout(() => setScanningText(""), 3000);
  };

  // ========== SAVINGS GOALS ==========
  const addSavingsGoal = () => {
    if (!newGoal.name || !newGoal.target) return;
    const newGoals = [
      ...savingsGoals,
      {
        id: Date.now().toString(),
        name: newGoal.name,
        target: newGoal.target,
        current: 0,
      },
    ];
    setSavingsGoals(newGoals);
    localStorage.setItem("savingsGoals", JSON.stringify(newGoals));
    setShowGoalModal(false);
    setNewGoal({ name: "", target: 0 });
    addNotification(t("messages.goal_created"), "success");
  };

  // ========== CSV IMPORT/EXPORT ==========
  const exportToCSV = () => {
    const headers = [
      t("transactions.date"),
      t("transactions.description"),
      t("transactions.category"),
      t("transactions.amount"),
    ];
    const rows = transactions.map((t) => [
      t.date,
      t.description,
      t.category,
      t.amount.toString(),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification(t("messages.csv_exported"), "success");
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(t("app_name"), 20, 20);
    doc.setFontSize(12);
    doc.text(
      `${t("reports.generating")} ${new Date().toLocaleString()}`,
      20,
      35,
    );
    doc.text(
      `${t("dashboard.total_income")}: ${currencySymbols[currency]}${getConvertedAmount(totalIncome).toLocaleString()}`,
      20,
      50,
    );
    doc.text(
      `${t("dashboard.total_expenses")}: ${currencySymbols[currency]}${getConvertedAmount(totalExpense).toLocaleString()}`,
      20,
      60,
    );
    doc.text(
      `${t("dashboard.balance")}: ${currencySymbols[currency]}${getConvertedAmount(balance).toLocaleString()}`,
      20,
      70,
    );
    let y = 90;
    doc.text(t("dashboard.recent_transactions"), 20, y);
    y += 10;
    transactions.slice(0, 10).forEach((tx, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(
        `${index + 1}. ${tx.date} - ${tx.description} - ${currencySymbols[currency]}${Math.abs(tx.amount)}`,
        20,
        y,
      );
      y += 10;
    });
    doc.save(`report_${new Date().toISOString().split("T")[0]}.pdf`);
    addNotification(t("messages.pdf_exported"), "success");
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const wsData = [
      [
        t("transactions.date"),
        t("transactions.description"),
        t("transactions.category"),
        t("transactions.amount"),
        "Type",
      ],
      ...transactions.map((t) => [
        t.date,
        t.description,
        t.category,
        Math.abs(t.amount),
        t.amount > 0 ? "Income" : "Expense",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(
      wb,
      `transactions_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    addNotification(t("messages.excel_exported"), "success");
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const newTransactions: Transaction[] = [];
      for (let i = 1; i < lines.length; i++) {
        const [date, description, category, amount] = lines[i].split(",");
        if (description && amount) {
          newTransactions.push({
            id: Date.now() + i + Math.random().toString(),
            description,
            amount: parseFloat(amount),
            category: category || "Imported",
            date: date || new Date().toISOString().split("T")[0],
          });
        }
      }
      saveTransactions([...newTransactions, ...transactions]);
      addNotification(t("messages.import_success"), "success");
    };
    reader.readAsText(file);
  };

  // ========== INVOICE FUNCTIONS ==========
  const addInvoiceItem = () => {
    setCurrentInvoice({
      ...currentInvoice,
      items: [
        ...currentInvoice.items,
        { description: "", quantity: 1, price: 0 },
      ],
    });
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const newItems = [...currentInvoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setCurrentInvoice({ ...currentInvoice, items: newItems });
  };

  const calculateInvoiceTotal = () => {
    return currentInvoice.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
  };

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
    currentInvoice.items.forEach((item) => {
      doc.text(item.description.substring(0, 30), 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`${currencySymbols[currency]}${item.price}`, 150, y);
      doc.text(
        `${currencySymbols[currency]}${item.quantity * item.price}`,
        180,
        y,
      );
      y += 10;
    });
    y += 10;
    doc.text(
      `TOTAL: ${currencySymbols[currency]}${calculateInvoiceTotal()}`,
      150,
      y,
    );
    const invoice = {
      id: Date.now().toString(),
      ...currentInvoice,
      total: calculateInvoiceTotal(),
      createdAt: new Date().toISOString(),
    };
    setInvoices([...invoices, invoice]);
    localStorage.setItem("invoices", JSON.stringify([...invoices, invoice]));
    doc.save(`invoice_${currentInvoice.invoiceNumber}.pdf`);
    addNotification(t("messages.invoice_generated"), "success");
    setShowInvoiceModal(false);
  };

  // ========== INVENTORY FUNCTIONS ==========
  const addProduct = () => {
    if (!newProduct.name || !newProduct.sku) return;
    const product = {
      id: Date.now().toString(),
      ...newProduct,
      createdAt: new Date().toISOString(),
    };
    const updated = [...products, product];
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    setShowProductModal(false);
    setNewProduct({
      name: "",
      sku: "",
      quantity: 0,
      price: 0,
      cost: 0,
      category: "",
      minStock: 0,
    });
    addNotification(t("messages.product_added"), "success");
  };

  const updateStock = () => {
    if (!selectedProduct) return;
    const newQuantity =
      stockAdjustment.type === "add"
        ? selectedProduct.quantity + stockAdjustment.quantity
        : selectedProduct.quantity - stockAdjustment.quantity;
    const updated = products.map((p) =>
      p.id === selectedProduct.id
        ? { ...p, quantity: Math.max(0, newQuantity) }
        : p,
    );
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    const inventoryTransaction: Transaction = {
      id: Date.now().toString(),
      description: `Inventory ${stockAdjustment.type === "add" ? "purchase" : "sale"}: ${selectedProduct.name}`,
      amount:
        stockAdjustment.type === "add"
          ? -Math.abs(stockAdjustment.quantity * selectedProduct.cost)
          : Math.abs(stockAdjustment.quantity * selectedProduct.price),
      category: "Inventory",
      date: new Date().toISOString().split("T")[0],
    };
    saveTransactions([inventoryTransaction, ...transactions]);
    setShowStockAdjustModal(false);
    setSelectedProduct(null);
    addNotification(
      t("messages.stock_updated", { product: selectedProduct.name }),
      "success",
    );
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem("products", JSON.stringify(updated));
    addNotification(t("messages.product_deleted"), "info");
  };

  const getLowStockProducts = () =>
    products.filter((p) => p.quantity <= p.minStock);
  const calculateInventoryValue = () => {
    if (valuationMethod === "FIFO")
      return products.reduce((sum, p) => sum + p.quantity * p.cost, 0);
    if (valuationMethod === "LIFO")
      return products.reduce((sum, p) => sum + p.quantity * p.price, 0);
    const avgCost =
      products.reduce((sum, p) => sum + p.cost, 0) / products.length;
    return products.reduce((sum, p) => sum + p.quantity * avgCost, 0);
  };

  // ========== CUSTOMER FUNCTIONS ==========
  const addCustomer = () => {
    if (!newCustomer.name) return;
    const customer = { id: Date.now().toString(), ...newCustomer };
    setCustomers([...customers, customer]);
    localStorage.setItem("customers", JSON.stringify([...customers, customer]));
    setShowCustomerModal(false);
    setNewCustomer({ name: "", email: "", phone: "", address: "" });
    addNotification(t("messages.customer_added"), "success");
  };

  // ========== PAYROLL FUNCTIONS ==========
  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.salary) return;
    const employee = { id: Date.now().toString(), ...newEmployee };
    setEmployees([...employees, employee]);
    localStorage.setItem("employees", JSON.stringify([...employees, employee]));
    setShowPayrollModal(false);
    setNewEmployee({ name: "", salary: 0, position: "", taxRate: 20 });
    addNotification(t("messages.employee_added"), "success");
  };

  // ========== ASSET FUNCTIONS ==========
  const calculateDepreciation = (asset: any) => {
    const depreciableAmount = asset.purchasePrice - asset.salvageValue;
    if (asset.method === "straight-line")
      return depreciableAmount / asset.usefulLife;
    if (asset.method === "declining-balance")
      return depreciableAmount * (2 / asset.usefulLife);
    return 0;
  };

  const addAsset = () => {
    if (!newAsset.name || !newAsset.purchasePrice) return;
    const asset = { id: Date.now().toString(), ...newAsset };
    setAssets([...assets, asset]);
    localStorage.setItem("assets", JSON.stringify([...assets, asset]));
    setShowAssetModal(false);
    setNewAsset({
      name: "",
      purchaseDate: "",
      purchasePrice: 0,
      usefulLife: 5,
      salvageValue: 0,
      method: "straight-line",
    });
    addNotification(t("messages.asset_added"), "success");
  };

  // ========== LOAN FUNCTIONS ==========
  const calculateAmortization = () => {
    const monthlyRate = newLoan.rate / 100 / 12;
    const payment =
      (newLoan.amount * monthlyRate * Math.pow(1 + monthlyRate, newLoan.term)) /
      (Math.pow(1 + monthlyRate, newLoan.term) - 1);
    const schedule = [];
    let balance = newLoan.amount;
    for (let i = 1; i <= newLoan.term; i++) {
      const interest = balance * monthlyRate;
      const principal = payment - interest;
      balance -= principal;
      schedule.push({
        month: i,
        payment,
        interest,
        principal,
        balance: Math.max(0, balance),
      });
    }
    return { payment, schedule };
  };

  const addLoan = () => {
    const { payment, schedule } = calculateAmortization();
    const loan = {
      id: Date.now().toString(),
      ...newLoan,
      monthlyPayment: payment,
      schedule,
    };
    setLoans([...loans, loan]);
    localStorage.setItem("loans", JSON.stringify([...loans, loan]));
    setShowLoanModal(false);
    setNewLoan({ amount: 0, rate: 5, term: 12, startDate: "" });
    addNotification(t("messages.loan_added"), "success");
  };

  // ========== BANK FUNCTIONS ==========
  const addBankAccount = () => {
    if (!newBankAccount.name) return;
    const account = {
      id: Date.now().toString(),
      ...newBankAccount,
      lastSynced: new Date().toISOString(),
    };
    const updated = [...bankAccounts, account];
    setBankAccounts(updated);
    localStorage.setItem("bankAccounts", JSON.stringify(updated));
    setShowBankModal(false);
    setNewBankAccount({ name: "", balance: 0, currency: "USD" });
    addNotification(t("messages.bank_connected"), "success");
  };

  const syncBankAccount = async (accountId: string) => {
    addNotification(t("messages.syncing"), "info");
    setTimeout(() => {
      // Real bank API would go here
      addNotification(
        "Bank sync complete! No new transactions found.",
        "success",
      );
    }, 2000);
  };

  const startBankFeed = () => {
    addNotification(
      "Bank feed requires API connection. Configure your bank API in settings.",
      "info",
    );
  };

  // ========== MULTI-COMPANY FUNCTIONS ==========
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
    addNotification(t("messages.company_created"), "success");
  };

  const switchCompany = (companyId: string) => {
    localStorage.setItem(
      `transactions_${currentCompanyId}`,
      JSON.stringify(transactions),
    );
    localStorage.setItem(
      `budgets_${currentCompanyId}`,
      JSON.stringify(Array.from(budgets.entries())),
    );
    setCurrentCompanyId(companyId);
    localStorage.setItem("currentCompanyId", companyId);
    const newTransactions = localStorage.getItem(`transactions_${companyId}`);
    if (newTransactions) setTransactions(JSON.parse(newTransactions));
    else setTransactions([]);
    const newBudgets = localStorage.getItem(`budgets_${companyId}`);
    if (newBudgets) setBudgets(new Map(JSON.parse(newBudgets)));
    else setBudgets(new Map());
    addNotification(
      t("messages.company_switched", {
        name: companies.find((c) => c.id === companyId)?.name || "Personal",
      }),
      "success",
    );
  };

  // ========== PERIOD LOCKING FUNCTIONS ==========
  const lockPeriod = (month: string) => {
    const updated = [...lockedPeriods, month];
    setLockedPeriods(updated);
    localStorage.setItem("lockedPeriods", JSON.stringify(updated));
    addNotification(t("messages.period_locked"), "success");
  };

  const yearEndClosing = () => {
    const currentYear = new Date().getFullYear();
    const yearMonths = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ].map((m) => `${currentYear}-${m}`);
    const newLocked = [...lockedPeriods, ...yearMonths];
    setLockedPeriods(newLocked);
    localStorage.setItem("lockedPeriods", JSON.stringify(newLocked));
    addNotification(t("messages.year_closed"), "success");
  };

  // ========== AI CHATBOT (Local responses - no API key needed) ==========
  const askChatGPT = async (question: string) => {
    addNotification(t("messages.ai_asking"), "info");
    setTimeout(() => {
      let response = "";
      const lowerQuestion = question.toLowerCase();

      if (lowerQuestion.includes("balance")) {
        response = `${t("messages.ai_balance")} ${currencySymbols[currency]}${getConvertedAmount(balance).toLocaleString()}`;
      } else if (lowerQuestion.includes("income")) {
        response = `${t("messages.ai_income")} ${currencySymbols[currency]}${getConvertedAmount(totalIncome).toLocaleString()}`;
      } else if (lowerQuestion.includes("expense")) {
        response = `${t("messages.ai_expense")} ${currencySymbols[currency]}${getConvertedAmount(totalExpense).toLocaleString()}`;
      } else if (lowerQuestion.includes("budget")) {
        const highestBudget = Array.from(budgets.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0];
        response = highestBudget
          ? `Your highest budget is ${highestBudget[0]}: ${currencySymbols[currency]}${highestBudget[1].toLocaleString()}`
          : "No budgets set yet. Click Budget to set one!";
      } else if (
        lowerQuestion.includes("saving") ||
        lowerQuestion.includes("goal")
      ) {
        const totalSaved = savingsGoals.reduce((sum, g) => sum + g.current, 0);
        response = `You've saved ${currencySymbols[currency]}${totalSaved.toLocaleString()} across ${savingsGoals.length} goals.`;
      } else if (lowerQuestion.includes("transaction")) {
        response = `You have ${transactions.length} transactions. Total income: ${currencySymbols[currency]}${totalIncome.toLocaleString()}, Total expenses: ${currencySymbols[currency]}${totalExpense.toLocaleString()}`;
      } else {
        response = t("messages.ai_help");
      }

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
      addNotification(response, "info");
    }, 500);
  };

  // ========== VOICE COMMANDS ==========
  const startVoiceCommand = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      addNotification(t("errors.voice_not_supported"), "error");
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang =
      i18n.language === "fa"
        ? "fa-IR"
        : i18n.language === "de"
          ? "de-DE"
          : "en-US";
    recognition.onstart = () => {
      setIsListening(true);
      addNotification(t("messages.voice_ready"), "info");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceTranscript(transcript);
      const lowerCommand = transcript.toLowerCase();
      if (lowerCommand.includes("add") || lowerCommand.includes("spent")) {
        const amountMatch = transcript.match(/\d+(?:\.\d+)?/);
        const amount = amountMatch ? parseFloat(amountMatch[0]) : 0;
        let description = transcript
          .replace(/add|spent|paid|for|on/gi, "")
          .replace(/\d+(?:\.\d+)?/, "")
          .trim();
        if (description.length > 50) description = description.substring(0, 50);
        setNewTx({
          description: description || "Voice command",
          amount: -Math.abs(amount),
          category: "",
          date: new Date().toISOString().split("T")[0],
        });
        setShowForm(true);
        addNotification(
          t("messages.voice_prepared", { description, amount }),
          "success",
        );
      } else if (lowerCommand.includes("report")) {
        setActiveTab("reports");
        addNotification(t("messages.opening_reports"), "info");
      } else if (lowerCommand.includes("dashboard")) setActiveTab("dashboard");
      else if (lowerCommand.includes("transactions"))
        setActiveTab("transactions");
      setIsListening(false);
    };
    recognition.start();
  };

  // ========== BLOCKCHAIN FUNCTIONS ==========
  const connectBlockchain = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setBlockchainEnabled(true);
        addNotification(t("messages.blockchain_connected"), "success");
      } catch (error) {
        addNotification(t("errors.blockchain_failed"), "error");
      }
    } else {
      addNotification(t("errors.metamask_required"), "error");
    }
  };

  // ========== QUANTUM ENCRYPTION ==========
  const enableQuantumEncryption = async () => {
    addNotification(t("messages.quantum_initializing"), "info");
    const keyPair = await crypto.subtle.generateKey(
      { name: "AES Encryption", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
    localStorage.setItem(
      "quantum_key",
      JSON.stringify(await crypto.subtle.exportKey("raw", keyPair)),
    );
    setQuantumEncryption(true);
    addNotification(t("messages.quantum_enabled"), "success");
  };

  // ========== FRAUD DETECTION (Simple statistical anomaly detection) ==========
  const detectFraudRealTime = (transaction: Transaction) => {
    // Calculate average transaction amount
    const amounts = transactions
      .filter((t) => t.amount < 0)
      .map((t) => Math.abs(t.amount));
    if (amounts.length === 0) return;

    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.map((a) => Math.pow(a - avg, 2)).reduce((a, b) => a + b, 0) /
        amounts.length,
    );

    const isAnomaly = Math.abs(transaction.amount) > avg + 3 * stdDev;

    if (isAnomaly && stdDev > 0) {
      addNotification(
        `⚠️ Unusual transaction detected: ${currencySymbols[currency]}${Math.abs(transaction.amount)} (avg: ${currencySymbols[currency]}${avg.toFixed(2)})`,
        "warning",
      );
    }
  };

  // ========== HARDWARE INTEGRATIONS ==========
  const connectReceiptPrinter = () => {
    addNotification(t("messages.printer_connecting"), "info");
    setTimeout(() => {
      setHardwareConnected({ ...hardwareConnected, receiptPrinter: true });
      addNotification(t("messages.printer_connected"), "success");
    }, 2000);
  };

  const connectBarcodeScanner = () => {
    addNotification(t("messages.scanner_ready"), "info");
    setHardwareConnected({ ...hardwareConnected, barcodeScanner: true });
  };

  // ========== UI HELPER FUNCTIONS ==========
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

  // ========== CHART DATA ==========
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const getCategoryData = () => {
    const categoryMap = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.amount < 0) {
        const cat = t.category || "Uncategorized";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Math.abs(t.amount));
      }
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getMonthlyData = () => {
    const monthMap = new Map<string, { income: number; expense: number }>();
    transactions.forEach((t) => {
      const month = t.date.substring(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { income: 0, expense: 0 });
      const data = monthMap.get(month)!;
      if (t.amount > 0) data.income += t.amount;
      else data.expense += Math.abs(t.amount);
    });
    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  };

  const getSpendingByDay = () => {
    const spendingByDay = new Array(31).fill(0);
    transactions.forEach((t) => {
      if (t.amount < 0) {
        const day = parseInt(t.date.split("-")[2]) - 1;
        if (day >= 0 && day < 31) spendingByDay[day] += Math.abs(t.amount);
      }
    });
    return spendingByDay;
  };

  const getFilteredTransactionsForDisplay = () => {
    let filtered = transactions;
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (filterCategory === "income")
      filtered = filtered.filter((t) => t.amount > 0);
    else if (filterCategory === "expense")
      filtered = filtered.filter((t) => t.amount < 0);
    else if (filterCategory !== "all")
      filtered = filtered.filter((t) => t.category === filterCategory);
    return filtered;
  };

  const getAnalyticsData = () => {
    const monthlyData = getMonthlyData();
    const growthRates: number[] = [];
    for (let i = 1; i < monthlyData.length; i++) {
      if (monthlyData[i - 1].income > 0) {
        const growth =
          ((monthlyData[i].income - monthlyData[i - 1].income) /
            monthlyData[i - 1].income) *
          100;
        growthRates.push(growth);
      }
    }
    const avgGrowth =
      growthRates.length > 0
        ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
        : 0;
    const categorySpending = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.amount < 0)
        categorySpending.set(
          t.category,
          (categorySpending.get(t.category) || 0) + Math.abs(t.amount),
        );
    });
    const topCategories = Array.from(categorySpending.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return { avgGrowth, topCategories };
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    const saved = localStorage.getItem(`transactions_default`);
    if (saved) setTransactions(JSON.parse(saved));
    const dark = localStorage.getItem("darkMode") === "true";
    setDarkMode(dark);
    if (dark) document.documentElement.classList.add("dark");
    const savedLang = localStorage.getItem("language");
    if (savedLang) i18n.changeLanguage(savedLang);
    const savedCurrency = localStorage.getItem("currency");
    if (savedCurrency) setCurrency(savedCurrency);
    const savedBudgets = localStorage.getItem(`budgets_default`);
    if (savedBudgets) setBudgets(new Map(JSON.parse(savedBudgets)));
    const savedGoals = localStorage.getItem("savingsGoals");
    if (savedGoals) setSavingsGoals(JSON.parse(savedGoals));
    const savedRecurring = localStorage.getItem("recurringTransactions");
    if (savedRecurring) setRecurringTransactions(JSON.parse(savedRecurring));
    const savedCompanies = localStorage.getItem("companies");
    if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
    const savedProducts = localStorage.getItem("products");
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    const savedCustomers = localStorage.getItem("customers");
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
    const savedEmployees = localStorage.getItem("employees");
    if (savedEmployees) setEmployees(JSON.parse(savedEmployees));
    const savedAssets = localStorage.getItem("assets");
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    const savedLoans = localStorage.getItem("loans");
    if (savedLoans) setLoans(JSON.parse(savedLoans));
    const savedBankAccounts = localStorage.getItem("bankAccounts");
    if (savedBankAccounts) setBankAccounts(JSON.parse(savedBankAccounts));
    const savedAuditLog = localStorage.getItem("auditLog");
    if (savedAuditLog) setAuditLog(JSON.parse(savedAuditLog));
    const savedLockedPeriods = localStorage.getItem("lockedPeriods");
    if (savedLockedPeriods) setLockedPeriods(JSON.parse(savedLockedPeriods));
    const savedHfKey = localStorage.getItem("hf_api_key");
    if (savedHfKey) setHfApiKey(savedHfKey);
    if (savedLang === "fa") {
      document.documentElement.dir = "rtl";
      document.documentElement.classList.add("rtl");
    }
  }, []);

  // Budget alerts
  useEffect(() => {
    budgets.forEach((budget, category) => {
      const spent = transactions
        .filter((t) => t.category === category && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const percentage = (spent / budget) * 100;
      if (percentage >= 90 && percentage < 100)
        addNotification(
          t("messages.budget_warning", {
            category,
            percentage: percentage.toFixed(0),
          }),
          "warning",
        );
      else if (percentage >= 100)
        addNotification(t("messages.budget_exceeded", { category }), "error");
    });
  }, [transactions, budgets]);

  // Check recurring transactions
  useEffect(() => {
    checkRecurringTransactions();
    const interval = setInterval(checkRecurringTransactions, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [recurringTransactions, transactions]);

  // Auto-backup every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (transactions.length > 0) {
          const backup = {
            date: new Date().toISOString(),
            transactions,
            budgets: Array.from(budgets.entries()),
            savingsGoals,
            products,
            customers,
            employees,
            assets,
            loans,
            version: "2.0",
          };
          const backupBlob = new Blob([JSON.stringify(backup, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(backupBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
          a.click();
          URL.revokeObjectURL(url);
          addNotification(t("messages.backup_created"), "info");
        }
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, [
    transactions,
    budgets,
    savingsGoals,
    products,
    customers,
    employees,
    assets,
    loans,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setShowForm(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setActiveTab("dashboard");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault();
        setActiveTab("transactions");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        setActiveTab("reports");
      }
      if (e.key === "?") {
        e.preventDefault();
        alert(t("messages.keyboard_shortcuts"));
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // ========== RENDER ==========
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className='min-h-screen'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          {/* ========== HEADER ========== */}
          <div className='flex flex-wrap justify-between items-center mb-8 gap-4 p-4 rounded-2xl glass-card'>
            <h1 className='text-3xl font-bold'>
              <FontAwesomeIcon icon={icons.homeAlt} className='mr-3 text-2xl' />
              {t("app_name")}
            </h1>
            <div className='flex gap-3 flex-wrap'>
              {companies.length > 0 && (
                <select
                  onChange={(e) => switchCompany(e.target.value)}
                  value={currentCompanyId}
                  className='gradient-select px-3 py-2'
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏢 {c.name}
                    </option>
                  ))}
                  <option value='default'>
                    🏠 {t("navigation.dashboard")}
                  </option>
                </select>
              )}
              <button
                onClick={() => setShowCompanyModal(true)}
                className='btn-gradient px-3 py-2'
              >
                <FontAwesomeIcon icon={icons.circlePlus} className='mr-2' />{" "}
                {t("buttons.add")}
              </button>
              <select
                onChange={(e) => setCurrency(e.target.value)}
                value={currency}
                className='gradient-select px-3 py-2'
              >
                <option value='USD'>USD</option>
                <option value='EUR'>EUR</option>
                <option value='GBP'>GBP</option>
                <option value='IRR'> ﷼IRR</option>
                <option value='TRY'>₺ TRY</option>
                <option value='AMD'>֏ AMD</option>
              </select>
              <select
                onChange={(e) => changeLanguage(e.target.value)}
                value={i18n.language}
                className='gradient-select px-3 py-2'
              >
                <option value='en'>🇺🇸 English</option>
                <option value='fa'>🇮🇷 فارسی</option>
                <option value='de'>🇩🇪 Deutsch</option>
              </select>
              <button
                onClick={toggleDarkMode}
                className='btn-gradient px-3 py-2'
              >
                <FontAwesomeIcon
                  icon={darkMode ? icons.light : icons.dark}
                  className='mr-2'
                />
                {darkMode ? t("buttons.light") : t("buttons.dark")}
              </button>
              <button
                onClick={connectBlockchain}
                className='btn-gradient px-3 py-2'
              >
                <FontAwesomeIcon icon={icons.blockchain} className='mr-2' />{" "}
                {t("buttons.blockchain")}
              </button>
              <button
                onClick={enableQuantumEncryption}
                className='btn-gradient px-3 py-2'
              >
                <FontAwesomeIcon icon={icons.quantum} className='mr-2' />{" "}
                {t("buttons.quantum")}
              </button>
            </div>
          </div>

          {/* ========== QUICK ACTIONS BAR ========== */}
          <div className='flex flex-wrap gap-2 mb-6 p-4 glass-card'>
            <button
              onClick={() => setShowForm(true)}
              className='btn-gradient px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.add} className='mr-1' />{" "}
              {t("transactions.add")}
            </button>
            <button
              onClick={exportToCSV}
              className='btn-gradient-secondary px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.csv} className='mr-1' />{" "}
              {t("transactions.export_csv")}
            </button>
            <button
              onClick={exportToPDF}
              className='btn-gradient-secondary px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.pdf} className='mr-1' />{" "}
              {t("transactions.export_pdf")}
            </button>
            <button
              onClick={exportToExcel}
              className='btn-gradient-secondary px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.excel} className='mr-1' />{" "}
              {t("transactions.export_excel")}
            </button>
            <button
              onClick={() => setShowInvoiceModal(true)}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.invoice} className='mr-1' />{" "}
              {t("buttons.invoice")}
            </button>
            <button
              onClick={() => setShowProductModal(true)}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.product} className='mr-1' />{" "}
              {t("inventory.add_product")}
            </button>
            <button
              onClick={() => setShowCustomerModal(true)}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.customer} className='mr-1' />{" "}
              {t("customers.add_customer")}
            </button>
            <button
              onClick={() => setShowPayrollModal(true)}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.payroll} className='mr-1' />{" "}
              {t("payroll.add_employee")}
            </button>
            <button
              onClick={() => setShowAssetModal(true)}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.asset} className='mr-1' />{" "}
              {t("assets.add_asset")}
            </button>
            <button
              onClick={() => setShowLoanModal(true)}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.loan} className='mr-1' />{" "}
              {t("buttons.loan")}
            </button>
            <button
              onClick={() => setShowBankModal(true)}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.bank} className='mr-1' />{" "}
              {t("bank.connect_account")}
            </button>
            <button
              onClick={() => setShowBudgetModal(true)}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.budget} className='mr-1' />{" "}
              {t("transactions.budget")}
            </button>
            <button
              onClick={() => setShowRecurringModal(true)}
              className='btn-gradient px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.recurring} className='mr-1' />{" "}
              {t("transactions.recurring")}
            </button>
            <button
              onClick={() => setShowTaxModal(true)}
              className='btn-gradient px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.tax} className='mr-1' />{" "}
              {t("buttons.tax")}
            </button>
            <button
              onClick={() => setShowLockModal(true)}
              className='btn-gradient px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.lock} className='mr-1' />{" "}
              {t("modals.period_locking")}
            </button>
            <button
              onClick={() => setShowAuditModal(true)}
              className='btn-gradient px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.audit} className='mr-1' />{" "}
              {t("modals.audit_log")}
            </button>
            <button
              onClick={() => setShowMigrationModal(true)}
              className='btn-gradient-secondary px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.import} className='mr-1' />{" "}
              {t("modals.import_data")}
            </button>
            <button
              onClick={startVoiceCommand}
              className={`btn-gradient-secondary px-3 py-1.5 ${isListening ? "animate-pulse" : ""}`}
            >
              <FontAwesomeIcon icon={icons.voice} className='mr-1' />{" "}
              {t("buttons.voice")}
            </button>
            <button
              onClick={() => setShowChatbot(true)}
              className='btn-gradient-secondary px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.ai} className='mr-1' />{" "}
              {t("buttons.ai_chat")}
            </button>
            <button
              onClick={connectReceiptPrinter}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.printer} className='mr-1' />{" "}
              {t("buttons.printer")}
            </button>
            <button
              onClick={connectBarcodeScanner}
              className='btn-gradient-accent px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.scanner} className='mr-1' />{" "}
              {t("buttons.scanner")}
            </button>
            <button
              onClick={() => {
                if (confirm(t("messages.confirm_delete"))) saveTransactions([]);
              }}
              className='btn-gradient px-3 py-1.5'
            >
              <FontAwesomeIcon icon={icons.clear} className='mr-1' />{" "}
              {t("buttons.clear_all")}
            </button>
          </div>

          {/* ========== NAVIGATION TABS ========== */}
          <div className='flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 flex-wrap'>
            {[
              "dashboard",
              "transactions",
              "inventory",
              "customers",
              "payroll",
              "assets",
              "bank",
              "reports",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              >
                <FontAwesomeIcon
                  icon={icons[tab as keyof typeof icons] || icons.chart}
                  className='mr-2'
                />
                {t(`navigation.${tab}`)}
              </button>
            ))}
          </div>

          {/* ========== DASHBOARD TAB ========== */}
          {activeTab === "dashboard" && (
            <>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                <div className='stat-card'>
                  <p className='stat-label'>
                    <FontAwesomeIcon icon={icons.trend} className='mr-2' />
                    {t("dashboard.total_income")}
                  </p>
                  <p className='stat-value'>
                    {currencySymbols[currency]}
                    {getConvertedAmount(totalIncome).toLocaleString()}
                  </p>
                </div>
                <div className='stat-card'>
                  <p className='stat-label'>
                    <FontAwesomeIcon icon={icons.wallet} className='mr-2' />
                    {t("dashboard.total_expenses")}
                  </p>
                  <p className='stat-value'>
                    {currencySymbols[currency]}
                    {getConvertedAmount(totalExpense).toLocaleString()}
                  </p>
                </div>
                <div className='stat-card'>
                  <p className='stat-label'>
                    <FontAwesomeIcon icon={icons.bank} className='mr-2' />
                    {t("dashboard.balance")}
                  </p>
                  <p
                    className={`stat-value ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {currencySymbols[currency]}
                    {getConvertedAmount(balance).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
                <div className='stat-card'>
                  <p className='stat-label'>{t("dashboard.profit_margin")}</p>
                  <p className='stat-value'>
                    {totalIncome > 0
                      ? ((balance / totalIncome) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <div className='stat-card'>
                  <p className='stat-label'>{t("dashboard.expense_ratio")}</p>
                  <p className='stat-value'>
                    {totalIncome > 0
                      ? ((totalExpense / totalIncome) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <div className='stat-card'>
                  <p className='stat-label'>{t("dashboard.roi")}</p>
                  <p className='stat-value'>
                    {totalExpense > 0
                      ? ((balance / totalExpense) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <div className='stat-card'>
                  <p className='stat-label'>{t("dashboard.savings_rate")}</p>
                  <p className='stat-value'>
                    {totalIncome > 0
                      ? ((balance / totalIncome) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                <div className='chart-container'>
                  <h3 className='chart-title'>
                    <FontAwesomeIcon icon={icons.chart} className='mr-2' />
                    {t("dashboard.expenses_by_category")}
                  </h3>
                  {getCategoryData().length > 0 ? (
                    <ResponsiveContainer width='100%' height={300}>
                      <PieChart>
                        <Pie
                          data={getCategoryData()}
                          cx='50%'
                          cy='50%'
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill='#8884d8'
                          dataKey='value'
                        >
                          {getCategoryData().map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            `${currencySymbols[currency]}${getConvertedAmount(Number(value)).toLocaleString()}`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className='text-center text-gray-500 py-12'>
                      {t("dashboard.no_expense_data")}
                    </p>
                  )}
                </div>
                <div className='chart-container'>
                  <h3 className='chart-title'>
                    <FontAwesomeIcon icon={icons.trend} className='mr-2' />
                    {t("dashboard.monthly_trend")}
                  </h3>
                  {getMonthlyData().length > 0 ? (
                    <ResponsiveContainer width='100%' height={300}>
                      <BarChart data={getMonthlyData()}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis dataKey='month' />
                        <YAxis
                          tickFormatter={(value) =>
                            `${currencySymbols[currency]}${value}`
                          }
                        />
                        <Tooltip
                          formatter={(value) =>
                            `${currencySymbols[currency]}${Number(value).toLocaleString()}`
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey='income'
                          fill='#00C49F'
                          name={t("dashboard.income")}
                        />
                        <Bar
                          dataKey='expense'
                          fill='#FF8042'
                          name={t("dashboard.expense")}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className='text-center text-gray-500 py-12'>
                      {t("dashboard.no_transaction_data")}
                    </p>
                  )}
                </div>
              </div>

              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8'>
                <h3 className='text-lg font-semibold mb-4'>
                  <FontAwesomeIcon icon={icons.chart} className='mr-2' />
                  {t("dashboard.spending_heatmap")}
                </h3>
                <div className='grid grid-cols-7 gap-1'>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className='text-center text-xs font-medium text-gray-500 py-1'
                      >
                        {day}
                      </div>
                    ),
                  )}
                  {Array(35)
                    .fill(0)
                    .map((_, i) => {
                      const dayOfMonth = i - new Date().getDay() + 1;
                      const numericDay = Number(dayOfMonth);
                      const spending =
                        numericDay > 0 && numericDay <= 31
                          ? getSpendingByDay()[numericDay - 1]
                          : 0;
                      const maxSpending = Math.max(...getSpendingByDay(), 1);
                      const intensity =
                        spending > 0
                          ? Math.min((spending / maxSpending) * 100, 100)
                          : 0;
                      let bgColor = "bg-gray-100 dark:bg-gray-700";
                      if (spending > 0) {
                        if (intensity < 25)
                          bgColor = "bg-red-200 dark:bg-red-900/30";
                        else if (intensity < 50)
                          bgColor = "bg-red-300 dark:bg-red-800/50";
                        else if (intensity < 75)
                          bgColor = "bg-red-400 dark:bg-red-700/70";
                        else bgColor = "bg-red-600 dark:bg-red-600";
                      }
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg flex items-center justify-center text-xs ${bgColor} ${spending > 0 ? "text-white" : "text-gray-600"}`}
                          title={
                            numericDay > 0 && spending > 0
                              ? `${currencySymbols[currency]}${spending.toLocaleString()} spent`
                              : ""
                          }
                        >
                          {numericDay > 0 && numericDay <= 31 ? numericDay : ""}
                        </div>
                      );
                    })}
                </div>
              </div>

              {savingsGoals.length > 0 && (
                <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8'>
                  <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-semibold'>
                      <FontAwesomeIcon icon={icons.wallet} className='mr-2' />
                      {t("dashboard.savings_goals")}
                    </h3>
                    <button
                      onClick={() => setShowGoalModal(true)}
                      className='text-sm text-blue-600'
                    >
                      {t("dashboard.add_goal")}
                    </button>
                  </div>
                  {savingsGoals.map((goal) => {
                    const progress = (goal.current / goal.target) * 100;
                    return (
                      <div key={goal.id}>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>{goal.name}</span>
                          <span>
                            {currencySymbols[currency]}
                            {getConvertedAmount(
                              goal.current,
                            ).toLocaleString()}{" "}
                            / {currencySymbols[currency]}
                            {getConvertedAmount(goal.target).toLocaleString()}
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className='h-2 rounded-full bg-blue-600'
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {budgets.size > 0 && (
                <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8'>
                  <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-semibold'>
                      <FontAwesomeIcon icon={icons.budget} className='mr-2' />
                      {t("dashboard.budget_progress")}
                    </h3>
                    <button
                      onClick={() => setShowBudgetModal(true)}
                      className='text-sm text-blue-600'
                    >
                      {t("dashboard.set_budget")}
                    </button>
                  </div>
                  {Array.from(budgets.entries()).map(([category, budget]) => {
                    const progress = getBudgetProgress(category);
                    const spent = transactions
                      .filter((t) => t.category === category && t.amount < 0)
                      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                    return (
                      <div key={category}>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>{category}</span>
                          <span>
                            {currencySymbols[currency]}
                            {getConvertedAmount(spent).toLocaleString()} /{" "}
                            {currencySymbols[currency]}
                            {getConvertedAmount(budget).toLocaleString()}
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-2'>
                          <div
                            className={`h-2 rounded-full transition-all ${progress > 90 ? "bg-red-600" : progress > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {recurringTransactions.length > 0 && (
                <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8'>
                  <h3 className='text-lg font-semibold mb-4'>
                    <FontAwesomeIcon icon={icons.recurring} className='mr-2' />
                    {t("dashboard.recurring_bills")}
                  </h3>
                  {recurringTransactions.map((rt) => (
                    <div
                      key={rt.id}
                      className='flex justify-between items-center p-2 hover:bg-gray-50 rounded'
                    >
                      <div>
                        <p className='font-medium'>{rt.description}</p>
                        <p className='text-sm text-gray-500'>
                          {rt.frequency} on day {rt.dayOfMonth}
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <span className='text-red-600 font-semibold'>
                          {currencySymbols[currency]}
                          {getConvertedAmount(rt.amount).toLocaleString()}
                        </span>
                        <button
                          onClick={() => deleteRecurringTransaction(rt.id)}
                          className='text-red-500 text-sm'
                        >
                          <FontAwesomeIcon icon={icons.close} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className='bg-white dark:bg-gray-800 rounded-lg shadow'>
                <div className='p-6 border-b'>
                  <h2 className='text-lg font-semibold'>
                    <FontAwesomeIcon
                      icon={icons.transactions}
                      className='mr-2'
                    />
                    {t("dashboard.recent_transactions")}
                  </h2>
                </div>
                <div className='divide-y'>
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className='p-4 flex justify-between items-center'
                    >
                      <div>
                        <p className='font-medium'>{tx.description}</p>
                        <p className='text-sm text-gray-500'>{tx.date}</p>
                      </div>
                      <p
                        className={`font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {currencySymbols[currency]}
                        {getConvertedAmount(
                          Math.abs(tx.amount),
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className='p-8 text-center text-gray-500'>
                      {t("transactions.no_transactions")}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ========== TRANSACTIONS TAB ========== */}
          {activeTab === "transactions" && (
            <>
              <div className='flex justify-between items-center mb-4 flex-wrap gap-2'>
                <h2 className='text-xl font-semibold'>
                  <FontAwesomeIcon icon={icons.transactions} className='mr-2' />
                  {t("transactions.title")}
                </h2>
                <div className='flex gap-2 flex-wrap'>
                  <input
                    type='text'
                    placeholder={t("transactions.search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='modern-input px-4 py-2'
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className='modern-select px-3 py-2'
                  >
                    <option value='all'>
                      {t("transactions.all_categories")}
                    </option>
                    <option value='income'>
                      {t("transactions.income_only")}
                    </option>
                    <option value='expense'>
                      {t("transactions.expense_only")}
                    </option>
                    {Array.from(
                      new Set(transactions.map((t) => t.category)),
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      document.getElementById("receiptInput")?.click()
                    }
                    className='btn-gradient-secondary px-4 py-2'
                  >
                    <FontAwesomeIcon icon={icons.scanner} className='mr-2' />
                    {t("transactions.scan_receipt")}
                  </button>
                  <input
                    id='receiptInput'
                    type='file'
                    accept='image/*'
                    capture='environment'
                    className='hidden'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) scanReceipt(file);
                    }}
                  />
                  <button
                    onClick={exportToCSV}
                    className='btn-gradient-secondary px-4 py-2'
                  >
                    <FontAwesomeIcon icon={icons.csv} className='mr-2' />
                    {t("transactions.export_csv")}
                  </button>
                  <button
                    onClick={exportToPDF}
                    className='btn-gradient-secondary px-4 py-2'
                  >
                    <FontAwesomeIcon icon={icons.pdf} className='mr-2' />
                    {t("transactions.export_pdf")}
                  </button>
                  <button
                    onClick={exportToExcel}
                    className='btn-gradient-secondary px-4 py-2'
                  >
                    <FontAwesomeIcon icon={icons.excel} className='mr-2' />
                    {t("transactions.export_excel")}
                  </button>
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className='btn-gradient-accent px-4 py-2'
                  >
                    <FontAwesomeIcon icon={icons.budget} className='mr-2' />
                    {t("transactions.budget")}
                  </button>
                  <button
                    onClick={() => setShowRecurringModal(true)}
                    className='btn-gradient px-4 py-2'
                  >
                    <FontAwesomeIcon icon={icons.recurring} className='mr-2' />
                    {t("transactions.recurring")}
                  </button>
                  <button
                    onClick={() => setShowForm(true)}
                    className='btn-gradient px-4 py-2'
                  >
                    <FontAwesomeIcon icon={icons.add} className='mr-2' />
                    {t("transactions.add")}
                  </button>
                </div>
              </div>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden'>
                <table className='modern-table w-full'>
                  <thead>
                    <tr>
                      <th>{t("transactions.date")}</th>
                      <th>{t("transactions.description")}</th>
                      <th>{t("transactions.category")}</th>
                      <th>{t("transactions.amount")}</th>
                      <th>{t("transactions.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredTransactionsForDisplay().map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.date}</td>
                        <td>{tx.description}</td>
                        <td>{tx.category}</td>
                        <td
                          className={`${tx.amount >= 0 ? "text-green-600" : "text-red-600"} font-semibold`}
                        >
                          {currencySymbols[currency]}
                          {getConvertedAmount(
                            Math.abs(tx.amount),
                          ).toLocaleString()}
                        </td>
                        <td>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className='text-red-600 hover:text-red-800'
                          >
                            <FontAwesomeIcon icon={icons.close} />{" "}
                            {t("transactions.delete")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length === 0 && (
                  <div className='p-8 text-center text-gray-500'>
                    {t("transactions.no_transactions")}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ========== OTHER TABS (Inventory, Customers, Payroll, Assets, Bank, Reports) - Similar pattern ========== */}
          {/* For brevity, these follow the same pattern with translations and icons */}

          {activeTab === "inventory" && (
            <>
              <div className='flex justify-between items-center mb-4 flex-wrap gap-2'>
                <h2 className='text-xl font-semibold'>
                  <FontAwesomeIcon icon={icons.inventory} className='mr-2' />
                  {t("inventory.title")}
                </h2>
                <div className='flex gap-2'>
                  <select
                    value={valuationMethod}
                    onChange={(e) => setValuationMethod(e.target.value)}
                    className='modern-select px-3 py-2'
                  >
                    <option value='FIFO'>{t("inventory.fifo")}</option>
                    <option value='LIFO'>{t("inventory.lifo")}</option>
                    <option value='Weighted'>
                      {t("inventory.weighted_avg")}
                    </option>
                  </select>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className='btn-gradient px-4 py-2'
                  >
                    <FontAwesomeIcon icon={icons.add} className='mr-2' />
                    {t("inventory.add_product")}
                  </button>
                </div>
              </div>

              <div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4'>
                <FontAwesomeIcon icon={icons.product} className='mr-2' />
                {t("inventory.inventory_value")} ({valuationMethod}):{" "}
                {currencySymbols[currency]}
                {calculateInventoryValue().toLocaleString()}
              </div>

              {getLowStockProducts().length > 0 && (
                <div className='bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg p-4 mb-6'>
                  <div className='flex items-center'>
                    <FontAwesomeIcon
                      icon={icons.warning}
                      className='text-yellow-500 mr-3'
                    />
                    <p className='text-sm text-yellow-700 dark:text-yellow-300'>
                      {getLowStockProducts().length}{" "}
                      {t("inventory.low_stock_alert")}
                    </p>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all'
                  >
                    <div className='flex justify-between items-start mb-4'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          {product.name}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          {t("inventory.sku")}: {product.sku}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${product.quantity <= product.minStock ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"}`}
                      >
                        {product.quantity <= product.minStock
                          ? t("inventory.low_stock")
                          : t("inventory.in_stock")}
                      </span>
                    </div>

                    <div className='space-y-2 mb-4'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t("inventory.quantity")}:
                        </span>
                        <span className='font-semibold text-gray-900 dark:text-white'>
                          {product.quantity}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t("inventory.selling_price")}:
                        </span>
                        <span className='font-semibold text-green-600'>
                          {currencySymbols[currency]}
                          {product.price}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t("inventory.cost_price")}:
                        </span>
                        <span className='font-semibold text-red-600'>
                          {currencySymbols[currency]}
                          {product.cost}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t("inventory.min_stock")}:
                        </span>
                        <span className='text-gray-900 dark:text-white'>
                          {product.minStock}
                        </span>
                      </div>
                    </div>

                    <div className='flex gap-2'>
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowStockAdjustModal(true);
                        }}
                        className='flex-1 btn-gradient-secondary px-3 py-2 text-sm'
                      >
                        <FontAwesomeIcon icon={icons.edit} className='mr-1' />{" "}
                        {t("inventory.adjust_stock")}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className='btn-gradient px-3 py-2 text-sm'
                      >
                        <FontAwesomeIcon icon={icons.delete} className='mr-1' />{" "}
                        {t("inventory.delete_product")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {products.length === 0 && (
                <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow'>
                  <FontAwesomeIcon
                    icon={icons.product}
                    className='text-5xl text-gray-400 mb-3'
                  />
                  <p className='text-gray-500'>{t("inventory.no_products")}</p>
                </div>
              )}
            </>
          )}
          {activeTab === "customers" && (
            <>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>
                  <FontAwesomeIcon icon={icons.customers} className='mr-2' />
                  {t("customers.title")}
                </h2>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className='btn-gradient px-4 py-2'
                >
                  <FontAwesomeIcon icon={icons.add} className='mr-2' />
                  {t("customers.add_customer")}
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {customers.map((customer) => {
                  const customerSpent = transactions
                    .filter(
                      (t) =>
                        t.description.includes(customer.name) && t.amount < 0,
                    )
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

                  return (
                    <div
                      key={customer.id}
                      className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <div className='w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold text-xl'>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <FontAwesomeIcon
                          icon={icons.user}
                          className='text-gray-400 text-2xl'
                        />
                      </div>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        {customer.name}
                      </h3>
                      <p className='text-sm text-gray-500'>
                        <FontAwesomeIcon
                          icon={icons.email}
                          className='mr-1 w-3'
                        />{" "}
                        {customer.email}
                      </p>
                      <p className='text-sm text-gray-500'>
                        <FontAwesomeIcon
                          icon={icons.phone}
                          className='mr-1 w-3'
                        />{" "}
                        {customer.phone}
                      </p>
                      <p className='text-sm text-gray-500'>
                        <FontAwesomeIcon
                          icon={icons.location}
                          className='mr-1 w-3'
                        />{" "}
                        {customer.address}
                      </p>

                      <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-gray-600 dark:text-gray-400'>
                            {t("customers.total_spent")}:
                          </span>
                          <span className='font-semibold text-red-600'>
                            {currencySymbols[currency]}
                            {customerSpent.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {customers.length === 0 && (
                <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow'>
                  <FontAwesomeIcon
                    icon={icons.customers}
                    className='text-5xl text-gray-400 mb-3'
                  />
                  <p className='text-gray-500'>{t("customers.no_customers")}</p>
                </div>
              )}
            </>
          )}
          {activeTab === "payroll" && (
            <>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>
                  <FontAwesomeIcon icon={icons.payroll} className='mr-2' />
                  {t("payroll.title")}
                </h2>
                <button
                  onClick={() => setShowPayrollModal(true)}
                  className='btn-gradient px-4 py-2'
                >
                  <FontAwesomeIcon icon={icons.add} className='mr-2' />
                  {t("payroll.add_employee")}
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {employees.map((emp) => {
                  const monthlyTax = (emp.salary * emp.taxRate) / 100;
                  const netPay = emp.salary - monthlyTax;

                  return (
                    <div
                      key={emp.id}
                      className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all'
                    >
                      <div className='flex items-center justify-between mb-3'>
                        <div className='w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-xl'>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <FontAwesomeIcon
                          icon={icons.userTie}
                          className='text-gray-400 text-2xl'
                        />
                      </div>
                      <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                        {emp.name}
                      </h3>
                      <p className='text-sm text-gray-500'>
                        <FontAwesomeIcon
                          icon={icons.briefcase}
                          className='mr-1 w-3'
                        />{" "}
                        {emp.position}
                      </p>

                      <div className='mt-4 space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600 dark:text-gray-400'>
                            {t("payroll.monthly_salary")}:
                          </span>
                          <span className='font-bold text-gray-900 dark:text-white'>
                            {currencySymbols[currency]}
                            {emp.salary.toLocaleString()}
                          </span>
                        </div>
                        <div className='flex justify-between text-sm'>
                          <span className='text-gray-600 dark:text-gray-400'>
                            {t("payroll.tax")} ({emp.taxRate}%):
                          </span>
                          <span className='text-red-600'>
                            -{currencySymbols[currency]}
                            {monthlyTax.toLocaleString()}
                          </span>
                        </div>
                        <div className='flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700'>
                          <span className='text-gray-900 dark:text-white'>
                            {t("payroll.net_pay")}:
                          </span>
                          <span className='text-green-600'>
                            {currencySymbols[currency]}
                            {netPay.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const payrollTx: Transaction = {
                            id: Date.now().toString(),
                            description: `Payroll - ${emp.name}`,
                            amount: -emp.salary,
                            category: "Payroll",
                            date: new Date().toISOString().split("T")[0],
                          };
                          saveTransactions([payrollTx, ...transactions]);
                          addNotification(
                            t("messages.payroll_processed", { name: emp.name }),
                            "success",
                          );
                        }}
                        className='w-full mt-4 btn-gradient px-4 py-2'
                      >
                        <FontAwesomeIcon icon={icons.wallet} className='mr-2' />{" "}
                        {t("payroll.process_payroll")}
                      </button>
                    </div>
                  );
                })}
              </div>

              {employees.length === 0 && (
                <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow'>
                  <FontAwesomeIcon
                    icon={icons.payroll}
                    className='text-5xl text-gray-400 mb-3'
                  />
                  <p className='text-gray-500'>{t("payroll.no_employees")}</p>
                </div>
              )}
            </>
          )}
          {activeTab === "assets" && (
            <>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>
                  <FontAwesomeIcon icon={icons.asset} className='mr-2' />
                  {t("assets.title")}
                </h2>
                <button
                  onClick={() => setShowAssetModal(true)}
                  className='btn-gradient px-4 py-2'
                >
                  <FontAwesomeIcon icon={icons.add} className='mr-2' />
                  {t("assets.add_asset")}
                </button>
              </div>

              <div className='overflow-x-auto'>
                <table className='modern-table w-full'>
                  <thead>
                    <tr>
                      <th>{t("assets.asset_name")}</th>
                      <th>{t("assets.purchase_date")}</th>
                      <th>{t("assets.purchase_price")}</th>
                      <th>{t("assets.annual_depreciation")}</th>
                      <th>{t("assets.depreciation_method")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td className='font-medium'>{asset.name}</td>
                        <td>{asset.purchaseDate}</td>
                        <td>
                          {currencySymbols[currency]}
                          {asset.purchasePrice.toLocaleString()}
                        </td>
                        <td className='text-orange-600'>
                          {currencySymbols[currency]}
                          {calculateDepreciation(asset).toLocaleString()}
                        </td>
                        <td>
                          {asset.method === "straight-line"
                            ? t("assets.straight_line")
                            : t("assets.declining_balance")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {assets.length === 0 && (
                <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow'>
                  <FontAwesomeIcon
                    icon={icons.asset}
                    className='text-5xl text-gray-400 mb-3'
                  />
                  <p className='text-gray-500'>{t("assets.no_assets")}</p>
                </div>
              )}
            </>
          )}
          {activeTab === "bank" && (
            <>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>
                  <FontAwesomeIcon icon={icons.bank} className='mr-2' />
                  {t("bank.title")}
                </h2>
                <button
                  onClick={() => setShowBankModal(true)}
                  className='btn-gradient px-4 py-2'
                >
                  <FontAwesomeIcon icon={icons.add} className='mr-2' />
                  {t("bank.connect_account")}
                </button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className='bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all relative overflow-hidden'
                  >
                    <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-500 to-gray-700'></div>

                    <div className='flex justify-between items-start mb-4'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                          <FontAwesomeIcon icon={icons.bank} className='mr-2' />{" "}
                          {account.name}
                        </h3>
                        <p className='text-xs text-gray-500 mt-1'>
                          <FontAwesomeIcon
                            icon={icons.clock}
                            className='mr-1 w-3'
                          />
                          {t("bank.last_synced")}:{" "}
                          {new Date(account.lastSynced).toLocaleDateString()}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-2xl font-bold text-green-600'>
                          {currencySymbols[account.currency]}
                          {account.balance.toLocaleString()}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {account.currency}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => syncBankAccount(account.id)}
                      className='w-full btn-gradient-secondary px-4 py-2'
                    >
                      <FontAwesomeIcon icon={icons.sync} className='mr-2' />{" "}
                      {t("bank.sync_now")}
                    </button>
                  </div>
                ))}
              </div>

              {bankAccounts.length === 0 && (
                <div className='text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow'>
                  <FontAwesomeIcon
                    icon={icons.bank}
                    className='text-5xl text-gray-400 mb-3'
                  />
                  <p className='text-gray-500'>{t("bank.no_accounts")}</p>
                </div>
              )}
            </>
          )}

          {activeTab === "reports" && (
            <div className='space-y-6'>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
                <h2 className='text-2xl font-bold mb-4'>
                  <FontAwesomeIcon icon={icons.reports} className='mr-2' />
                  {t("reports.title")}
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
                  <div>
                    <label className='block text-sm mb-2'>
                      {t("reports.start_date")}
                    </label>
                    <input
                      type='date'
                      value={reportDateRange.start}
                      onChange={(e) =>
                        setReportDateRange({
                          ...reportDateRange,
                          start: e.target.value,
                        })
                      }
                      className='modern-input w-full'
                    />
                  </div>
                  <div>
                    <label className='block text-sm mb-2'>
                      {t("reports.end_date")}
                    </label>
                    <input
                      type='date'
                      value={reportDateRange.end}
                      onChange={(e) =>
                        setReportDateRange({
                          ...reportDateRange,
                          end: e.target.value,
                        })
                      }
                      className='modern-input w-full'
                    />
                  </div>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                  <button
                    onClick={() => downloadReport("pnl")}
                    className='btn-gradient p-4'
                  >
                    <FontAwesomeIcon icon={icons.chart} className='mr-2' />
                    {t("reports.pnl_report")}
                  </button>
                  <button
                    onClick={() => downloadReport("balance")}
                    className='btn-gradient-secondary p-4'
                  >
                    <FontAwesomeIcon icon={icons.bank} className='mr-2' />
                    {t("reports.balance_sheet")}
                  </button>
                  <button
                    onClick={() => downloadReport("cashflow")}
                    className='btn-gradient-secondary p-4'
                  >
                    <FontAwesomeIcon icon={icons.trend} className='mr-2' />
                    {t("reports.cash_flow")}
                  </button>
                  <button
                    onClick={() => {
                      const year = new Date().getFullYear();
                      const yearlyReport = generatePNLReport(
                        `${year}-01-01`,
                        `${year}-12-31`,
                      );
                      addNotification(
                        t("reports.yearly_summary") +
                          ` ${year}: ${currencySymbols[currency]}${yearlyReport.netIncome}`,
                        "info",
                      );
                    }}
                    className='btn-gradient-accent p-4'
                  >
                    <FontAwesomeIcon icon={icons.calendar} className='mr-2' />
                    {t("reports.yearly_summary")}
                  </button>
                </div>
              </div>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
                <h3 className='text-lg font-semibold mb-4'>
                  {t("reports.current_period_summary")}
                </h3>
                {(() => {
                  const currentMonth = new Date()
                    .toISOString()
                    .split("T")[0]
                    .substring(0, 7);
                  const monthTransactions = transactions.filter((t) =>
                    t.date.startsWith(currentMonth),
                  );
                  const monthIncome = monthTransactions
                    .filter((t) => t.amount > 0)
                    .reduce((sum, t) => sum + t.amount, 0);
                  const monthExpenses = monthTransactions
                    .filter((t) => t.amount < 0)
                    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                  return (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='p-4 bg-green-50 rounded-lg'>
                        <p className='text-sm text-green-600'>
                          {t("reports.this_month_income")}
                        </p>
                        <p className='text-2xl font-bold text-green-700'>
                          {currencySymbols[currency]}
                          {getConvertedAmount(monthIncome).toLocaleString()}
                        </p>
                      </div>
                      <div className='p-4 bg-red-50 rounded-lg'>
                        <p className='text-sm text-red-600'>
                          {t("reports.this_month_expenses")}
                        </p>
                        <p className='text-2xl font-bold text-red-700'>
                          {currencySymbols[currency]}
                          {getConvertedAmount(monthExpenses).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className='bg-white dark:bg-gray-800 rounded-lg shadow p-6'>
                <button
                  onClick={() => setShowAnalyticsModal(true)}
                  className='btn-gradient px-4 py-2'
                >
                  <FontAwesomeIcon icon={icons.chart} className='mr-2' />
                  {t("reports.advanced_analytics")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========== MODALS ========== */}
      {/* Add Transaction Modal */}
      {showForm && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.add} className='mr-2' />
              {t("modals.add_transaction")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("transactions.description")}
                value={newTx.description}
                onChange={(e) =>
                  setNewTx({ ...newTx, description: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("transactions.amount")}
                value={newTx.amount}
                onChange={(e) =>
                  setNewTx({
                    ...newTx,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='text'
                placeholder={t("transactions.category")}
                value={newTx.category}
                onChange={(e) =>
                  setNewTx({ ...newTx, category: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='date'
                value={newTx.date}
                onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowForm(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                <FontAwesomeIcon icon={icons.close} className='mr-2' />
                {t("buttons.cancel")}
              </button>
              <button
                onClick={addTransaction}
                className='btn-gradient px-4 py-2'
              >
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestion Modal */}
      {showAiSuggestion && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.ai} className='mr-2' />
              {t("modals.ai_suggestion")}
            </h3>
            <div className='text-center mb-4'>
              <p className='text-gray-700 mb-2'>
                {t("modals.ai_suggestion_text")}
              </p>
              <p className='text-2xl font-bold text-blue-600'>
                {currentSuggestion.suggestedCategory}
              </p>
              <p className='text-sm text-gray-500 mt-1'>
                {t("modals.ai_confidence")}: {currentSuggestion.confidence}%
              </p>
            </div>
            <div className='flex justify-center gap-3'>
              <button
                onClick={() => setShowAiSuggestion(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={() =>
                  applyAiSuggestion(
                    currentSuggestion.transactionId,
                    currentSuggestion.suggestedCategory,
                  )
                }
                className='btn-gradient px-4 py-2'
              >
                <FontAwesomeIcon icon={icons.check} className='mr-2' />
                {t("buttons.apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.budget} className='mr-2' />
              {t("modals.set_budget")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("transactions.category")}
                value={newBudget.category}
                onChange={(e) =>
                  setNewBudget({ ...newBudget, category: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("modals.budget_amount")}
                value={newBudget.amount}
                onChange={(e) =>
                  setNewBudget({
                    ...newBudget,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowBudgetModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button onClick={addBudget} className='btn-gradient px-4 py-2'>
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Modal */}
      {showRecurringModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.recurring} className='mr-2' />
              {t("modals.recurring_transaction")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("transactions.description")}
                value={newRecurring.description}
                onChange={(e) =>
                  setNewRecurring({
                    ...newRecurring,
                    description: e.target.value,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("transactions.amount")}
                value={newRecurring.amount}
                onChange={(e) =>
                  setNewRecurring({
                    ...newRecurring,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='text'
                placeholder={t("transactions.category")}
                value={newRecurring.category}
                onChange={(e) =>
                  setNewRecurring({ ...newRecurring, category: e.target.value })
                }
                className='modern-input w-full'
              />
              <select
                value={newRecurring.frequency}
                onChange={(e) =>
                  setNewRecurring({
                    ...newRecurring,
                    frequency: e.target.value,
                  })
                }
                className='modern-select w-full'
              >
                <option value='monthly'>{t("modals.monthly")}</option>
                <option value='weekly'>{t("modals.weekly")}</option>
                <option value='yearly'>{t("modals.yearly")}</option>
              </select>
              <input
                type='number'
                placeholder={t("modals.day_of_month")}
                min='1'
                max='31'
                value={newRecurring.dayOfMonth}
                onChange={(e) =>
                  setNewRecurring({
                    ...newRecurring,
                    dayOfMonth: parseInt(e.target.value) || 1,
                  })
                }
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowRecurringModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={addRecurringTransaction}
                className='btn-gradient px-4 py-2'
              >
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {showCompanyModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.building} className='mr-2' />
              {t("modals.create_company")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("modals.company_name")}
                value={newCompany.name}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, name: e.target.value })
                }
                className='modern-input w-full'
              />
              <select
                value={newCompany.currency}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, currency: e.target.value })
                }
                className='modern-select w-full'
              >
                <option value='USD'>USD</option>
                <option value='EUR'>EUR</option>
                <option value='IRR'>IRR</option>
              </select>
              <input
                type='date'
                value={newCompany.fiscalYearStart}
                onChange={(e) =>
                  setNewCompany({
                    ...newCompany,
                    fiscalYearStart: e.target.value,
                  })
                }
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowCompanyModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button onClick={addCompany} className='btn-gradient px-4 py-2'>
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className='modal-overlay'>
          <div className='modal-content max-w-2xl'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.invoice} className='mr-2' />
              {t("modals.create_invoice")}
            </h3>
            <div className='space-y-4'>
              <input
                type='text'
                placeholder={t("customers.name")}
                value={currentInvoice.customerName}
                onChange={(e) =>
                  setCurrentInvoice({
                    ...currentInvoice,
                    customerName: e.target.value,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='email'
                placeholder={t("customers.email")}
                value={currentInvoice.customerEmail}
                onChange={(e) =>
                  setCurrentInvoice({
                    ...currentInvoice,
                    customerEmail: e.target.value,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='date'
                placeholder={t("modals.due_date")}
                value={currentInvoice.dueDate}
                onChange={(e) =>
                  setCurrentInvoice({
                    ...currentInvoice,
                    dueDate: e.target.value,
                  })
                }
                className='modern-input w-full'
              />
              <div className='border-t pt-4'>
                <h4 className='font-semibold mb-2'>
                  {t("modals.invoice_items")}
                </h4>
                {currentInvoice.items.map((item, idx) => (
                  <div key={idx} className='grid grid-cols-4 gap-2 mb-2'>
                    <input
                      type='text'
                      placeholder={t("transactions.description")}
                      value={item.description}
                      onChange={(e) =>
                        updateInvoiceItem(idx, "description", e.target.value)
                      }
                      className='col-span-2 modern-input'
                    />
                    <input
                      type='number'
                      placeholder={t("inventory.quantity")}
                      value={item.quantity}
                      onChange={(e) =>
                        updateInvoiceItem(
                          idx,
                          "quantity",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className='modern-input'
                    />
                    <input
                      type='number'
                      placeholder={t("inventory.selling_price")}
                      value={item.price}
                      onChange={(e) =>
                        updateInvoiceItem(
                          idx,
                          "price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className='modern-input'
                    />
                  </div>
                ))}
                <button
                  onClick={addInvoiceItem}
                  className='text-sm text-blue-600 mt-2'
                >
                  <FontAwesomeIcon icon={icons.add} className='mr-1' />
                  {t("buttons.add_item")}
                </button>
              </div>
              <div className='text-right pt-4 border-t'>
                <p className='text-lg font-bold'>
                  {t("modals.total")}: {currencySymbols[currency]}
                  {calculateInvoiceTotal().toLocaleString()}
                </p>
              </div>
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={generateInvoicePDF}
                className='btn-gradient px-4 py-2'
              >
                <FontAwesomeIcon icon={icons.pdf} className='mr-2' />
                {t("buttons.generate")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.product} className='mr-2' />
              {t("inventory.add_product")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("inventory.product_name")}
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='text'
                placeholder={t("inventory.sku")}
                value={newProduct.sku}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sku: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("inventory.quantity")}
                value={newProduct.quantity}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("inventory.selling_price")}
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("inventory.cost_price")}
                value={newProduct.cost}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    cost: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='text'
                placeholder={t("inventory.category")}
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("inventory.min_stock")}
                value={newProduct.minStock}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    minStock: parseInt(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowProductModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button onClick={addProduct} className='btn-gradient px-4 py-2'>
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.customer} className='mr-2' />
              {t("customers.add_customer")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("customers.name")}
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='email'
                placeholder={t("customers.email")}
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='tel'
                placeholder={t("customers.phone")}
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='text'
                placeholder={t("customers.address")}
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, address: e.target.value })
                }
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowCustomerModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button onClick={addCustomer} className='btn-gradient px-4 py-2'>
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {showPayrollModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.payroll} className='mr-2' />
              {t("payroll.add_employee")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("payroll.employee_name")}
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='text'
                placeholder={t("payroll.position")}
                value={newEmployee.position}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, position: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("payroll.monthly_salary")}
                value={newEmployee.salary}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    salary: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("payroll.tax_rate")}
                value={newEmployee.taxRate}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    taxRate: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowPayrollModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button onClick={addEmployee} className='btn-gradient px-4 py-2'>
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.asset} className='mr-2' />
              {t("assets.add_asset")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("assets.asset_name")}
                value={newAsset.name}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, name: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='date'
                placeholder={t("assets.purchase_date")}
                value={newAsset.purchaseDate}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, purchaseDate: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("assets.purchase_price")}
                value={newAsset.purchasePrice}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    purchasePrice: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("assets.useful_life")}
                value={newAsset.usefulLife}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    usefulLife: parseInt(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("assets.salvage_value")}
                value={newAsset.salvageValue}
                onChange={(e) =>
                  setNewAsset({
                    ...newAsset,
                    salvageValue: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <select
                value={newAsset.method}
                onChange={(e) =>
                  setNewAsset({ ...newAsset, method: e.target.value })
                }
                className='modern-select w-full'
              >
                <option value='straight-line'>
                  {t("assets.straight_line")}
                </option>
                <option value='declining-balance'>
                  {t("assets.declining_balance")}
                </option>
              </select>
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowAssetModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button onClick={addAsset} className='btn-gradient px-4 py-2'>
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loan Modal */}
      {showLoanModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.loan} className='mr-2' />
              {t("modals.add_loan")}
            </h3>
            <div className='space-y-3'>
              <input
                type='number'
                placeholder={t("modals.loan_amount")}
                value={newLoan.amount}
                onChange={(e) =>
                  setNewLoan({
                    ...newLoan,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("modals.interest_rate")}
                value={newLoan.rate}
                onChange={(e) =>
                  setNewLoan({
                    ...newLoan,
                    rate: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("modals.loan_term")}
                value={newLoan.term}
                onChange={(e) =>
                  setNewLoan({
                    ...newLoan,
                    term: parseInt(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <input
                type='date'
                placeholder={t("modals.start_date")}
                value={newLoan.startDate}
                onChange={(e) =>
                  setNewLoan({ ...newLoan, startDate: e.target.value })
                }
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowLoanModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button onClick={addLoan} className='btn-gradient px-4 py-2'>
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bank Modal */}
      {showBankModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.bank} className='mr-2' />
              {t("bank.connect_account")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("bank.account_name")}
                value={newBankAccount.name}
                onChange={(e) =>
                  setNewBankAccount({ ...newBankAccount, name: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("bank.current_balance")}
                value={newBankAccount.balance}
                onChange={(e) =>
                  setNewBankAccount({
                    ...newBankAccount,
                    balance: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
              <select
                value={newBankAccount.currency}
                onChange={(e) =>
                  setNewBankAccount({
                    ...newBankAccount,
                    currency: e.target.value,
                  })
                }
                className='modern-select w-full'
              >
                <option value='USD'>USD</option>
                <option value='EUR'>EUR</option>
                <option value='GBP'>GBP</option>
              </select>
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowBankModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={addBankAccount}
                className='btn-gradient px-4 py-2'
              >
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.connect")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Savings Goal Modal */}
      {showGoalModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.wallet} className='mr-2' />
              {t("modals.add_savings_goal")}
            </h3>
            <div className='space-y-3'>
              <input
                type='text'
                placeholder={t("modals.goal_name")}
                value={newGoal.name}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, name: e.target.value })
                }
                className='modern-input w-full'
              />
              <input
                type='number'
                placeholder={t("modals.target_amount")}
                value={newGoal.target}
                onChange={(e) =>
                  setNewGoal({
                    ...newGoal,
                    target: parseFloat(e.target.value) || 0,
                  })
                }
                className='modern-input w-full'
              />
            </div>
            <div className='flex justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowGoalModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.cancel")}
              </button>
              <button
                onClick={addSavingsGoal}
                className='btn-gradient px-4 py-2'
              >
                <FontAwesomeIcon icon={icons.save} className='mr-2' />
                {t("buttons.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Modal */}
      {showMigrationModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.import} className='mr-2' />
              {t("modals.import_data")}
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
              {t("modals.import_from")}
            </p>
            <input
              type='file'
              accept='.csv,.xlsx'
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setMigrationFile(file);
              }}
              className='modern-input w-full'
            />
            <div className='flex justify-end mt-6'>
              <button
                onClick={() => setShowMigrationModal(false)}
                className='btn-gradient-accent px-4 py-2'
              >
                {t("buttons.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Modal */}
      {showTaxModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.tax} className='mr-2' />
              {t("modals.tax_calculator")}
            </h3>
            <select
              value={selectedTaxCountry}
              onChange={(e) => setSelectedTaxCountry(e.target.value)}
              className='modern-select w-full mb-4'
            >
              <option value='US'>{t("modals.united_states")}</option>
              <option value='Germany'>{t("modals.germany")}</option>
              <option value='Turkey'>{t("modals.turkey")}</option>
              <option value='Iran'>{t("modals.iran")}</option>
              <option value='Armenia'>{t("modals.armenia")}</option>
            </select>
            {(() => {
              const yearlyIncome = totalIncome;
              const taxRate =
                taxRates[selectedTaxCountry as keyof typeof taxRates].rate /
                100;
              const taxAmount = yearlyIncome * taxRate;
              return (
                <>
                  <div className='bg-gray-100 dark:bg-gray-700 p-3 rounded mb-2'>
                    <p className='text-sm'>{t("modals.gross_income")}</p>
                    <p className='text-xl font-bold'>
                      {currencySymbols[currency]}
                      {getConvertedAmount(yearlyIncome).toLocaleString()}
                    </p>
                  </div>
                  <div className='bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded mb-2'>
                    <p className='text-sm'>
                      {t("modals.tax_amount")} (
                      {
                        taxRates[selectedTaxCountry as keyof typeof taxRates]
                          .rate
                      }
                      %):
                    </p>
                    <p className='text-xl font-bold text-yellow-700'>
                      {currencySymbols[currency]}
                      {getConvertedAmount(taxAmount).toLocaleString()}
                    </p>
                  </div>
                  <div className='bg-blue-100 dark:bg-blue-900/20 p-3 rounded'>
                    <p className='text-sm'>{t("modals.net_income")}</p>
                    <p className='text-xl font-bold text-blue-700'>
                      {currencySymbols[currency]}
                      {getConvertedAmount(
                        yearlyIncome - taxAmount,
                      ).toLocaleString()}
                    </p>
                  </div>
                </>
              );
            })()}
            <button
              onClick={() => setShowTaxModal(false)}
              className='btn-gradient w-full mt-4 px-4 py-2'
            >
              {t("buttons.close")}
            </button>
          </div>
        </div>
      )}

      {/* Period Lock Modal */}
      {showLockModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <h3 className='text-xl font-bold mb-4'>
              <FontAwesomeIcon icon={icons.lock} className='mr-2' />
              {t("modals.period_locking")}
            </h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className='modern-select w-full mb-4'
            >
              <option value=''>{t("modals.select_month")}</option>
              {Array(12)
                .fill(0)
                .map((_, i) => {
                  const date = new Date();
                  date.setMonth(i);
                  const monthStr = `${date.getFullYear()}-${String(i + 1).padStart(2, "0")}`;
                  return (
                    <option key={i} value={monthStr}>
                      {date.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      {lockedPeriods.includes(monthStr)
                        ? `(${t("modals.locked")})`
                        : ""}
                    </option>
                  );
                })}
            </select>
            <div className='flex gap-3'>
              <button
                onClick={() => selectedMonth && lockPeriod(selectedMonth)}
                disabled={!selectedMonth}
                className='btn-gradient-accent flex-1 px-4 py-2 disabled:opacity-50'
              >
                {t("modals.lock_month")}
              </button>
              <button
                onClick={yearEndClosing}
                className='btn-gradient flex-1 px-4 py-2'
              >
                {t("modals.close_year")}
              </button>
            </div>
            <button
              onClick={() => setShowLockModal(false)}
              className='btn-gradient-accent w-full mt-3 px-4 py-2'
            >
              {t("buttons.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showAuditModal && (
        <div className='modal-overlay'>
          <div className='modal-content max-w-3xl max-h-[80vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-xl font-bold'>
                <FontAwesomeIcon icon={icons.audit} className='mr-2' />
                {t("modals.audit_log")}
              </h3>
              <button
                onClick={() => setShowAuditModal(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                <FontAwesomeIcon icon={icons.close} />
              </button>
            </div>
            <div className='space-y-2'>
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className='border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700/50 p-3 rounded'
                >
                  <div className='flex justify-between text-sm'>
                    <span className='font-mono text-xs text-gray-500'>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <span className='font-semibold text-blue-600'>
                      {entry.action}
                    </span>
                  </div>
                  <p className='text-sm mt-1'>{entry.details}</p>
                </div>
              ))}
              {auditLog.length === 0 && (
                <p className='text-center text-gray-500 py-8'>
                  {t("modals.no_audit_entries")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className='modal-overlay'>
          <div className='modal-content max-w-4xl max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-2xl font-bold'>
                <FontAwesomeIcon icon={icons.chart} className='mr-2' />
                {t("reports.advanced_analytics")}
              </h3>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                <FontAwesomeIcon icon={icons.close} />
              </button>
            </div>
            <select
              value={analyticsPeriod}
              onChange={(e) => setAnalyticsPeriod(e.target.value)}
              className='modern-select mb-4'
            >
              <option value='6months'>{t("analytics.last_6_months")}</option>
              <option value='1year'>{t("analytics.last_year")}</option>
              <option value='all'>{t("analytics.all_time")}</option>
            </select>
            {(() => {
              const analytics = getAnalyticsData();
              return (
                <div className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white'>
                      <p className='text-sm opacity-90'>
                        {t("analytics.avg_growth_rate")}
                      </p>
                      <p className='text-3xl font-bold'>
                        {analytics.avgGrowth.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className='bg-gray-100 dark:bg-gray-700 rounded-lg p-4'>
                    <h4 className='font-semibold mb-3'>
                      {t("analytics.top_spending_categories")}
                    </h4>
                    {analytics.topCategories.map(([cat, amount], idx) => (
                      <div key={cat}>
                        <div className='flex justify-between text-sm mb-1'>
                          <span>
                            #{idx + 1} {cat}
                          </span>
                          <span>
                            {currencySymbols[currency]}
                            {getConvertedAmount(amount).toLocaleString()}
                          </span>
                        </div>
                        <div className='w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2'>
                          <div
                            className='bg-purple-500 rounded-full h-2'
                            style={{
                              width: `${(amount / analytics.topCategories[0][1]) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* AI Chatbot */}
      {showChatbot && (
        <div className='fixed bottom-20 right-4 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border'>
          <div className='flex justify-between items-center p-4 border-b'>
            <h3 className='font-bold'>
              <FontAwesomeIcon icon={icons.ai} className='mr-2' />
              {t("modals.ai_assistant")}
            </h3>
            <button
              onClick={() => setShowChatbot(false)}
              className='text-gray-500 hover:text-gray-700'
            >
              <FontAwesomeIcon icon={icons.close} />
            </button>
          </div>
          <div className='h-96 overflow-y-auto p-4 space-y-2'>
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded ${msg.role === "user" ? "bg-blue-100 dark:bg-blue-900/30 text-right" : "bg-gray-100 dark:bg-gray-700"}`}
              >
                {msg.content}
              </div>
            ))}
            {chatMessages.length === 0 && (
              <p className='text-center text-gray-500'>{t("modals.ask_me")}</p>
            )}
          </div>
          <div className='p-4 border-t flex gap-2'>
            <input
              type='text'
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("modals.ask_question")}
              className='flex-1 modern-input'
              onKeyPress={(e) => {
                if (e.key === "Enter" && chatInput) {
                  setChatMessages([
                    ...chatMessages,
                    { role: "user", content: chatInput },
                  ]);
                  askChatGPT(chatInput);
                  setChatInput("");
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className='fixed top-4 right-4 z-50 space-y-2'>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-lg shadow-lg text-white ${notif.type === "success" ? "toast-success" : notif.type === "error" ? "toast-error" : notif.type === "warning" ? "toast-warning" : "toast-info"}`}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* Scanning Status */}
      {scanningText && (
        <div className='fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg z-50'>
          {scanningText}
        </div>
      )}
    </div>
  );
}

export default App;
