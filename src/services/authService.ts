export type UserRole = "freight-owner" | "transporter" | "admin";

export type RegistrationRole = "freight-owner" | "transporter";

export interface RegisterUserInput {
  role: RegistrationRole;
  organizationName: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  loggedInAt: string;
}

interface StoredUser {
  id: string;
  role: RegistrationRole;
  organizationName: string;
  fullName: string;
  email: string;
  phoneNumber: string;

  passwordHash: string;
  passwordSalt: string;

  complianceStatus: "pending";
  rating: number;
  createdAt: string;
}

const USERS_STORAGE_KEY = "tamp-users";
const SESSION_STORAGE_KEY = "tamp-session";

const PBKDF2_ITERATIONS = 100_000;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
};

const base64ToArrayBuffer = (value: string): ArrayBuffer => {
  const binary = atob(value);

  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return buffer;
};

const bytesToArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(bytes.byteLength);

  new Uint8Array(buffer).set(bytes);

  return buffer;
};

const derivePasswordHash = async (
  password: string,
  salt: ArrayBuffer,
): Promise<string> => {
  const passwordBytes = new TextEncoder().encode(password);

  const passwordBuffer = bytesToArrayBuffer(passwordBytes);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    {
      name: "PBKDF2",
    },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return bytesToBase64(new Uint8Array(derivedBits));
};

const getStoredUsers = (): StoredUser[] => {
  const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);

  if (!storedUsers) {
    return [];
  }

  try {
    const parsedUsers: unknown = JSON.parse(storedUsers);

    if (!Array.isArray(parsedUsers)) {
      return [];
    }

    return parsedUsers as StoredUser[];
  } catch {
    return [];
  }
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const registerUser = async (input: RegisterUserInput): Promise<void> => {
  const users = getStoredUsers();

  const email = normalizeEmail(input.email);

  const emailAlreadyExists = users.some((user) => user.email === email);

  if (emailAlreadyExists) {
    throw new Error("An account with this email address already exists.");
  }

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));

  const saltBuffer = bytesToArrayBuffer(saltBytes);

  const passwordHash = await derivePasswordHash(input.password, saltBuffer);

  const newUser: StoredUser = {
    id: crypto.randomUUID(),

    role: input.role,

    organizationName: input.organizationName.trim(),

    fullName: input.fullName.trim(),

    email,

    phoneNumber: input.phoneNumber.trim(),

    passwordHash,

    passwordSalt: bytesToBase64(saltBytes),

    complianceStatus: "pending",

    rating: 0,

    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);
};

export const authenticateRegisteredUser = async (
  email: string,
  password: string,
): Promise<UserSession | null> => {
  const users = getStoredUsers();

  const normalizedEmail = normalizeEmail(email);

  const user = users.find((storedUser) => storedUser.email === normalizedEmail);

  if (!user) {
    return null;
  }

  const saltBuffer = base64ToArrayBuffer(user.passwordSalt);

  const enteredPasswordHash = await derivePasswordHash(password, saltBuffer);

  if (enteredPasswordHash !== user.passwordHash) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    loggedInAt: new Date().toISOString(),
  };
};

const isUserRole = (value: unknown): value is UserRole => {
  return (
    value === "freight-owner" || value === "transporter" || value === "admin"
  );
};

const isUserSession = (value: unknown): value is UserSession => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    typeof session.id === "string" &&
    typeof session.email === "string" &&
    isUserRole(session.role) &&
    typeof session.loggedInAt === "string"
  );
};

const parseSession = (value: string | null): UserSession | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    return isUserSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const getCurrentSession = (): UserSession | null => {
  const sessionValue =
    sessionStorage.getItem(SESSION_STORAGE_KEY) ??
    localStorage.getItem(SESSION_STORAGE_KEY);

  return parseSession(sessionValue);
};

export const clearCurrentSession = (): void => {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);
};
