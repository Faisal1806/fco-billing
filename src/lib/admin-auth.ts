import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'fco_admin_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecret(): string {
  const secret = process.env.FCO_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('FCO_SESSION_SECRET is missing or invalid.');
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');
}

export function createAdminSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    })
  ).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payload, suppliedSignature] = parts;
    const expectedSignature = sign(payload);

    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);

    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      return false;
    }

    const data = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );

    return data.role === 'admin' &&
      Number.isFinite(data.exp) &&
      data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function isAdminAuthenticated(request: NextRequest): boolean {
  return verifyAdminSessionToken(
    request.cookies.get(ADMIN_COOKIE_NAME)?.value
  );
}

export const ADMIN_SESSION_MAX_AGE = SESSION_DURATION_SECONDS;
