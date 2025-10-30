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

let seeded = false;

export async function ensureSeedData() {
  if (seeded) return;
  const count = await db.users.count();
  if (count === 0) {
    await db.users.bulkAdd(DEFAULT_USERS);
  }
  seeded = true;
}
