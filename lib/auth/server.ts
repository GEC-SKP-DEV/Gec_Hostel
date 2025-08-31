import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebaseadmin';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export type AuthContext = {
  firebaseUid: string;
  userId: number; // DB users.uid
  userRole: string | null;
  displayName?: string | null;
};

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return null;
  const [type, token] = authHeader.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export async function verifyRequest(req: NextRequest): Promise<AuthContext | null> {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const firebaseUid = decoded.uid;
    const name = decoded.name ?? null;

    // Lookup or create DB user mapping
    let [dbUser] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    if (!dbUser) {
      const inserted = await db
        .insert(users)
        .values({ firebaseUid, userRole: 'user', displayName: name ?? undefined })
        .returning();
      dbUser = inserted[0];
    }

    return {
      firebaseUid,
      userId: dbUser.uid,
      userRole: dbUser.userRole ?? null,
      displayName: dbUser.displayName ?? null,
    };
  } catch {
    return null;
  }
}

export async function requireUser(req: NextRequest): Promise<AuthContext> {
  const ctx = await verifyRequest(req);
  if (!ctx) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return ctx;
}

export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const ctx = await requireUser(req);
  const role = (ctx.userRole || '').toLowerCase();
  if (!(role === 'admin' || role === 'superadmin' || role === 'super_admin')) {
    throw new Response('Forbidden', { status: 403 });
  }
  return ctx;
}
