import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { JSONFile } from "lowdb/node";
import { Low } from "lowdb";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "users.json");
const PORT = Number(process.env.PORT ?? 4000);

// App login-gate credential. Override in production via Render env vars.
const ADMIN_LOGIN_ID = (process.env.ADMIN_LOGIN_ID ?? "ADMIN").toUpperCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin";

const DEFAULT_USERS = [
  {
    id: "seed-admin01",
    userid: "ADMIN01",
    name: "System Administrator",
    defaultGroup: "SYSADM",
    owner: "IBMUSER",
    status: "Active",
    createdAt: new Date().toISOString(),
    connectGroups: [],
  },
  {
    id: "seed-jdoe",
    userid: "JDOE",
    name: "John Doe - Contractor",
    defaultGroup: "STAFF",
    owner: "ADMIN01",
    status: "Active",
    createdAt: new Date().toISOString(),
    connectGroups: [],
  },
  {
    id: "seed-finance01",
    userid: "FINANCE01",
    name: "Finance User",
    defaultGroup: "FINANCE",
    owner: "ADMIN01",
    status: "Active",
    createdAt: new Date().toISOString(),
    connectGroups: [],
  },
];

const DEFAULT_GROUPS = [
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

await fs.mkdir(DATA_DIR, { recursive: true });

const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { users: DEFAULT_USERS, groups: DEFAULT_GROUPS });

await db.read();

// Initialise / migrate the store so both `users` and `groups` always exist.
if (!db.data || typeof db.data !== "object") {
  db.data = { users: [...DEFAULT_USERS], groups: [...DEFAULT_GROUPS] };
  await db.write();
} else {
  let changed = false;
  if (!Array.isArray(db.data.users) || db.data.users.length === 0) {
    db.data.users = [...DEFAULT_USERS];
    changed = true;
  }
  if (!Array.isArray(db.data.groups)) {
    db.data.groups = [...DEFAULT_GROUPS];
    changed = true;
  }
  // Backfill connectGroups on pre-existing user rows.
  for (const user of db.data.users) {
    if (!Array.isArray(user.connectGroups)) {
      user.connectGroups = [];
      changed = true;
    }
  }
  if (changed) await db.write();
}

// In-memory session tokens for the login gate. Cleared on server restart.
const activeTokens = new Map(); // token -> { loginId, createdAt }

const normalizeGroupList = (groups) => {
  if (!Array.isArray(groups)) return [];
  const seen = new Set();
  for (const g of groups) {
    if (typeof g !== "string") continue;
    const normalized = g.trim().toUpperCase();
    if (normalized) seen.add(normalized);
  }
  return Array.from(seen);
};

const userSchema = z.object({
  userid: z
    .string()
    .trim()
    .min(1, "User ID is required")
    .max(8, "User ID must be at most 8 characters"),
  name: z.string().trim().min(1, "Name is required"),
  defaultGroup: z.string().trim().min(1, "Default group is required"),
  owner: z.string().trim().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
  authOption: z.enum(["1", "2", "3", "4"]).optional(),
  expiration: z.string().trim().nullable().optional(),
  connectGroups: z.array(z.string()).optional(),
});

const groupSchema = z.object({
  group: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(8, "Group name must be at most 8 characters"),
  owner: z.string().trim().optional(),
  superiorGroup: z.string().trim().optional(),
  installationData: z.string().trim().nullable().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

const credentialsSchema = z.object({
  loginId: z.string().trim().min(1, "Login ID is required"),
  password: z.string().min(1, "Password is required"),
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Authentication (app login gate) -------------------------------------

app.post("/api/auth/login", (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid credentials payload",
      issues: parsed.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.join("."),
      })),
    });
  }

  const loginId = parsed.data.loginId.trim().toUpperCase();
  const passwordOk = parsed.data.password === ADMIN_PASSWORD;
  if (loginId !== ADMIN_LOGIN_ID || !passwordOk) {
    return res.status(401).json({ message: "Invalid Login ID or Password" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  activeTokens.set(token, { loginId, createdAt: new Date().toISOString() });
  res.json({ token, loginId });
});

const tokenFromHeader = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
};

app.get("/api/auth/me", (req, res) => {
  const token = tokenFromHeader(req);
  const session = token && activeTokens.get(token);
  if (!session) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json({ loginId: session.loginId });
});

app.post("/api/auth/logout", (req, res) => {
  const token = tokenFromHeader(req);
  if (token) activeTokens.delete(token);
  res.status(204).send();
});

// --- Users ----------------------------------------------------------------

app.get("/api/users", async (_req, res, next) => {
  try {
    await db.read();
    res.json(db.data?.users ?? []);
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", async (req, res, next) => {
  try {
    const parsed = userSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid user payload",
        issues: parsed.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join("."),
        })),
      });
    }

    const payload = {
      ...parsed.data,
      owner: parsed.data.owner?.trim() || "IBMUSER",
      status: parsed.data.status ?? "Active",
      authOption: parsed.data.authOption ?? "1",
      connectGroups: normalizeGroupList(parsed.data.connectGroups),
    };

    await db.read();

    const existingUsers = db.data?.users ?? [];
    const duplicate = existingUsers.find(
      (user) => user.userid.toUpperCase() === payload.userid.toUpperCase()
    );

    if (duplicate) {
      return res.status(409).json({
        message: `User ${payload.userid.toUpperCase()} already exists`,
      });
    }

    const newUser = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
    };

    existingUsers.push(newUser);
    db.data.users = existingUsers;
    await db.write();

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;
    await db.read();
    const existingUsers = db.data?.users ?? [];
    const index = existingUsers.findIndex((user) => user.id === userId);

    if (index === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    existingUsers.splice(index, 1);
    db.data.users = existingUsers;
    await db.write();

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const parsed = userSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid user payload",
        issues: parsed.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join("."),
        })),
      });
    }

    await db.read();
    const users = db.data?.users ?? [];
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const current = users[idx];
    const normalized = {
      ...current,
      ...(parsed.data.userid !== undefined
        ? { userid: parsed.data.userid.trim().toUpperCase() }
        : {}),
      ...(parsed.data.name !== undefined
        ? { name: parsed.data.name.trim() }
        : {}),
      ...(parsed.data.defaultGroup !== undefined
        ? { defaultGroup: parsed.data.defaultGroup.trim().toUpperCase() }
        : {}),
      ...(parsed.data.owner !== undefined
        ? { owner: parsed.data.owner.trim().toUpperCase() }
        : {}),
      ...(parsed.data.status !== undefined
        ? { status: parsed.data.status }
        : {}),
      ...(parsed.data.authOption !== undefined
        ? { authOption: parsed.data.authOption }
        : {}),
      ...(parsed.data.expiration !== undefined
        ? { expiration: parsed.data.expiration || null }
        : {}),
      ...(parsed.data.connectGroups !== undefined
        ? { connectGroups: normalizeGroupList(parsed.data.connectGroups) }
        : {}),
    };

    // Enforce unique userid across records (excluding this record)
    if (
      normalized.userid &&
      users.some(
        (u) =>
          u.id !== id &&
          u.userid.toUpperCase() === normalized.userid.toUpperCase()
      )
    ) {
      return res
        .status(409)
        .json({ message: `User ${normalized.userid} already exists` });
    }

    users[idx] = normalized;
    db.data.users = users;
    await db.write();

    res.json(normalized);
  } catch (error) {
    next(error);
  }
});

// --- Groups ---------------------------------------------------------------

app.get("/api/groups", async (_req, res, next) => {
  try {
    await db.read();
    res.json(db.data?.groups ?? []);
  } catch (error) {
    next(error);
  }
});

app.post("/api/groups", async (req, res, next) => {
  try {
    const parsed = groupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid group payload",
        issues: parsed.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join("."),
        })),
      });
    }

    const payload = {
      group: parsed.data.group.trim().toUpperCase(),
      owner: parsed.data.owner?.trim().toUpperCase() || "IBMUSER",
      superiorGroup: parsed.data.superiorGroup?.trim().toUpperCase() || "SYS1",
      installationData: parsed.data.installationData?.trim() || undefined,
      status: parsed.data.status ?? "Active",
    };

    await db.read();
    const groups = db.data?.groups ?? [];
    const duplicate = groups.find((g) => g.group === payload.group);
    if (duplicate) {
      return res
        .status(409)
        .json({ message: `Group ${payload.group} already exists` });
    }

    const newGroup = {
      id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
    };
    groups.push(newGroup);
    db.data.groups = groups;
    await db.write();

    res.status(201).json(newGroup);
  } catch (error) {
    next(error);
  }
});

app.put("/api/groups/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const parsed = groupSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid group payload",
        issues: parsed.error.issues.map((issue) => ({
          message: issue.message,
          path: issue.path.join("."),
        })),
      });
    }

    await db.read();
    const groups = db.data?.groups ?? [];
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Group not found" });
    }

    const current = groups[idx];
    const normalized = {
      ...current,
      ...(parsed.data.group !== undefined
        ? { group: parsed.data.group.trim().toUpperCase() }
        : {}),
      ...(parsed.data.owner !== undefined
        ? { owner: parsed.data.owner.trim().toUpperCase() }
        : {}),
      ...(parsed.data.superiorGroup !== undefined
        ? { superiorGroup: parsed.data.superiorGroup.trim().toUpperCase() }
        : {}),
      ...(parsed.data.installationData !== undefined
        ? { installationData: parsed.data.installationData?.trim() || undefined }
        : {}),
      ...(parsed.data.status !== undefined
        ? { status: parsed.data.status }
        : {}),
    };

    // Enforce unique group name (excluding this record).
    if (
      normalized.group !== current.group &&
      groups.some((g) => g.id !== id && g.group === normalized.group)
    ) {
      return res
        .status(409)
        .json({ message: `Group ${normalized.group} already exists` });
    }

    groups[idx] = normalized;
    db.data.groups = groups;

    // Propagate a rename into users' connectGroups.
    if (normalized.group !== current.group) {
      for (const user of db.data.users ?? []) {
        if (Array.isArray(user.connectGroups) && user.connectGroups.includes(current.group)) {
          user.connectGroups = normalizeGroupList(
            user.connectGroups.map((g) => (g === current.group ? normalized.group : g))
          );
        }
      }
    }

    await db.write();
    res.json(normalized);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/groups/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    await db.read();
    const groups = db.data?.groups ?? [];
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) {
      return res.status(404).json({ message: "Group not found" });
    }

    const [removed] = groups.splice(idx, 1);
    db.data.groups = groups;

    // Detach the deleted group from any connected users.
    for (const user of db.data.users ?? []) {
      if (Array.isArray(user.connectGroups) && user.connectGroups.includes(removed.group)) {
        user.connectGroups = user.connectGroups.filter((g) => g !== removed.group);
      }
    }

    await db.write();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error" });
});

app.listen(PORT, () => {
  console.log(`User management API ready on http://localhost:${PORT}`);
});
