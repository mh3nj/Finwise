import Dexie, { Table } from "dexie";
import { Account, Company, Settings, Transaction } from "../types";

export class AccountantDatabase extends Dexie {
  transactions!: Table<Transaction>;
  accounts!: Table<Account>;
  companies!: Table<Company>;
  settings!: Table<Settings>;

  constructor() {
    super("AccountantManager");
    this.version(1).stores({
      transactions: "id, date, amount, currency, category, accountId",
      accounts: "id, code, type, name",
      companies: "id, name, currency",
      settings: "language, currency, theme",
    });
  }
}

export const db = new AccountantDatabase();

// Initialize default data
export async function initializeDatabase() {
  const accountCount = await db.accounts.count();
  if (accountCount === 0) {
    // Default chart of accounts
    await db.accounts.bulkAdd([
      {
        id: "1",
        code: "1000",
        name: "Cash",
        type: "asset",
        balance: 0,
        isActive: true,
      },
      {
        id: "2",
        code: "2000",
        name: "Bank Account",
        type: "asset",
        balance: 0,
        isActive: true,
      },
      {
        id: "3",
        code: "3000",
        name: "Accounts Receivable",
        type: "asset",
        balance: 0,
        isActive: true,
      },
      {
        id: "4",
        code: "4000",
        name: "Office Supplies",
        type: "expense",
        balance: 0,
        isActive: true,
      },
      {
        id: "5",
        code: "5000",
        name: "Rent",
        type: "expense",
        balance: 0,
        isActive: true,
      },
      {
        id: "6",
        code: "6000",
        name: "Salary",
        type: "expense",
        balance: 0,
        isActive: true,
      },
      {
        id: "7",
        code: "7000",
        name: "Sales Revenue",
        type: "revenue",
        balance: 0,
        isActive: true,
      },
      {
        id: "8",
        code: "8000",
        name: "Service Income",
        type: "revenue",
        balance: 0,
        isActive: true,
      },
    ]);
  }
}
