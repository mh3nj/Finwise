# FinWise – Smart Accounting for Everyone

**Status:** Stable Release v1.0  
**Build Date:** May 14, 2026

A professional desktop-class accounting application with **70+ powerful features** for individuals, small businesses, and enterprises – all offline, local-first, with zero cloud dependency and absolute privacy.

---

## About FinWise

FinWise (pronounced "fin-wise") is a complete accounting command center named after the fusion of "Financial" and "Wisdom". Just as wisdom guides financial decisions, FinWise guides your money through tracking, reporting, budgeting, and forecasting – all without ever sending your data to the cloud.

### What FinWise Helps You Do

- Track transactions – Income, expenses, split transactions with categories
- Manage multi-currency – USD, EUR, GBP, IRR, TRY, AMD with live exchange rates
- Generate invoices – Professional PDF invoices with custom items
- Control inventory – Product management, stock tracking, low stock alerts
- Process payroll – Employee management, salary calculation, tax withholding
- Track assets – Fixed assets, depreciation (straight-line/declining)
- Manage loans – Amortization schedules, interest calculation
- Connect banks – Manual bank account sync (API-ready)
- Set budgets – Category budgets with real-time progress alerts
- Save goals – Track savings goals with visual progress bars
- Automate recurring – Monthly/weekly/yearly recurring transactions
- Generate reports – P&L, Balance Sheet, Cash Flow, Yearly summaries
- Scan receipts – OCR receipt scanning (Tesseract.js)
- Voice commands – Add transactions by speaking
- AI assistance – Smart categorization + chatbot
- Export data – CSV, PDF, Excel formats
- Auto-backup – Automatic backups every 5 minutes
- Multi-language – English, Farsi (RTL), German
- Multi-company – Switch between businesses instantly
- Dark/Light theme – Eye-friendly professional gradients

**70+ integrated features** | **Dark/Light theme** | **100% offline** | **Zero telemetry** | **No account required**

---

## The 8 Main Modules

| Module | Description |
|--------|-------------|
| Dashboard | Real-time financial overview with charts, heatmaps, and KPIs |
| Transactions | Full CRUD operations with search, filter, and bulk import/export |
| Inventory | Product management, stock tracking, FIFO/LIFO valuation |
| Customers | Customer CRM with spending history |
| Payroll | Employee management, salary processing, tax calculation |
| Assets | Fixed asset tracking with depreciation |
| Bank | Manual bank account sync and transaction import |
| Reports | P&L, Balance Sheet, Cash Flow, and analytics |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/finwise.git
cd finwise

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Running the Built App

```bash
# Preview production build
pnpm run preview
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New Transaction |
| Ctrl+D | Dashboard |
| Ctrl+T | Transactions |
| Ctrl+R | Reports |
| Ctrl+S | Save (in forms) |
| Esc | Close modals |
| ? | Show shortcuts help |

---

## Features In Detail

### Dashboard
- Real-time income/expense/balance cards
- Expense breakdown pie chart
- Monthly income/expense trend bar chart
- 6-month cash flow projection
- Spending heatmap calendar
- Savings goals with progress bars
- Budget tracking with color-coded alerts
- Recurring bills management
- Recent transactions list
- Financial ratios (Profit Margin, ROI, Savings Rate)

### Transactions
- Add, edit, delete transactions
- Search by description or category
- Filter by income/expense/category
- Bulk CSV import/export
- PDF and Excel export
- Receipt OCR scanning (Tesseract.js)
- Voice command entry
- AI-powered category suggestions
- Split transaction support

### Inventory
- Add/edit/delete products
- Stock quantity tracking
- Low stock alerts
- FIFO/LIFO/Weighted Average valuation
- Stock adjustment with automatic journal entries
- Product categories

### Customers
- Customer database with contact info
- Purchase history tracking
- Total spent calculation
- Customer portal (coming soon)

### Payroll
- Employee database
- Monthly salary tracking
- Tax withholding calculation
- Net pay computation
- One-click payroll processing

### Assets
- Fixed asset register
- Purchase date and price tracking
- Useful life and salvage value
- Straight-line and declining balance depreciation
- Automatic annual depreciation calculation

### Bank
- Manual bank account connection
- Balance tracking
- Sync simulation (real API ready)
- Bank feed (configurable)

### Reports
- Profit & Loss statement
- Balance sheet
- Cash flow statement
- Yearly summary
- Advanced analytics (growth rates, top spending categories)
- Date range filtering

### Multi-Language
- English (🇺🇸)
- Farsi (🇮🇷) with full RTL support
- German (🇩🇪)
- Easy to add more languages

### Multi-Currency
- USD ($)
- EUR (€)
- GBP (£)
- IRR (﷼)
- TRY (₺)
- AMD (֏)
- Live exchange rates (free API)

### Data Security
- All data stored locally in IndexedDB
- No cloud, no servers, no accounts
- Optional AES-256 encryption
- Auto-backup every 5 minutes
- Manual backup/restore
- CSV/JSON export

---

## Project Structure

```
finwise/
├── src/
│   ├── App.tsx                 # Main application
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   ├── components/
│   │   └── Icon.tsx            # FontAwesome icons
│   ├── i18n/
│   │   ├── config.ts           # i18n configuration
│   │   └── locales/
│   │       ├── en.json         # English translations
│   │       ├── fa.json         # Farsi translations
│   │       └── de.json         # German translations
│   └── types/                  # TypeScript interfaces
├── public/                     # Static assets
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS + Custom CSS |
| Icons | FontAwesome 6 |
| Charts | Recharts |
| Database | IndexedDB (Dexie.js) |
| i18n | i18next |
| PDF Generation | jsPDF |
| Excel Export | SheetJS (XLSX) |
| OCR | Tesseract.js |
| PWA | Vite PWA Plugin |

---

## Development Timeline

| Phase | Duration | Key Achievements |
|-------|----------|------------------|
| Foundation | Day 1-2 | Core accounting engine, transaction CRUD, local storage |
| Features | Day 3-4 | Multi-currency, budgets, savings goals, recurring transactions |
| Modules | Day 5-6 | Inventory, customers, payroll, assets, loans, bank |
| Advanced | Day 7-8 | Reports, charts, analytics, heatmap, forecasting |
| AI & UX | Day 9-10 | AI categorization, chatbot, receipt OCR, voice commands |
| i18n & Polish | Day 11-12 | Full EN/FA/DE translations, RTL support, dark/light theme |
| Final | Day 13-14 | PWA, auto-backup, performance optimization, documentation |

**Total:** ~100+ hours | **Lines of code:** 15,000+ | **Features:** 70+ | **Languages:** 3

---

## Screenshots

*[Add screenshots of your app here]*

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome/Edge (latest) | ✅ Full |
| Firefox (latest) | ✅ Full |
| Safari (latest) | ✅ Full (limited OPFS) |
| Mobile browsers | ✅ PWA installable |

---

## License

MIT License – Free for personal and commercial use. Because financial tools should be accessible to everyone, everywhere.

---

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## Author

**Mohsen Jafari** - Creator, Developer, Designer

- GitHub: [mh3nj](https://github.com/mh3nj)
- LinkedIn: [mh3nj](https://linkedin.com/in/mh3nj)
- Websites: [Parsegan.com](https://parsegan.com) (logo design), [Dahgan.com](https://dahgan.com) (land surveying/portfolio)

---

## Acknowledgments

- React team for the amazing framework
- Tailwind CSS for utility-first styling
- i18next for seamless localization
- Recharts for beautiful charts
- Tesseract.js for OCR capabilities
- The open-source community
