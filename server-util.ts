/**
 * Server-side Utilities and Middleware
 * - Custom In-Memory Redis Session Store
 * - Cryptographic SHA-256 Hashing & AES-256-CBC Encryption
 * - Full-Stack JWT Session Authentication
 * - Simple JSON File Database (Durable State)
 * - Rate Limiter / Throttler (Token Bucket)
 * - Asynchronous Job Queue for Recommendations
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// Load Environment Secrets
const JWT_SECRET = process.env.JWT_SECRET || "cinematch_super_jwt_secret_key_999";
const CRYPTO_SALT = process.env.CRYPTO_SALT || "cinematch_crypt_salt_123";

// Determine File DB Path
const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "db.json");

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Ensure database file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
}

// -----------------------------------------------------------------
// 1. CRYPTO UTILITIES: SHA-256 Hashing & AES-256 Encryption
// -----------------------------------------------------------------
const AES_KEY = crypto.scryptSync(JWT_SECRET, CRYPTO_SALT, 32); 
const IV_LENGTH = 16;

/**
 * Hashes passwords securely using SHA-256.
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * Encrypts strings using AES-256-CBC.
 */
export function encryptAES(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", AES_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypts strings using AES-256-CBC.
 */
export function decryptAES(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts.shift() || "", "hex");
    const encrypted = Buffer.from(parts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", AES_KEY, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("AES Decryption failed. Returning raw text fallback.");
    return encryptedText;
  }
}

// -----------------------------------------------------------------
// 2. IN-MEMORY REDIS EMULATOR (JWT & Session Cache)
// -----------------------------------------------------------------
interface RedisValue {
  value: string;
  expiresAt: number | null; // Milliseconds timestamp
}

export class RedisEmulator {
  private store: Map<string, RedisValue>;

  constructor() {
    this.store = new Map<string, RedisValue>();
    // Automatic cleanup of expired entries
    setInterval(() => this.cleanupExpired(), 30000);
  }

  set(key: string, value: any, ttlSeconds: number | null = null): void {
    const stringifiedValue = typeof value === "string" ? value : JSON.stringify(value);
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value: stringifiedValue, expiresAt });
  }

  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  getParsed<T>(key: string): T | null {
    const value = this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  del(key: string): void {
    this.store.delete(key);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const redis = new RedisEmulator();

// -----------------------------------------------------------------
// 3. JWT UTILITIES & USER SEED/DATA UTILITIES
// -----------------------------------------------------------------
export interface TokenPayload {
  username: string;
  createdAt: string;
}

export function generateToken(username: string): string {
  const payload: TokenPayload = { username, createdAt: new Date().toISOString() };
  // Expire in 24 hours
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  
  // Cache the token in virtual Redis session store
  redis.set(`session:${username}`, token, 24 * 60 * 60);
  return token;
}

export function verifySessionToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Cross-verify with session storage inside Redis
    const cachedToken = redis.get(`session:${decoded.username}`);
    if (!cachedToken || cachedToken !== token) {
      return null; // Token has been revoked or expired on server/Redis session
    }
    
    return decoded;
  } catch (err) {
    return null;
  }
}

// -----------------------------------------------------------------
// 4. PERSISTENT REGISTRY (JSON Database layer)
// -----------------------------------------------------------------
export interface UserRecord {
  username: string;
  passwordHash: string; // SHA-256
  profileCreated: string;
  surveyAnswersEncrypted?: string; // AES Encrypted survey configuration
  watchlist: any[];
  watchedHistory: any[];
  ratings: any[];
}

export function readDatabase(): { users: Record<string, UserRecord> } {
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Database reading failed", err);
    return { users: {} };
  }
}

export function writeDatabase(data: any): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Database writing failed", err);
  }
}

export function getProfileByUsername(username: string): UserRecord | null {
  const db = readDatabase();
  const key = username.toLowerCase().trim();
  return db.users[key] || null;
}

// -----------------------------------------------------------------
// 5. IP/NAME LEVEL RATE LIMITING (Token-Bucket Throttler)
// -----------------------------------------------------------------
interface ClientBucket {
  tokens: number;
  lastRefill: number;
}

const LIMITS_STORE = new Map<string, ClientBucket>();
const MAX_TOKENS = 60; // Up to 60 API operations permitted per minute
const REFILL_RATE = 1; // 1 token added per second

export function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  let bucket = LIMITS_STORE.get(clientId);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    LIMITS_STORE.set(clientId, bucket);
    return true;
  }

  // Calculate elapsed time and add tokens proportionally
  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + elapsed * REFILL_RATE);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}

// -----------------------------------------------------------------
// 6. ASYNCHRONOUS BACKGROUND JOB ENGINE (Recommendations)
// -----------------------------------------------------------------
export interface RecommendationJob {
  jobId: string;
  username: string;
  status: "pending" | "processing" | "completed" | "failed";
  progressPercent: number;
  currentStepMessage: string;
  result?: any;
  error?: string;
  createdAt: number;
}

const JOBS_CACHE = new Map<string, RecommendationJob>();

export function createRecommendationJob(username: string): string {
  const jobId = "job-" + crypto.randomBytes(8).toString("hex");
  const newJob: RecommendationJob = {
    jobId,
    username,
    status: "pending",
    progressPercent: 5,
    currentStepMessage: "Enqueuing recommendation job in async pipeline...",
    createdAt: Date.now(),
  };
  JOBS_CACHE.set(jobId, newJob);
  return jobId;
}

export function getRecommendationJobStatus(jobId: string): RecommendationJob | null {
  const job = JOBS_CACHE.get(jobId);
  return job || null;
}

export function updateJobProgress(
  jobId: string, 
  status: RecommendationJob["status"], 
  percent: number, 
  msg: string, 
  result?: any,
  error?: string
): void {
  const job = JOBS_CACHE.get(jobId);
  if (job) {
    job.status = status;
    job.progressPercent = percent;
    job.currentStepMessage = msg;
    if (result) job.result = result;
    if (error) job.error = error;
    JOBS_CACHE.set(jobId, job);
    
    // Also mirror to Redis if completed
    if (status === "completed" && result) {
      redis.set(`recs:${job.username}`, result, 12 * 60 * 60); // Cache in Redis for 12 hours
    }
  }
}
