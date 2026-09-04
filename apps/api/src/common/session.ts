import { createHash, randomBytes } from "node:crypto";
import type { CookieOptions, Request, Response } from "express";

export const SESSION_COOKIE_NAME = "football_bets_session";

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function sessionDurationMs(): number {
  return positiveInteger(process.env.SESSION_TTL_DAYS, 30) * 24 * 60 * 60 * 1_000;
}

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(): CookieOptions {
  const configured = process.env.COOKIE_SECURE?.trim().toLowerCase();
  const secure = configured
    ? configured === "true"
    : (process.env.APP_PUBLIC_URL ?? "").startsWith("https://");
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
  };
}

export function setSessionCookie(response: Response, token: string): void {
  response.cookie(SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: sessionDurationMs(),
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE_NAME, cookieOptions());
}

function cookieValue(header: string | undefined, name: string): string | null {
  for (const part of header?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }
  return null;
}

export function requestSessionToken(request: Request): string | null {
  const cookieToken = cookieValue(request.headers.cookie, SESSION_COOKIE_NAME);
  if (cookieToken) return cookieToken;

  // Bearer support is retained for first-party tests and non-browser API clients.
  const [scheme, bearerToken] = request.headers.authorization?.split(" ") ?? [];
  return scheme === "Bearer" && bearerToken ? bearerToken : null;
}
