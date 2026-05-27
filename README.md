# FinWise – Smart Accounting for Everyone

Status: Stable Release v2.0
Build Date: May 27, 2026

A complete accounting application with 100+ features for individuals, small businesses, and enterprises. Everything runs offline, stores data locally, and respects your privacy. No cloud, no accounts, no subscription fees. Ever.


## About FinWise

FinWise started as a simple idea: financial software should be private, accessible, and free. The name comes from blending "Financial" with "Wisdom". Just like wisdom helps you make better decisions, FinWise helps you understand and manage your money.

The journey began on May 13, 2026. Two days later, a working version was ready. Since then, it has grown into something much bigger. Today, FinWise version 2.0 is a complete accounting system that never sends your data anywhere. Everything stays on your device.

### What FinWise Helps You Do

Track transactions, income, expenses, split transactions with categories.
Manage multiple currencies like USD, EUR, GBP, IRR, TRY, AMD with live exchange rates.
Generate professional PDF invoices with custom items.
Control inventory with product management, stock tracking, and low stock alerts.
Process payroll with employee management, salary calculation, and tax withholding.
Track fixed assets with straight line or declining balance depreciation.
Manage loans with amortization schedules and interest calculation.
Connect bank accounts manually (real API integration ready).
Set category budgets with real time progress alerts.
Save money with visual savings goals progress bars.
Automate recurring monthly, weekly, or yearly transactions.
Generate reports including P&L, Balance Sheet, Cash Flow, and yearly summaries.
Scan receipts using OCR technology.
Use voice commands to add transactions by speaking.
Get AI assistance with smart categorization and a chatbot.
Export your data to CSV, PDF, or Excel formats.
Enjoy auto backup every 5 minutes.
Switch between multiple languages including English, Farsi with full RTL support, and German.
Manage multiple companies and switch between them instantly.
Choose between light and dark themes with eye friendly gradients.

100+ integrated features. Dark and light themes. 100 percent offline. Zero telemetry. No account required.


## The Main Modules

Dashboard gives you a real time financial overview with charts, heatmaps, and key performance indicators.
Transactions offers full CRUD operations with search, filter, and bulk import and export.
Inventory handles product management, stock tracking, and FIFO or LIFO valuation.
Customers manages your customer relationships with spending history.
Payroll handles employee management, salary processing, and tax calculation.
Assets tracks fixed assets with depreciation calculations.
Bank connects your bank accounts manually and imports transactions.
Reports provides P&L, Balance Sheet, Cash Flow, and advanced analytics.


## Getting Started

What you need before starting:

Node.js version 18 or higher.
pnpm is recommended, but npm works too.

Installation steps:

git clone https://github.com/mh3nj/finwise.git
cd finwise
pnpm install
pnpm run dev

To build for production:

pnpm run build

To preview the production build:

pnpm run preview


## Keyboard Shortcuts

Ctrl + N creates a new transaction.
Ctrl + D takes you to the Dashboard.
Ctrl + T takes you to Transactions.
Ctrl + R takes you to Reports.
Ctrl + S saves forms when they are open.
Esc closes any open modal.
The question mark key shows the shortcuts help menu.


## Features in Detail

The Dashboard shows real time income, expenses, and balance cards. You get an expense breakdown pie chart and a monthly income versus expense trend bar chart. A 6 month cash flow projection helps you plan ahead. There is a spending heatmap calendar, savings goals with progress bars, and budget tracking with color coded alerts. You can see recurring bills and recent transactions. Financial ratios like Profit Margin, ROI, and Savings Rate are calculated automatically.

Transactions let you add, edit, and delete entries. You can search by description or category and filter by income, expense, or specific categories. Bulk CSV import and export are supported. You can also export to PDF and Excel. Receipt OCR scanning works with Tesseract.js. Voice command entry is available. AI powered category suggestions help you stay organized. Split transaction support is included.

Inventory management includes adding, editing, and deleting products. Stock quantity tracking comes with low stock alerts. Valuation methods include FIFO, LIFO, and Weighted Average. Stock adjustments create automatic journal entries. Products can be organized by category.

Customers are stored in a database with contact information. Purchase history is tracked and total spent is calculated. A customer portal is planned for a future release.

Payroll keeps an employee database with monthly salary tracking. Tax withholding is calculated automatically. Net pay is computed and you can process payroll with one click.

Assets are tracked with a fixed asset register. You can record purchase date and price, set useful life and salvage value. Depreciation methods include straight line and declining balance. Annual depreciation is calculated automatically.

Bank accounts can be connected manually. Balance tracking is included. Sync simulation is ready for real API integration. Bank feed is configurable.

Reports include Profit and Loss statement, Balance Sheet, and Cash Flow statement. Yearly summaries are available. Advanced analytics show growth rates and top spending categories. Date range filtering lets you focus on specific periods.

Multi Language support includes English, Farsi with full RTL support, and German. Adding more languages is easy.

Multi Currency supports USD, EUR, GBP, IRR, TRY, and AMD. Live exchange rates come from a free API with manual fallback.

Data Security means everything is stored locally in IndexedDB. No cloud, no servers, no accounts. Optional AES 256 encryption is available. Auto backup runs every 5 minutes. You can also backup and restore manually. CSV and JSON export are supported.


## Technology Stack

Frontend uses React 18 with TypeScript.
Build tool is Vite 5.
Styling uses Tailwind CSS with custom CSS.
Icons come from FontAwesome 6.
Charts are powered by Recharts.
Database is IndexedDB through Dexie.js.
Internationalization uses i18next.
PDF generation uses jsPDF.
Excel export uses SheetJS (XLSX).
OCR uses Tesseract.js.
PWA uses Vite PWA Plugin.


## Development Journey

The project started on May 13, 2026. The first version was ready in just two days. But the work did not stop there. Since then, features have been added, bugs have been fixed, and the app has grown into something much larger.

Day One, May 13, 2026 was about building the foundation. The morning session focused on planning the architecture, selecting the technology stack, setting up the repository, and installing dependencies. The core accounting engine came together with double entry ledger support. Basic transaction CRUD operations were added with localStorage. A simple UI with glass card design was created.

The afternoon session brought the Dashboard to life with stats cards and charts. The Transactions table gained search and filter capabilities. Multi currency support was added for USD, EUR, GBP, IRR, TRY, and AMD. Category management and AI suggestions were implemented. Dark and light theme toggling was added with persistence. A responsive sidebar navigation was built.

The evening session added CSV import and export. PDF report generation using jsPDF was implemented. Excel export using SheetJS was added. A basic notification system was created.

Day One ended with about 10 hours of work and 15 features completed.

Day Two, May 14, 2026 was about adding advanced features and polishing everything. The morning session added inventory management with products, stock tracking, and FIFO or LIFO valuation. Customer CRM with spending history was implemented. Payroll system with tax calculation came together. Fixed assets with depreciation were added. Loan management with amortization schedules was built.

The afternoon session added bank account integration with a mock API ready for real connections. Budget tracking with real time alerts was implemented. Savings goals with progress tracking were added. Recurring transactions automation came together. Receipt OCR scanning using Tesseract.js was integrated.

The evening session focused on PWA configuration for offline installation. Auto backup system was set to run every 5 minutes. An AI Chatbot with local responses was added. Voice command integration used the Web Speech API. Multi language support was implemented with English, Farsi including full RTL, and German. Full i18n was added with more than 200 translation keys.

The night session added advanced analytics showing growth rates and top spending categories. A spending heatmap calendar was created. Financial ratios like Profit Margin, ROI, and Savings Rate were added. A 6 month cash flow projection was built. Year over year comparison was implemented. Dark and light theme polishing happened. Final bug fixes and cross browser testing were completed.

Day Two ended with about 14 hours of work and more than 55 features completed.

In total, the initial development took around 24 hours over two days. The codebase reached over 15,000 lines. More than 84 features were implemented across 8 main modules. Support for 3 languages and 6 currencies was added. And the work has continued since then.

Version 2.0 represents many more hours of refinement, new features like the full screen search modal, better responsive design, and countless small improvements that make FinWise a joy to use.


## Key Achievements

Over 15,000 lines of production ready React and TypeScript code were written.
More than 100 features were integrated into the main modules.
The app works completely offline using IndexedDB.
Full RTL support was implemented for the Farsi language.
Beautiful grayscale gradients were created for both light and dark modes.
PWA support was added so the app can be installed on desktop and mobile.
A real time dashboard with live charts and heatmaps was built.
Voice commands allow hands free transaction entry.
AI powered categorization uses pattern matching.
Receipt OCR scanning uses Tesseract.js.
An auto backup system runs every 5 minutes.
Complete multi currency support with exchange rates was added.


## Challenges Faced

RTL support for Farsi required adding dir equals rtl and the tailwindcss rtl plugin.

TypeScript errors with window ethereum were fixed by adding a global declaration.

CSS conflicts with Tailwind were resolved using a custom override system with important flags.

IndexedDB async operations were managed with Dexie.js and proper async await patterns.

Dark mode persistence was achieved by storing preferences in localStorage with class toggling.

Large transaction lists were handled with pagination and virtual scrolling.

Real time chart updates used useEffect hooks to re render when data changed.

OCR accuracy was improved by training Tesseract on multiple receipt formats.

Voice recognition used the Web Speech API with language detection.


## What Comes Next

Real bank API integration with Plaid is planned.
Real ChatGPT integration is coming.
Real blockchain verification will be added.
A mobile React Native app is in the works.
A desktop Electron app is on the roadmap.
Multi user LAN sync using WebRTC will be added.
Recurring invoice generation is planned.
Email reports with SMTP will be implemented.
Stock market integration is coming.
Cryptocurrency support will be added.
Tax filing reports are on the list.
Receipt ML enhancement will improve scanning accuracy.
Budget sharing with family members is planned.
Split transactions and transaction templates are coming.


## Browser Support

Chrome and Edge latest versions are fully supported.
Firefox latest version is fully supported.
Safari latest version is fully supported with some OPFS limitations.
Mobile browsers can install FinWise as a PWA.


## Project Structure

finwise
src
App.tsx is the main application file.
main.tsx is the entry point.
index.css holds global styles.
components has the Icon.tsx file for FontAwesome icons.
i18n includes config.ts and locale files for English, Farsi, and German.
types holds TypeScript interfaces.
public contains static assets.
The root has index.html, package.json, vite.config.ts, tailwind.config.js, postcss.config.js, and this README file.


## License

FinWise is released under the MIT License. It is free for personal and commercial use. Financial tools should be accessible to everyone, everywhere.


## Contributing

Contributions are welcome. Fork the repository, create a feature branch, make your changes, commit them, push to your branch, and open a pull request. Please read the contributing guidelines before submitting.


## Author

Mohsen Jafari is the creator, developer, and designer of FinWise.

GitHub: mh3nj
LinkedIn: mh3nj
Websites: Parsegan.com for logo design and Dahgan.com for land surveying and portfolio work.

I built this project during internet restrictions in Iran. It proves that creativity and persistence have no boundaries.
Huge thanks to Aymeric Pineau for introducing me to Intlayer! This is a game-changer for automated translations.


## Acknowledgments

The React team created the amazing framework that powers FinWise.
Tailwind CSS made utility first styling a joy.
Dexie.js simplified IndexedDB work.
Recharts made beautiful charts possible.
i18next handled seamless localization.
Tesseract.js brought OCR capabilities to the browser.
FontAwesome provided clean icons.
The open source community keeps inspiring projects like this one.

FinWise grew from a two day experiment into something much bigger. It continues to evolve. Your money, your data, your control. :)
