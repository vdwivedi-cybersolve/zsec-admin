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

async function normalizeAndSeed() {
  await ensureSeedData();
}

export async function fetchUsers(): Promise<UserRecord[]> {
  await normalizeAndSeed();
  return db.users.orderBy("userid").toArray();
}

export async function createUser(payload: CreateUserPayload): Promise<UserRecord> {
  await normalizeAndSeed();

  const normalizedUserId = payload.userid.trim().toUpperCase();
  const defaultGroup = payload.defaultGroup.trim().toUpperCase();
  const existing = await db.users
    .where("userid")
    .equals(normalizedUserId)
    .first();

  if (existing) {
    throw new Error(`User ${normalizedUserId} already exists`);
  }

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
  await normalizeAndSeed();
  await db.users.delete(id);
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<UserRecord> {
  await normalizeAndSeed();

  const existing = await db.users.get(id);
  if (!existing) {
    throw new Error(`User with id ${id} not found`);
  }

  const updates: Partial<UserRecord> = {};
  if (payload.userid !== undefined) updates.userid = payload.userid.trim().toUpperCase();
  if (payload.name !== undefined) updates.name = payload.name.trim();
  if (payload.defaultGroup !== undefined) updates.defaultGroup = payload.defaultGroup.trim().toUpperCase();
  if (payload.owner !== undefined) updates.owner = payload.owner.trim().toUpperCase();
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.authOption !== undefined) updates.authOption = payload.authOption;
  if (payload.expiration !== undefined) updates.expiration = payload.expiration || null;

  await db.users.update(id, updates as any);
  const updated = await db.users.get(id);
  if (!updated) throw new Error("Failed to retrieve updated user");
  return updated;
}
