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
  /** Additional RACF groups this user is connected to (beyond the default group). */
  connectGroups?: string[];
};

export type GroupRecord = {
  id: string;
  group: string;
  owner: string;
  superiorGroup: string;
  installationData?: string;
  status: "Active" | "Inactive";
  createdAt: string;
};

class UserDatabase extends Dexie {
  users!: Table<UserRecord, string>;
  groups!: Table<GroupRecord, string>;

  constructor() {
    super("mainframeUsers");
    this.version(1).stores({
      users: "id, userid",
    });
    // v2 adds the RACF groups table. connectGroups on users is not indexed,
    // so existing user rows upgrade transparently with no migration step.
    this.version(2).stores({
      users: "id, userid",
      groups: "id, group",
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

const DEFAULT_GROUPS: GroupRecord[] = [
  {
    id: "seed-group-sysadm",
    group: "SYSADM",
    owner: "IBMUSER",
    superiorGroup: "SYS1",
    installationData: "System administration group",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-group-staff",
    group: "STAFF",
    owner: "ADMIN01",
    superiorGroup: "SYS1",
    installationData: "General staff group",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "seed-group-finance",
    group: "FINANCE",
    owner: "ADMIN01",
    superiorGroup: "SYS1",
    installationData: "Finance department group",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];

// Seed only once per browser profile. If the user later deletes all rows, do NOT reseed.
// We persist a flag in localStorage to remember that seeding already happened.
const SEEDED_FLAG_KEY = "mainframeUsers_seeded_v1";
const GROUPS_SEEDED_FLAG_KEY = "mainframeGroups_seeded_v1";

function hasSeeded(flagKey: string): boolean {
  try {
    return (
      typeof localStorage !== "undefined" &&
      localStorage.getItem(flagKey) === "true"
    );
  } catch {
    return false;
  }
}

function markSeeded(flagKey: string) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(flagKey, "true");
    }
  } catch {
    // ignore storage errors; seeding is still idempotent based on count
  }
}

export async function ensureSeedData() {
  const userCount = await db.users.count();
  if (!hasSeeded(SEEDED_FLAG_KEY) && userCount === 0) {
    await db.users.bulkAdd(DEFAULT_USERS);
    markSeeded(SEEDED_FLAG_KEY);
  }

  const groupCount = await db.groups.count();
  if (!hasSeeded(GROUPS_SEEDED_FLAG_KEY) && groupCount === 0) {
    await db.groups.bulkAdd(DEFAULT_GROUPS);
    markSeeded(GROUPS_SEEDED_FLAG_KEY);
  }
}
