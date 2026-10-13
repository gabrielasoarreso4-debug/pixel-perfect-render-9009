import { createHash, timingSafeEqual } from "node:crypto";

const MIN_SECRET_LENGTH = 32;
const MAX_SECRET_LENGTH = 256;

export function isBootstrapSecretConfigured(secret: string | undefined): secret is string {
  return typeof secret === "string" && secret.length >= MIN_SECRET_LENGTH && secret.length <= MAX_SECRET_LENGTH;
}

export function isBootstrapSecretValid(expected: string | undefined, supplied: string): boolean {
  if (!isBootstrapSecretConfigured(expected) || typeof supplied !== "string") return false;
  if (supplied.length < MIN_SECRET_LENGTH || supplied.length > MAX_SECRET_LENGTH) return false;

  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(expected), digest(supplied));
}
