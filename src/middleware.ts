import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'fco_admin_session';

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function verifySession(token: string | undefined): Promise<boolean> {
  try {
    const secret = process.env.FCO_SESSION_SECRET;
    if (!token || !secret || secret.length < 32) return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payload, signature] = parts;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(signature),
      new TextEncoder().encode(payload)
    );

    if (!validSignature) return false;

    const session = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(payload))
    );

    return session.role === 'admin' &&
      Number.isFinite(session.exp) &&
      session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Keep admin login, customer portal and authentication endpoints accessible.
  if (
    pathname === '/login' ||
    pathname.startsWith('/portal') ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (await verifySession(token)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.' },
      { status: 401 }
    );
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|animations/).*)',
  ],
};
