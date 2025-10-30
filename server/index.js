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

const DEFAULT_USERS = [
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

await fs.mkdir(DATA_DIR, { recursive: true });

const adapter = new JSONFile(DB_FILE);
const db = new Low(adapter, { users: DEFAULT_USERS });

await db.read();

if (!db.data || !Array.isArray(db.data.users)) {
  db.data = { users: [...DEFAULT_USERS] };
  await db.write();
} else if (db.data.users.length === 0) {
  db.data.users.push(...DEFAULT_USERS);
  await db.write();
}

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
  expiration: z.string().trim().optional(),
});

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

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

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Unexpected server error" });
});

app.listen(PORT, () => {
  console.log(`User management API ready on http://localhost:${PORT}`);
});
