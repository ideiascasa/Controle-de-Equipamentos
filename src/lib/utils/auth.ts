import type { RequestEvent } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCase, encodeBase64url, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/db';
import * as table from '$lib/db/schema';
import { SESSION_EXPIRY_HOURS, SESSION_COOKIE_NAME } from '$env/static/private';
import { getUserGroupsAndAdmin } from '$lib/utils/common';
import { m } from '$lib/paraglide/messages.js';

const HOUR_IN_MS = 1000 * 60 * 60 * Number(SESSION_EXPIRY_HOURS);

export const sessionCookieName = SESSION_COOKIE_NAME;

// Helper function to create UTC dates
export function createUTCDate(timestamp: number): Date {
	const date = new Date(timestamp);
	// Ensure the date is valid
	if (isNaN(date.getTime())) {
		throw new Error(m.invalidDateValue());
	}
	return date;
}

export function generateSessionToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	// Use UTC timestamp to avoid timezone issues
	const now = Date.now();
	const expiresAt = createUTCDate(now + HOUR_IN_MS);
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt
	};
	await db.insert(table.session).values(session);

	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	
	let result;
	try {
		const results = await db
			.select({
				// Adjust user table here to tweak returned data
				user: { id: table.user.id, username: table.user.username, name: table.user.name },
				session: table.session
			})
			.from(table.session)
			.innerJoin(table.user, eq(table.session.userId, table.user.id))
			.where(eq(table.session.id, sessionId))
			.limit(1);
		
		result = results[0];
	} catch (error) {
		// Handle case when tables are empty or query fails
		return { session: null, user: null, groups: null };
	}

	if (!result) {
		return { session: null, user: null, groups: null };
	}
	const { session, user } = result;

	// Ensure expiresAt is a valid Date object
	if (!session.expiresAt || isNaN(session.expiresAt.getTime())) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null, groups: null };
	}

	// Use UTC timestamp for comparison
	const now = Date.now();
	const expiresAtTime = session.expiresAt.getTime();
	const sessionExpired = now >= expiresAtTime;
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null, groups: null };
	}

	const renewSession = now >= expiresAtTime - HOUR_IN_MS / 2;
	if (renewSession) {
		const oldExpiresAt = session.expiresAt;
		session.expiresAt = createUTCDate(now + HOUR_IN_MS);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	const groups = await getUserGroupsAndAdmin(db, user.id);

	return { session, user, groups };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	let session;
	try {
		const results = await db
			.select()
			.from(table.session)
			.where(eq(table.session.id, sessionId))
			.limit(1);
		session = results[0];
	} catch (error) {
		// Handle case when tables are empty or query fails
		session = undefined;
	}

	await db.delete(table.session).where(eq(table.session.id, sessionId));

}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	// Validate date and ensure it's a valid Date object
	if (!expiresAt || isNaN(expiresAt.getTime())) {
		throw new Error(m.invalidExpirationDate());
	}
	// Ensure the date is treated as UTC for cookie expiration
	const utcDate = new Date(expiresAt.toISOString());
	event.cookies.set(sessionCookieName, token, {
		expires: utcDate,
		path: '/'
	});
}

export function deleteSessionTokenCookie(event: RequestEvent) {
	event.cookies.delete(sessionCookieName, {
		path: '/'
	});
}
