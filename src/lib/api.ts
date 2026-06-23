import { db, ensureSeedData, type GroupRecord, type UserRecord } from "./db";
export type { GroupRecord, UserRecord } from "./db";

export type CreateUserPayload = {
  userid: string;
  name: string;
  defaultGroup: string;
  owner?: string;
  status?: "Active" | "Inactive";
  authOption?: "1" | "2" | "3" | "4";
  expiration?: string;
  connectGroups?: string[];
};

export type UpdateUserPayload = Partial<{
  userid: string;
  name: string;
  defaultGroup: string;
  owner: string;
  status: "Active" | "Inactive";
  authOption: "1" | "2" | "3" | "4";
  expiration: string | null;
  connectGroups: string[];
}>;

export type CreateGroupPayload = {
  group: string;
  owner?: string;
  superiorGroup?: string;
  installationData?: string;
  status?: "Active" | "Inactive";
};

export type UpdateGroupPayload = Partial<{
  group: string;
  owner: string;
  superiorGroup: string;
  installationData: string | null;
  status: "Active" | "Inactive";
}>;

export type AuthSession = {
  token: string;
  loginId: string;
};

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
    connectGroups: normalizeGroupList(payload.connectGroups),
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
  if (payload.connectGroups !== undefined)
    updates.connectGroups = normalizeGroupList(payload.connectGroups);

  await db.users.update(id, updates as any);
  const updated = await db.users.get(id);
  if (!updated) throw new Error("Failed to retrieve updated user");
  return updated;
}

function normalizeGroupList(groups?: string[]): string[] {
  if (!groups) return [];
  const seen = new Set<string>();
  for (const g of groups) {
    const normalized = g.trim().toUpperCase();
    if (normalized) seen.add(normalized);
  }
  return Array.from(seen);
}

// --- Groups ---------------------------------------------------------------

export async function fetchGroups(): Promise<GroupRecord[]> {
  if (await serverAvailable()) {
    return tryFetch<GroupRecord[]>(`${API_BASE}/groups`);
  }
  await normalizeAndSeed();
  return db.groups.orderBy("group").toArray();
}

export async function createGroup(
  payload: CreateGroupPayload
): Promise<GroupRecord> {
  if (await serverAvailable()) {
    return tryFetch<GroupRecord>(`${API_BASE}/groups`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  await normalizeAndSeed();
  const normalizedGroup = payload.group.trim().toUpperCase();
  if (!normalizedGroup) throw new Error("Group name is required");
  const existing = await db.groups
    .where("group")
    .equals(normalizedGroup)
    .first();
  if (existing) throw new Error(`Group ${normalizedGroup} already exists`);

  const newGroup: GroupRecord = {
    id: crypto.randomUUID(),
    group: normalizedGroup,
    owner: payload.owner?.trim().toUpperCase() || "IBMUSER",
    superiorGroup: payload.superiorGroup?.trim().toUpperCase() || "SYS1",
    installationData: payload.installationData?.trim() || undefined,
    status: payload.status ?? "Active",
    createdAt: new Date().toISOString(),
  };
  await db.groups.add(newGroup);
  return newGroup;
}

export async function updateGroup(
  id: string,
  payload: UpdateGroupPayload
): Promise<GroupRecord> {
  if (await serverAvailable()) {
    return tryFetch<GroupRecord>(`${API_BASE}/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  await normalizeAndSeed();
  const existing = await db.groups.get(id);
  if (!existing) throw new Error(`Group with id ${id} not found`);

  const updates: Partial<GroupRecord> = {};
  if (payload.group !== undefined)
    updates.group = payload.group.trim().toUpperCase();
  if (payload.owner !== undefined)
    updates.owner = payload.owner.trim().toUpperCase();
  if (payload.superiorGroup !== undefined)
    updates.superiorGroup = payload.superiorGroup.trim().toUpperCase();
  if (payload.installationData !== undefined)
    updates.installationData = payload.installationData?.trim() || undefined;
  if (payload.status !== undefined) updates.status = payload.status;

  if (updates.group && updates.group !== existing.group) {
    const duplicate = await db.groups
      .where("group")
      .equals(updates.group)
      .first();
    if (duplicate && duplicate.id !== id)
      throw new Error(`Group ${updates.group} already exists`);
  }

  const previousName = existing.group;
  await db.groups.update(id, updates as any);
  const updated = await db.groups.get(id);
  if (!updated) throw new Error("Failed to retrieve updated group");

  if (updates.group && updates.group !== previousName) {
    await renameGroupInConnections(previousName, updates.group);
  }
  return updated;
}

export async function deleteGroup(id: string): Promise<void> {
  if (await serverAvailable()) {
    await tryFetch<void>(`${API_BASE}/groups/${id}`, { method: "DELETE" });
    return;
  }
  await normalizeAndSeed();
  const existing = await db.groups.get(id);
  await db.groups.delete(id);
  if (existing) await removeGroupFromAllUsers(existing.group);
}

// --- User <-> Group connections ------------------------------------------

/** Replace the full set of connected groups for a single user. */
export async function setUserGroups(
  userId: string,
  groups: string[]
): Promise<UserRecord> {
  return updateUser(userId, { connectGroups: groups });
}

/** Connect one group to many users (used by bulk "Assign to Group"). */
export async function assignGroupToUsers(
  group: string,
  userIds: string[]
): Promise<void> {
  const normalized = group.trim().toUpperCase();
  if (!normalized) throw new Error("Group name is required");
  for (const userId of userIds) {
    const user = await getUserById(userId);
    if (!user) continue;
    const next = new Set([...(user.connectGroups ?? []), normalized]);
    await updateUser(userId, { connectGroups: Array.from(next) });
  }
}

/** Remove a single group connection from a single user. */
export async function removeGroupFromUser(
  userId: string,
  group: string
): Promise<UserRecord> {
  const normalized = group.trim().toUpperCase();
  const user = await getUserById(userId);
  if (!user) throw new Error(`User with id ${userId} not found`);
  const next = (user.connectGroups ?? []).filter((g) => g !== normalized);
  return updateUser(userId, { connectGroups: next });
}

async function getUserById(id: string): Promise<UserRecord | undefined> {
  const users = await fetchUsers();
  return users.find((u) => u.id === id);
}

async function renameGroupInConnections(from: string, to: string) {
  const users = await fetchUsers();
  for (const user of users) {
    if (user.connectGroups?.includes(from)) {
      const next = Array.from(
        new Set(user.connectGroups.map((g) => (g === from ? to : g)))
      );
      await updateUser(user.id, { connectGroups: next });
    }
  }
}

async function removeGroupFromAllUsers(group: string) {
  const users = await fetchUsers();
  for (const user of users) {
    if (user.connectGroups?.includes(group)) {
      await updateUser(user.id, {
        connectGroups: user.connectGroups.filter((g) => g !== group),
      });
    }
  }
}

// --- Authentication (app login gate) -------------------------------------

// Local fallback credential, used only when the API server is unreachable.
const LOCAL_ADMIN_LOGIN_ID = "ADMIN";
const LOCAL_ADMIN_PASSWORD = "admin";

export async function login(
  loginId: string,
  password: string
): Promise<AuthSession> {
  if (await serverAvailable()) {
    return tryFetch<AuthSession>(`${API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ loginId, password }),
    });
  }

  // Offline fallback: validate against the built-in admin credential.
  if (
    loginId.trim().toUpperCase() === LOCAL_ADMIN_LOGIN_ID &&
    password === LOCAL_ADMIN_PASSWORD
  ) {
    return {
      token: `local-${crypto.randomUUID()}`,
      loginId: LOCAL_ADMIN_LOGIN_ID,
    };
  }
  throw new Error("Invalid Login ID or Password");
}

export async function verifySession(token: string): Promise<AuthSession> {
  // Locally-issued tokens are always valid for this browser session.
  if (token.startsWith("local-")) {
    return { token, loginId: LOCAL_ADMIN_LOGIN_ID };
  }
  if (await serverAvailable()) {
    const me = await tryFetch<{ loginId: string }>(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { token, loginId: me.loginId };
  }
  throw new Error("Session could not be verified");
}

export async function logout(token: string): Promise<void> {
  if (token.startsWith("local-")) return;
  if (await serverAvailable()) {
    await tryFetch<void>(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
