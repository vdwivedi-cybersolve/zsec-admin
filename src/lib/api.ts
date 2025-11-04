import { db, ensureSeedData, type UserRecord } from "./db";
export type { UserRecord } from "./db";

export type CreateUserPayload = {
  userid: string;
  name: string;
  defaultGroup: string;
  owner?: string;
  status?: "Active" | "Inactive";
  authOption?: "1" | "2" | "3" | "4";
  expiration?: string;
};

export type UpdateUserPayload = Partial<{
  userid: string;
  name: string;
  defaultGroup: string;
  owner: string;
  status: "Active" | "Inactive";
  authOption: "1" | "2" | "3" | "4";
  expiration: string | null;
}>;

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  ((import.meta as any).env?.PROD
    ? "https://zsec-admin-server.onrender.com/api"
    : "http://localhost:4000/api");

async function tryFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const bodyText = await res.text();
      if (bodyText) {
        const body = JSON.parse(bodyText);
        if (body?.message) message = body.message;
      }
    } catch {}
    throw new Error(message);
  }
  // No content
  if (res.status === 204 || res.status === 205) {
    return undefined as unknown as T;
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as unknown as T;
  }
  const text = await res.text();
  if (!text) return undefined as unknown as T;
  return JSON.parse(text) as T;
}

async function serverAvailable(): Promise<boolean> {
  try {
    await tryFetch(`${API_BASE}/health`);
    return true;
  } catch {
    return false;
  }
}

async function normalizeAndSeed() {
  await ensureSeedData();
}

export async function fetchUsers(): Promise<UserRecord[]> {
  if (await serverAvailable()) {
    return tryFetch<UserRecord[]>(`${API_BASE}/users`);
  }
  await normalizeAndSeed();
  return db.users.orderBy("userid").toArray();
}

export async function createUser(
  payload: CreateUserPayload
): Promise<UserRecord> {
  if (await serverAvailable()) {
    return tryFetch<UserRecord>(`${API_BASE}/users`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  await normalizeAndSeed();
  const normalizedUserId = payload.userid.trim().toUpperCase();
  const defaultGroup = payload.defaultGroup.trim().toUpperCase();
  const existing = await db.users
    .where("userid")
    .equals(normalizedUserId)
    .first();
  if (existing) throw new Error(`User ${normalizedUserId} already exists`);

  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    userid: normalizedUserId,
    name: payload.name.trim(),
    defaultGroup,
    owner: payload.owner?.trim().toUpperCase() || "IBMUSER",
    status: payload.status ?? "Active",
    createdAt: new Date().toISOString(),
    authOption: payload.authOption,
    expiration: payload.expiration,
  };
  await db.users.add(newUser);
  return newUser;
}

export async function deleteUser(id: string): Promise<void> {
  if (await serverAvailable()) {
    await tryFetch<void>(`${API_BASE}/users/${id}`, { method: "DELETE" });
    return;
  }
  await normalizeAndSeed();
  await db.users.delete(id);
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload
): Promise<UserRecord> {
  if (await serverAvailable()) {
    return tryFetch<UserRecord>(`${API_BASE}/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  await normalizeAndSeed();
  const existing = await db.users.get(id);
  if (!existing) throw new Error(`User with id ${id} not found`);

  const updates: Partial<UserRecord> = {};
  if (payload.userid !== undefined)
    updates.userid = payload.userid.trim().toUpperCase();
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.defaultGroup !== undefined)
    updates.defaultGroup = payload.defaultGroup.trim().toUpperCase();
  if (payload.owner !== undefined)
    updates.owner = payload.owner.trim().toUpperCase();
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.authOption !== undefined) updates.authOption = payload.authOption;
  if (payload.expiration !== undefined)
    updates.expiration = payload.expiration || null;

  await db.users.update(id, updates as any);
  const updated = await db.users.get(id);
  if (!updated) throw new Error("Failed to retrieve updated user");
  return updated;
}
