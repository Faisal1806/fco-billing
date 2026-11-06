import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
} from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { success: false, error: 'Invalid request origin.' },
        { status: 403 }
      );
    }

    const configuredPassword = process.env.FCO_ADMIN_PASSWORD;
    const configuredSecret = process.env.FCO_SESSION_SECRET;

    if (!configuredPassword || !configuredSecret || configuredSecret.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Server authentication is not configured.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const suppliedPassword =
      typeof body?.password === 'string' ? body.password : '';

    const supplied = Buffer.from(suppliedPassword);
    const expected = Buffer.from(configuredPassword);

    const valid =
      supplied.length === expected.length &&
      timingSafeEqual(supplied, expected);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid security credentials.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: createAdminSessionToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error(
      'Admin login failed:',
      error instanceof Error ? error.name : 'Unknown error'
    );

    return NextResponse.json(
      { success: false, error: 'Unable to complete login.' },
      { status: 500 }
    );
  }
}
