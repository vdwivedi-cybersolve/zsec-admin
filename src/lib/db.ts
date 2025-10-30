import Dexie, { type Table } from "dexie";

export type UserRecord = {
  id: string;
  userid: string;
  name: string;
  defaultGroup: string;
  owner: string;
  status: "Active" | "Inactive";
  createdAt: string;
  authOption?: "1" | "2" | "3" | "4";
  expiration?: string;
};

class UserDatabase extends Dexie {
  users!: Table<UserRecord, string>;

  constructor() {
    super("mainframeUsers");
    this.version(1).stores({
      users: "id, userid",
    });
  }
}

export const db = new UserDatabase();

const DEFAULT_USERS: UserRecord[] = [
  {
    id: "seed-admin01",
    userid: "ADMIN01",
    name: "System Administrator",
    defaultGroup: "SYSADM",
    owner: "IBMUSER",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-jdoe",
    userid: "JDOE",
    name: "John Doe - Contractor",
    defaultGroup: "STAFF",
    owner: "ADMIN01",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-finance01",
    userid: "FINANCE01",
    name: "Finance User",
    defaultGroup: "FINANCE",
    owner: "ADMIN01",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

// Seed only once per browser profile. If the user later deletes all rows, do NOT reseed.
// We persist a flag in localStorage to remember that seeding already happened.
const SEEDED_FLAG_KEY = "mainframeUsers_seeded_v1";

export async function ensureSeedData() {
  const hasSeededBefore = (() => {
    try {
      return typeof localStorage !== "undefined" && localStorage.getItem(SEEDED_FLAG_KEY) === "true";
    } catch {
      return false;
    }
  })();

  const count = await db.users.count();

  if (!hasSeededBefore && count === 0) {
    await db.users.bulkAdd(DEFAULT_USERS);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(SEEDED_FLAG_KEY, "true");
      }
    } catch {
      // ignore storage errors; seeding is still idempotent based on count
    }
  }
}
